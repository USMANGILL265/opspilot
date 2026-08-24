import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { CreateProductSchema, ProductQuerySchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';
import { logRequest } from '@/lib/logger';
import { ProductStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = ProductQuerySchema.parse(searchParams);

    const skip = (query.page - 1) * query.limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status as ProductStatus;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.limit) || 1;

    logRequest({ requestId, method: 'GET', path: '/api/products', statusCode: 200, userId: user.userId, durationMs: Date.now() - start });

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error fetching products';
    logRequest({ requestId, method: 'GET', path: '/api/products', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const user = getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateProductSchema.parse(body);

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: validated.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { success: false, error: `Product with SKU "${validated.sku}" already exists` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        sku: validated.sku,
        description: validated.description || null,
        categoryId: validated.categoryId || null,
        price: validated.price,
        stock: validated.stock,
        status: (validated.status as ProductStatus) || ProductStatus.IN_STOCK,
      },
      include: {
        category: true,
      },
    });

    // Record Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.userId,
        action: 'CREATE_PRODUCT',
        entityType: 'PRODUCT',
        entityId: product.id,
        details: JSON.stringify({ name: product.name, sku: product.sku, price: product.price }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    await cacheService.del('dashboard:stats');

    logRequest({ requestId, method: 'POST', path: '/api/products', statusCode: 201, userId: user.userId, durationMs: Date.now() - start });
    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully',
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating product';
    logRequest({ requestId, method: 'POST', path: '/api/products', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
