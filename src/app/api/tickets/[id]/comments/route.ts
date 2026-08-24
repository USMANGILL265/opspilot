import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { AddTicketCommentSchema } from '@/lib/validation';

export async function POST(
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
    const validated = AddTicketCommentSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: params.id,
        userId: user.userId,
        content: validated.content,
        isInternal: validated.isInternal,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'ADD_TICKET_COMMENT',
        entityType: 'TICKET',
        entityId: params.id,
        details: JSON.stringify({ isInternal: validated.isInternal }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error adding comment';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
