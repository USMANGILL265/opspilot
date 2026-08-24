import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const memory = process.memoryUsage();

  const [totalUsers, totalCustomers, totalProducts, totalTickets] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.ticket.count(),
  ]);

  const metrics = {
    app: 'opspilot',
    timestamp: new Date().toISOString(),
    process: {
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
      pid: process.pid,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        externalMb: Math.round(memory.external / (1024 * 1024)),
      },
    },
    database: {
      totalUsers,
      totalCustomers,
      totalProducts,
      totalTickets,
    },
  };

  return NextResponse.json(metrics);
}
