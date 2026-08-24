import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { aiService } from '@/lib/ai/ai-service';

export async function POST(
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
    include: { customer: true, aiAnalysis: true },
  });

  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
  }

  // If already analyzed, return cached suggested response, otherwise generate
  if (ticket.aiAnalysis?.suggestedResponse) {
    return NextResponse.json({
      success: true,
      data: { suggestedResponse: ticket.aiAnalysis.suggestedResponse },
    });
  }

  const responseText = await aiService.generateSuggestedResponse({
    subject: ticket.subject,
    description: ticket.description,
    customerName: ticket.customer?.name,
  });

  return NextResponse.json({
    success: true,
    data: { suggestedResponse: responseText },
  });
}
