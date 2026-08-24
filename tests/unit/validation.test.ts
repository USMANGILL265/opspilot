import { describe, it, expect } from 'vitest';
import {
  RegisterSchema,
  LoginSchema,
  CreateCustomerSchema,
  CreateProductSchema,
  CreateTicketSchema,
} from '../../src/lib/validation';

describe('Zod Request Validation Schemas', () => {
  it('should validate customer registration payload', () => {
    const valid = {
      name: 'Muhammad Usman Gill',
      email: 'usman@opspilot.com',
      password: 'SecurePassword123!',
      role: 'ADMIN',
    };
    expect(RegisterSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = { ...valid, email: 'not-an-email' };
    expect(RegisterSchema.safeParse(invalidEmail).success).toBe(false);

    const shortPassword = { ...valid, password: 'short' };
    expect(RegisterSchema.safeParse(shortPassword).success).toBe(false);
  });

  it('should validate customer creation payload', () => {
    const valid = {
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      company: 'Acme Global',
      phone: '+1 555-1234',
      status: 'ACTIVE',
    };
    expect(CreateCustomerSchema.safeParse(valid).success).toBe(true);

    const missingName = { email: 'test@example.com' };
    expect(CreateCustomerSchema.safeParse(missingName).success).toBe(false);
  });

  it('should validate product creation payload with positive price and SKU', () => {
    const valid = {
      name: 'Enterprise Server Node',
      sku: 'SRV-001-ALPHA',
      price: 1999.99,
      stock: 10,
      status: 'IN_STOCK',
    };
    expect(CreateProductSchema.safeParse(valid).success).toBe(true);

    const negativePrice = { ...valid, price: -50 };
    expect(CreateProductSchema.safeParse(negativePrice).success).toBe(false);
  });

  it('should validate support ticket creation payload', () => {
    const valid = {
      customerId: 'cust_123',
      subject: 'Telemetry connection interrupted',
      description: 'The telemetry connection has been dropping every 5 minutes.',
      priority: 'HIGH',
      category: 'TECHNICAL',
    };
    expect(CreateTicketSchema.safeParse(valid).success).toBe(true);

    const shortDescription = { ...valid, description: 'short' };
    expect(CreateTicketSchema.safeParse(shortDescription).success).toBe(false);
  });
});
