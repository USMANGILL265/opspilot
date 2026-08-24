import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { CreateTicketSchema, TicketQuerySchema } from '@/lib/validation';
import { queueTicketAIAnalysis } from '@/lib/queue';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { TicketPriority, TicketCategory, TicketStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = TicketQuerySchema.parse(searchParams);

    const skip = (query.page - 1) * query.limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (query.status) where.status = query.status as TicketStatus;
    if (query.priority) where.priority = query.priority as TicketPriority;
    if (query.category) where.category = query.category as TicketCategory;
    if (query.customerId) where.customerId = query.customerId;
    if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          customer: { select: { id: true, name: true, email: true, company: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
          assignedToUser: { select: { id: true, name: true, email: true } },
          aiAnalysis: {
            select: {
              priority: true,
              category: true,
              sentiment: true,
              summary: true,
              processingTimeMs: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    logRequest({ requestId, method: 'GET', path: '/api/tickets', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching tickets';
    logRequest({ requestId, method: 'GET', path: '/api/tickets', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateTicketSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });

    if (!customer || customer.deletedAt) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // Generate unique sequential ticket number (OP-XXXX)
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `OP-${1001 + ticketCount}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: validated.customerId,
        createdByUserId: user.userId,
        assignedToUserId: validated.assignedToUserId || null,
        subject: validated.subject,
        description: validated.description,
        priority: (validated.priority as TicketPriority) || TicketPriority.MEDIUM,
        category: (validated.category as TicketCategory) || TicketCategory.GENERAL,
        status: TicketStatus.OPEN,
      },
      include: {
        customer: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        assignedToUser: { select: { id: true, name: true, email: true } },
      },
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_TICKET',
        entityType: 'TICKET',
        entityId: ticket.id,
        details: JSON.stringify({ ticketNumber: ticket.ticketNumber, subject: ticket.subject }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    // Dispatch Asynchronous Background AI Analysis Job via BullMQ queue
    await queueTicketAIAnalysis(ticket.id, user.userId);

    // Invalidate cached stats
    await cacheService.del('dashboard:stats');

    logRequest({ requestId, method: 'POST', path: '/api/tickets', statusCode: 201, userId: user.userId, durationMs: Date.now() - start });
    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully and enqueued for background AI triaging',
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating ticket';
    logRequest({ requestId, method: 'POST', path: '/api/tickets', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
