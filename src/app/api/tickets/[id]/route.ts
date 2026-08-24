import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, hasRequiredRole } from '@/lib/auth';
import { UpdateTicketSchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { TicketPriority, TicketCategory, TicketStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      createdByUser: { select: { id: true, name: true, email: true, role: true } },
      assignedToUser: { select: { id: true, name: true, email: true, role: true } },
      aiAnalysis: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        },
      },
      assignments: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignedByUser: { select: { id: true, name: true } },
          assignedToUser: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: ticket,
  });
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = UpdateTicketSchema.parse(body);

    const existing = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    // Role checks for assignment: Only Manager or Admin can assign/reassign tickets
    if (validated.assignedToUserId !== undefined && validated.assignedToUserId !== existing.assignedToUserId) {
      if (!hasRequiredRole(user.role, ['ADMIN', 'MANAGER'])) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only Managers and Admins can assign tickets' },
          { status: 403 }
        );
      }

      if (validated.assignedToUserId) {
        await prisma.ticketAssignment.create({
          data: {
            ticketId: existing.id,
            assignedByUserId: user.userId,
            assignedToUserId: validated.assignedToUserId,
            note: 'Ticket assignment updated',
          },
        });
      }
    }

    // Handle resolution timestamp
    let resolvedAt = existing.resolvedAt;
    if (validated.status === 'RESOLVED' || validated.status === 'CLOSED') {
      resolvedAt = resolvedAt || new Date();
    } else if (validated.status) {
      resolvedAt = null;
    }

    const updated = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ...(validated.subject && { subject: validated.subject }),
        ...(validated.description && { description: validated.description }),
        ...(validated.priority && { priority: validated.priority as TicketPriority }),
        ...(validated.category && { category: validated.category as TicketCategory }),
        ...(validated.status && { status: validated.status as TicketStatus }),
        ...(validated.assignedToUserId !== undefined && { assignedToUserId: validated.assignedToUserId }),
        resolvedAt,
      },
      include: {
        customer: true,
        assignedToUser: { select: { id: true, name: true, email: true } },
        aiAnalysis: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_TICKET',
        entityType: 'TICKET',
        entityId: updated.id,
        details: JSON.stringify({ changes: validated }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Ticket updated successfully',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating ticket';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden: Only Admins can delete tickets' }, { status: 403 });
  }

  await prisma.ticket.delete({
    where: { id: params.id },
  });

  await cacheService.del('dashboard:stats');

  return NextResponse.json({
    success: true,
    message: 'Ticket deleted successfully',
  });
}
