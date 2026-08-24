import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { DashboardStats } from '@/types';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const cacheKey = 'dashboard:stats';

  try {
    // 1. Check Cache
    const cachedStats = await cacheService.get<DashboardStats>(cacheKey);
    if (cachedStats) {
      logRequest({ requestId, method: 'GET', path: '/api/dashboard/stats', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });
      return NextResponse.json({
        success: true,
        data: cachedStats,
        source: 'CACHE',
      });
    }

    // 2. Aggregate DB Metrics in Parallel
    const [
      totalCustomers,
      totalProducts,
      openTasks,
      completedTasks,
      openTickets,
      resolvedTickets,
      urgentTickets,
      positiveSentimentCount,
      neutralSentimentCount,
      negativeSentimentCount,
      recentActivity,
    ] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING'] } } }),
      prisma.ticket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.ticket.count({ where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.aIAnalysis.count({ where: { sentiment: 'POSITIVE' } }),
      prisma.aIAnalysis.count({ where: { sentiment: 'NEUTRAL' } }),
      prisma.aIAnalysis.count({ where: { sentiment: 'NEGATIVE' } }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    // 3. Generate Dynamic AI Insights
    const aiInsights: string[] = [];
    if (urgentTickets > 0) {
      aiInsights.push(`⚠️ ${urgentTickets} urgent support tickets need immediate triage.`);
    } else {
      aiInsights.push('✅ No urgent support bottlenecks detected in active queues.');
    }

    const totalAnalyzed = positiveSentimentCount + neutralSentimentCount + negativeSentimentCount;
    if (totalAnalyzed > 0) {
      const negPercent = Math.round((negativeSentimentCount / totalAnalyzed) * 100);
      if (negPercent > 40) {
        aiInsights.push(`📈 Negative customer sentiment is elevated at ${negPercent}%. Consider reviewing delivery & billing flows.`);
      } else {
        aiInsights.push(`✨ Overall customer satisfaction is stable (${100 - negPercent}% positive/neutral sentiment).`);
      }
    } else {
      aiInsights.push('💡 AI Background Triaging is ready to analyze newly arriving tickets.');
    }

    if (totalProducts > 0) {
      aiInsights.push(`📦 Product catalog active with ${totalProducts} tracked SKUs across all operational categories.`);
    }

    const stats: DashboardStats = {
      totalCustomers,
      totalProducts,
      openTasks,
      completedTasks,
      openTickets,
      resolvedTickets,
      urgentTickets,
      sentimentBreakdown: {
        positive: positiveSentimentCount,
        neutral: neutralSentimentCount,
        negative: negativeSentimentCount,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentActivity: recentActivity as any,
      aiInsights,
    };

    // Cache stats for 60 seconds
    await cacheService.set(cacheKey, stats, 60);

    logRequest({ requestId, method: 'GET', path: '/api/dashboard/stats', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: stats,
      source: 'DATABASE',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error computing dashboard statistics';
    logRequest({ requestId, method: 'GET', path: '/api/dashboard/stats', statusCode: 500, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
