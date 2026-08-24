import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken, COOKIE_NAME } from '@/lib/auth';
import { RegisterSchema } from '@/lib/validation';
import { Role } from '@prisma/client';
import { logRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      logRequest({ requestId, method: 'POST', path: '/api/auth/register', statusCode: 409, durationMs: Date.now() - start });
      return NextResponse.json(
        { success: false, error: 'A user with this email address already exists' },
        { status: 409 }
      );
    }

    // Hash password & create user
    const passwordHash = await hashPassword(validated.password);
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: (validated.role as Role) || Role.EMPLOYEE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Create Audit Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ email: user.email, role: user.role }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    // Generate JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'Account registered successfully',
    }, { status: 201 });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    logRequest({ requestId, method: 'POST', path: '/api/auth/register', statusCode: 201, userId: user.id, durationMs: Date.now() - start });
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Registration failed';
    logRequest({ requestId, method: 'POST', path: '/api/auth/register', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
