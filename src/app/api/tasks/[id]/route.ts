import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, hasRequiredRole } from '@/lib/auth';
import { UpdateTaskSchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { TaskStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignedToUser: {
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: task,
  });
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = UpdateTaskSchema.parse(body);

    const existing = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (validated.assignedToUserId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validated.assignedToUserId },
      });
      if (!assignee) {
        return NextResponse.json({ success: false, error: 'Assignee user not found' }, { status: 404 });
      }
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status && { status: validated.status as TaskStatus }),
        ...(validated.dueDate !== undefined && {
          dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        }),
        ...(validated.assignedToUserId !== undefined && {
          assignedToUserId: validated.assignedToUserId,
        }),
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
        action: 'UPDATE_TASK',
        entityType: 'TASK',
        entityId: updated.id,
        details: JSON.stringify({ changes: validated }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    logRequest({
      requestId,
      method: 'PATCH',
      path: `/api/tasks/${params.id}`,
      statusCode: 200,
      userId: user.userId,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Task updated successfully',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating task';
    logRequest({
      requestId,
      method: 'PATCH',
      path: `/api/tasks/${params.id}`,
      statusCode: 400,
      error: errorMsg,
      durationMs: Date.now() - start,
    });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Only ADMIN and MANAGER roles can delete tasks
  if (!hasRequiredRole(user.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Insufficient permissions to delete tasks' },
      { status: 403 }
    );
  }

  const existing = await prisma.task.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
  }

  await prisma.task.delete({
    where: { id: params.id },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.userId,
      action: 'DELETE_TASK',
      entityType: 'TASK',
      entityId: params.id,
      details: JSON.stringify({ taskTitle: existing.title }),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    },
  });

  await cacheService.del('dashboard:stats');

  logRequest({
    requestId,
    method: 'DELETE',
    path: `/api/tasks/${params.id}`,
    statusCode: 200,
    userId: user.userId,
    durationMs: Date.now() - start,
  });

  return NextResponse.json({
    success: true,
    message: 'Task deleted successfully',
  });
}
