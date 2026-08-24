import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, hasRequiredRole } from '@/lib/auth';
import { UpdateCustomerSchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { CustomerStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      tickets: {
        orderBy: { createdAt: 'desc' },
        include: {
          assignedToUser: { select: { id: true, name: true, email: true } },
          aiAnalysis: true,
        },
      },
    },
  });

  if (!customer || customer.deletedAt) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }

  // Fetch recent activity logs related to this customer
  const activityLogs = await prisma.activityLog.findMany({
    where: { entityType: 'CUSTOMER', entityId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...customer,
      activityLogs,
    },
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
    const validated = UpdateCustomerSchema.parse(body);

    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.email && { email: validated.email.toLowerCase() }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
        ...(validated.company !== undefined && { company: validated.company }),
        ...(validated.status && { status: validated.status as CustomerStatus }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: updated.id,
        details: JSON.stringify({ changes: validated }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Customer updated successfully',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating customer';
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

  // Only ADMIN and MANAGER roles can delete/archive customers
  if (!hasRequiredRole(user.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to archive customers' }, { status: 403 });
  }

  const existing = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.deletedAt) {
    return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
  }

  // Soft delete
  await prisma.customer.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.userId,
      action: 'ARCHIVE_CUSTOMER',
      entityType: 'CUSTOMER',
      entityId: params.id,
      details: JSON.stringify({ customerName: existing.name }),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    },
  });

  await cacheService.del('dashboard:stats');

  return NextResponse.json({
    success: true,
    message: 'Customer archived successfully',
  });
}
