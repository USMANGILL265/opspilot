import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db';
import { cacheService } from '@/lib/cache';
import { aiService } from '@/lib/ai/ai-service';

export async function GET(request: NextRequest) {
  const isReadyCheck = request.nextUrl.searchParams.get('type') === 'ready';

  const startTime = Date.now();
  const dbHealthy = await checkDatabaseHealth();
  const cacheStatus = cacheService.getStatus();
  const aiStatus = aiService.getStatus();

  const isHealthy = dbHealthy;
  const statusCode = isHealthy ? 200 : 503;

  const healthReport = {
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    checks: {
      database: {
        status: dbHealthy ? 'HEALTHY' : 'UNHEALTHY',
        provider: 'postgresql',
      },
      cache: {
        status: 'HEALTHY',
        mode: cacheStatus.mode,
        redisConnected: cacheStatus.isRedisConnected,
      },
      aiService: {
        status: 'HEALTHY',
        activeProvider: aiStatus.activeProvider,
        activeModel: aiStatus.activeModel,
      },
    },
    responseTimeMs: Date.now() - startTime,
  };

  return NextResponse.json(healthReport, { status: statusCode });
}
