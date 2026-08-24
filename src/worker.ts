import { Worker, Job } from 'bullmq';
import { processTicketAnalysisJob, TicketAnalysisJobData } from './lib/queue';
import { createChildLogger } from './lib/logger';

const log = createChildLogger('StandaloneWorker');

const QUEUE_NAME = process.env.QUEUE_NAME || 'ticket-ai-queue';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '5', 10);

async function startWorker() {
  log.info(`Starting OpsPilot BullMQ Worker for queue: "${QUEUE_NAME}" (Concurrency: ${CONCURRENCY})`);

  const worker = new Worker<TicketAnalysisJobData>(
    QUEUE_NAME,
    async (job: Job<TicketAnalysisJobData>) => {
      log.info({ jobId: job.id, data: job.data }, 'Processing job');
      await processTicketAnalysisJob(job.data.ticketId, job.data.triggerUserId);
    },
    {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      },
      concurrency: CONCURRENCY,
    }
  );

  worker.on('completed', (job) => {
    log.info({ jobId: job.id }, 'Job completed successfully');
  });

  worker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, error: err.message }, 'Job failed');
  });

  worker.on('error', (err) => {
    log.error({ error: err.message }, 'Worker encountered error');
  });

  const shutdown = async () => {
    log.info('Shutting down BullMQ worker...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startWorker().catch((err) => {
  log.error({ error: err }, 'Fatal error starting worker');
  process.exit(1);
});
