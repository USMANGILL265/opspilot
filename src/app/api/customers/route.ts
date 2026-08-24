import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { CreateCustomerSchema, CustomerQuerySchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { CustomerStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = CustomerQuerySchema.parse(searchParams);

    const skip = (query.page - 1) * query.limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status as CustomerStatus;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          _count: {
            select: { tickets: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    logRequest({ requestId, method: 'GET', path: '/api/customers', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching customers';
    logRequest({ requestId, method: 'GET', path: '/api/customers', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
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
    const validated = CreateCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        phone: validated.phone || null,
        company: validated.company || null,
        status: (validated.status as CustomerStatus) || CustomerStatus.ACTIVE,
        notes: validated.notes || null,
      },
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        details: JSON.stringify({ name: customer.name, email: customer.email, company: customer.company }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    // Invalidate dashboard metrics cache
    await cacheService.del('dashboard:stats');

    logRequest({ requestId, method: 'POST', path: '/api/customers', statusCode: 201, userId: user.userId, durationMs: Date.now() - start });
    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating customer';
    logRequest({ requestId, method: 'POST', path: '/api/customers', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
