import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../../src/lib/auth';
import { RegisterSchema, LoginSchema } from '../../src/lib/validation';

describe('Auth Integration Flows', () => {
  it('should complete registration validation and token issuance flow', async () => {
    const rawUserData = {
      name: 'Integration Test User',
      email: 'integration.user@opspilot.com',
      password: 'StrongPassword123!',
      role: 'EMPLOYEE' as const,
    };

    // 1. Validate payload
    const validated = RegisterSchema.parse(rawUserData);
    expect(validated.email).toBe('integration.user@opspilot.com');

    // 2. Hash password
    const hashedPassword = await hashPassword(validated.password);
    expect(hashedPassword).not.toBe(rawUserData.password);

    // 3. Issue Token
    const token = generateToken({
      userId: 'usr_integ_001',
      email: validated.email,
      role: validated.role,
      name: validated.name,
    });

    // 4. Authenticate & Verify Token
    const decoded = verifyToken(token);
    expect(decoded?.userId).toBe('usr_integ_001');
    expect(decoded?.role).toBe('EMPLOYEE');

    // 5. Verify credentials comparison
    const isValid = await comparePassword('StrongPassword123!', hashedPassword);
    expect(isValid).toBe(true);
  });
});
