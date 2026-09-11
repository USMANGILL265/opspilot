import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, generateToken, COOKIE_NAME } from '@/lib/auth';
import { LoginSchema } from '@/lib/validation';
import { logRequest } from '@/lib/logger';
import { rateLimit, getClientKey } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rate = rateLimit(getClientKey(request, 'login'), 5, 60000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const validated = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      logRequest({ requestId, method: 'POST', path: '/api/auth/login', statusCode: 401, durationMs: Date.now() - start });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(validated.password, user.passwordHash);
    if (!isMatch) {
      logRequest({ requestId, method: 'POST', path: '/api/auth/login', statusCode: 401, durationMs: Date.now() - start });
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Record login audit log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        details: JSON.stringify({ email: user.email }),
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        },
        token,
      },
      message: 'Login successful',
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    logRequest({ requestId, method: 'POST', path: '/api/auth/login', statusCode: 200, userId: user.id, durationMs: Date.now() - start });
    return response;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Login failed';
    logRequest({ requestId, method: 'POST', path: '/api/auth/login', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
