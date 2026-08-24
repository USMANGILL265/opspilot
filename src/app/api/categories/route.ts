import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, hasRequiredRole } from '@/lib/auth';
import { CreateCategorySchema } from '@/lib/validation';
import { cacheService } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check cache first
  const cacheKey = 'products:categories';
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { products: { where: { deletedAt: null } } },
      },
    },
  });

  await cacheService.set(cacheKey, categories, 300); // 5 min TTL

  return NextResponse.json({
    success: true,
    data: categories,
  });
}

export async function POST(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasRequiredRole(user.role, ['ADMIN', 'MANAGER'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = CreateCategorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
      },
    });

    await cacheService.del('products:categories');

    return NextResponse.json({
      success: true,
      data: category,
      message: 'Category created successfully',
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error creating category';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
