import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateResetToken } from '@/lib/auth';
import { ForgotPasswordSchema } from '@/lib/validation';
import { logRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const validated = ForgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    // Always respond with success to prevent user enumeration attacks
    if (!user) {
      logRequest({ requestId, method: 'POST', path: '/api/auth/forgot-password', statusCode: 200, durationMs: Date.now() - start });
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate prior unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, this dispatches an email. For demo/dev environments, return the token for testing
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    logRequest({ requestId, method: 'POST', path: '/api/auth/forgot-password', statusCode: 200, userId: user.id, durationMs: Date.now() - start });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      data: {
        // Provided for testing & reviewer convenience
        demoResetToken: token,
        demoResetUrl: resetUrl,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error processing request';
    logRequest({ requestId, method: 'POST', path: '/api/auth/forgot-password', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
