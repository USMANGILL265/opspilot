import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { CreateTaskSchema, TaskQuerySchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { TaskStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = TaskQuerySchema.parse(searchParams);

    const skip = (query.page - 1) * query.limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (query.status) where.status = query.status as TaskStatus;
    if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          assignedToUser: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    logRequest({
      requestId,
      method: 'GET',
      path: '/api/tasks',
      statusCode: 200,
      userId: user.userId,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching tasks';
    logRequest({
      requestId,
      method: 'GET',
      path: '/api/tasks',
      statusCode: 400,
      error: errorMsg,
      durationMs: Date.now() - start,
    });
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
    const validated = CreateTaskSchema.parse(body);

    if (validated.assignedToUserId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validated.assignedToUserId },
      });
      if (!assignee) {
        return NextResponse.json({ success: false, error: 'Assignee user not found' }, { status: 404 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        status: (validated.status as TaskStatus) || TaskStatus.PENDING,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        assignedToUserId: validated.assignedToUserId || null,
      },
      include: {
        assignedToUser: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_TASK',
        entityType: 'TASK',
        entityId: task.id,
        details: JSON.stringify({ title: task.title, status: task.status }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    logRequest({
      requestId,
      method: 'POST',
      path: '/api/tasks',
      statusCode: 201,
      userId: user.userId,
      durationMs: Date.now() - start,
    });

    return NextResponse.json(
      {
        success: true,
        data: task,
        message: 'Task created successfully',
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating task';
    logRequest({
      requestId,
      method: 'POST',
      path: '/api/tasks',
      statusCode: 400,
      error: errorMsg,
      durationMs: Date.now() - start,
    });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
