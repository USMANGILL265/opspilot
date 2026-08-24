import { Queue, Worker, Job } from 'bullmq';
import { prisma } from '../db';
import { aiService } from '../ai/ai-service';
import { cacheService } from '../cache';
import { createChildLogger } from '../logger';

const log = createChildLogger('QueueService');

const QUEUE_NAME = process.env.QUEUE_NAME || 'ticket-ai-queue';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export interface TicketAnalysisJobData {
  ticketId: string;
  triggerUserId?: string;
}

let ticketQueue: Queue<TicketAnalysisJobData> | null = null;
let isQueueInitialized = false;

function getRedisConnectionOptions() {
  return {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 100, 1000)),
  };
}

export function initQueue(): Queue<TicketAnalysisJobData> | null {
  if (isQueueInitialized) return ticketQueue;
  isQueueInitialized = true;

  try {
    ticketQueue = new Queue<TicketAnalysisJobData>(QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    });

    ticketQueue.on('error', (err) => {
      log.warn({ error: err.message }, 'BullMQ Queue connection warning; running inline async fallback.');
    });

    log.info(`BullMQ Queue "${QUEUE_NAME}" initialized successfully.`);
    return ticketQueue;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log.warn({ error: message }, 'BullMQ initialization failed; will use inline async processing.');
    return null;
  }
}

/**
 * Process a Ticket AI Analysis Job
 */
export async function processTicketAnalysisJob(ticketId: string, triggerUserId?: string) {
  log.info({ ticketId }, 'Starting background AI analysis for ticket');

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { customer: true },
  });

  if (!ticket) {
    log.error({ ticketId }, 'Ticket not found for background AI processing');
    return;
  }

  // Execute AI Analysis
  const result = await aiService.analyzeTicket({
    subject: ticket.subject,
    description: ticket.description,
    customerName: ticket.customer?.name,
    customerCompany: ticket.customer?.company || undefined,
  });

  // Upsert AI Analysis in Database
  await prisma.aIAnalysis.upsert({
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

  // Automatically update ticket priority if not explicitly changed by user
  if (ticket.status === 'OPEN') {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        priority: result.analysis.priority,
        category: result.analysis.category,
      },
    });
  }

  // Create Activity Log
  await prisma.activityLog.create({
    data: {
      userId: triggerUserId || ticket.createdByUserId,
      action: 'AI_TICKET_ANALYSIS',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: JSON.stringify({
        provider: result.provider,
        sentiment: result.analysis.sentiment,
        priority: result.analysis.priority,
        category: result.analysis.category,
        processingTimeMs: result.processingTimeMs,
      }),
    },
  });

  // Invalidate cached dashboard metrics
  await cacheService.del('dashboard:stats');
  log.info({ ticketId, sentiment: result.analysis.sentiment, timeMs: result.processingTimeMs }, 'AI analysis completed and saved');
}

/**
 * Dispatch an AI analysis job (pushes to Redis BullMQ, or executes inline asynchronously if Redis is offline)
 */
export async function queueTicketAIAnalysis(ticketId: string, triggerUserId?: string): Promise<void> {
  const queue = initQueue();

  if (queue) {
    try {
      await queue.add('analyze-ticket', { ticketId, triggerUserId });
      log.info({ ticketId }, 'Enqueued ticket analysis job to BullMQ');
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ error: message, ticketId }, 'Queue push failed; dispatching inline asynchronous fallback worker');
    }
  }

  // Inline asynchronous fallback (non-blocking)
  setImmediate(async () => {
    try {
      await processTicketAnalysisJob(ticketId, triggerUserId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message, ticketId }, 'Inline AI analysis execution failed');
    }
  });
}
