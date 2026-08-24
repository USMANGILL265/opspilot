import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateResetToken,
  hashResetToken,
  hasRequiredRole,
  isAuthorized,
} from '../../src/lib/auth';

describe('Auth & RBAC Utilities', () => {
  it('should securely hash and verify passwords', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword('WrongPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('should generate and verify signed JWT tokens', () => {
    const payload = {
      userId: 'usr_test_123',
      email: 'admin@opspilot.com',
      role: 'ADMIN' as const,
      name: 'Muhammad Usman Gill',
    };

    const token = generateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe('ADMIN');
  });

  it('should return null for invalid or tampered tokens', () => {
    const invalidToken = 'invalid.jwt.token.string';
    const decoded = verifyToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it('should generate secure password reset token and matching SHA-256 hash', () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);

    const computedHash = hashResetToken(token);
    expect(computedHash).toBe(tokenHash);
  });

  it('should correctly enforce Role-Based Access Control (RBAC) hierarchy', () => {
    // Admin has access to everything
    expect(hasRequiredRole('ADMIN', ['ADMIN'])).toBe(true);
    expect(hasRequiredRole('ADMIN', ['MANAGER'])).toBe(true);
    expect(hasRequiredRole('ADMIN', ['EMPLOYEE'])).toBe(true);

    // Manager has manager and employee access
    expect(hasRequiredRole('MANAGER', ['MANAGER'])).toBe(true);
    expect(hasRequiredRole('MANAGER', ['EMPLOYEE'])).toBe(true);
    expect(hasRequiredRole('MANAGER', ['ADMIN'])).toBe(false);

    // Employee has only employee access
    expect(hasRequiredRole('EMPLOYEE', ['EMPLOYEE'])).toBe(true);
    expect(hasRequiredRole('EMPLOYEE', ['MANAGER'])).toBe(false);
    expect(hasRequiredRole('EMPLOYEE', ['ADMIN'])).toBe(false);

    // isAuthorized hierarchy helper
    expect(isAuthorized('ADMIN', 'MANAGER')).toBe(true);
    expect(isAuthorized('MANAGER', 'EMPLOYEE')).toBe(true);
    expect(isAuthorized('EMPLOYEE', 'MANAGER')).toBe(false);
  });
});
