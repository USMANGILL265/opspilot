import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, hashResetToken } from '@/lib/auth';
import { ResetPasswordSchema } from '@/lib/validation';
import { logRequest } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await request.json();
    const validated = ResetPasswordSchema.parse(body);

    const tokenHash = hashResetToken(validated.token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      logRequest({ requestId, method: 'POST', path: '/api/auth/reset-password', statusCode: 400, durationMs: Date.now() - start });
      return NextResponse.json(
        { success: false, error: 'Password reset link is invalid or has expired' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(validated.password);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          userId: resetRecord.userId,
          action: 'PASSWORD_RESET_SUCCESS',
          entityType: 'AUTH',
          entityId: resetRecord.userId,
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      }),
    ]);

    logRequest({ requestId, method: 'POST', path: '/api/auth/reset-password', statusCode: 200, userId: resetRecord.userId, durationMs: Date.now() - start });
    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. You can now login with your new password.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error resetting password';
    logRequest({ requestId, method: 'POST', path: '/api/auth/reset-password', statusCode: 400, error: errorMsg, durationMs: Date.now() - start });
    return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
  }
}
