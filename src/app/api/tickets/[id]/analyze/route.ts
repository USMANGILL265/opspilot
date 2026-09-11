import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { aiService } from '@/lib/ai/ai-service';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { rateLimit, getClientKey } from '@/lib/rate-limit';
import { initQueue } from '@/lib/queue';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const rate = rateLimit(getClientKey(request, 'ai-analyze'), 10, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many AI analysis requests. Please try again later.' },
      { status: 429 }
    );
  }

  const params = await props.params;
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: { customer: true },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const queue = initQueue();
    if (queue) {
      try {
        await queue.add('analyze-ticket', {
          ticketId: ticket.id,
          triggerUserId: user.userId,
        });

        logRequest({ requestId, method: 'POST', path: `/api/tickets/${params.id}/analyze`, statusCode: 202, userId: user.userId, durationMs: Date.now() - start });
        return NextResponse.json(
          {
            success: true,
            status: 'QUEUED',
            message: 'Analysis queued. Result will be available shortly.',
          },
          { status: 202 }
        );
      } catch {
        // Fall through to synchronous processing when queue submission fails.
      }
    }

    // Execute AI Analysis via abstraction layer
    const result = await aiService.analyzeTicket({
      subject: ticket.subject,
      description: ticket.description,
      customerName: ticket.customer?.name,
      customerCompany: ticket.customer?.company || undefined,
    });

    // Save to Database
    const aiRecord = await prisma.aIAnalysis.upsert({
      where: { ticketId: ticket.id },
      create: {
        ticketId: ticket.id,
        provider: result.provider,
        model: result.model,
        priority: result.analysis.priority,
        category: result.analysis.category,
        sentiment: result.analysis.sentiment,
        summary: result.analysis.summary,
        suggestedResponse: result.analysis.suggestedResponse,
        nextAction: result.analysis.nextAction,
        processingTimeMs: result.processingTimeMs,
      },
      update: {
        provider: result.provider,
        model: result.model,
        priority: result.analysis.priority,
        category: result.analysis.category,
        sentiment: result.analysis.sentiment,
        summary: result.analysis.summary,
        suggestedResponse: result.analysis.suggestedResponse,
        nextAction: result.analysis.nextAction,
        processingTimeMs: result.processingTimeMs,
        updatedAt: new Date(),
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'ON_DEMAND_AI_ANALYSIS',
        entityType: 'TICKET',
        entityId: ticket.id,
        details: JSON.stringify({
          provider: result.provider,
          sentiment: result.analysis.sentiment,
          priority: result.analysis.priority,
          latencyMs: result.processingTimeMs,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    logRequest({ requestId, method: 'POST', path: `/api/tickets/${params.id}/analyze`, statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: aiRecord,
      meta: {
        provider: result.provider,
        model: result.model,
        processingTimeMs: result.processingTimeMs,
        isFallback: result.isFallback,
      },
      message: 'Ticket analyzed successfully',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error executing AI analysis';
    logRequest({ requestId, method: 'POST', path: `/api/tickets/${params.id}/analyze`, statusCode: 500, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
