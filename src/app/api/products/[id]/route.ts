import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, hasRequiredRole } from '@/lib/auth';
import { UpdateProductSchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { ProductStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
    },
  });

  if (!product || product.deletedAt) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: product,
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
    const validated = UpdateProductSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    if (validated.sku && validated.sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: validated.sku },
      });
      if (duplicateSku) {
        return NextResponse.json({ success: false, error: `SKU "${validated.sku}" is already in use` }, { status: 409 });
      }
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.sku && { sku: validated.sku }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.categoryId !== undefined && { categoryId: validated.categoryId }),
        ...(validated.price !== undefined && { price: validated.price }),
        ...(validated.stock !== undefined && { stock: validated.stock }),
        ...(validated.status && { status: validated.status as ProductStatus }),
      },
      include: {
        category: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'UPDATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: updated.id,
        details: JSON.stringify({ changes: validated }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Product updated successfully',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error updating product';
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

  if (!hasRequiredRole(user.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to archive products' }, { status: 403 });
  }

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!existing || existing.deletedAt) {
    return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.userId,
      action: 'ARCHIVE_PRODUCT',
      entityType: 'PRODUCT',
      entityId: params.id,
      details: JSON.stringify({ name: existing.name, sku: existing.sku }),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    },
  });

  await cacheService.del('dashboard:stats');

  return NextResponse.json({
    success: true,
    message: 'Product archived successfully',
  });
}
