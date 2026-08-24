import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { AuthUser, JWTPayload, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'opspilot_super_secret_jwt_key_32_characters_minimum';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const COOKIE_NAME = process.env.COOKIE_NAME || 'opspilot_session';

// Password Security
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT Token Operations
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Password Reset Token Helpers
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Extract User from NextRequest (Supports Cookies & Bearer Authorization Headers)
export function getAuthenticatedUser(request: NextRequest): JWTPayload | null {
  // 1. Check Authorization Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) return decoded;
  }

  // 2. Check Cookie
  const cookie = request.cookies.get(COOKIE_NAME);
  if (cookie?.value) {
    const decoded = verifyToken(cookie.value);
    if (decoded) return decoded;
  }

  return null;
}

// Role-Based Access Control (RBAC) Hierarchical Guard
const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (allowedRoles.includes(userRole)) return true;
  // Admin inherits all lower permissions
  if (userRole === 'ADMIN') return true;
  // Manager inherits employee permissions
  if (userRole === 'MANAGER' && allowedRoles.includes('EMPLOYEE')) return true;
  return false;
}

export function isAuthorized(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
