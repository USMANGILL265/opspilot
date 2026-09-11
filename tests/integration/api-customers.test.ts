import { describe, it, expect } from 'vitest';
import { CreateCustomerSchema, UpdateCustomerSchema, CustomerQuerySchema } from '../../src/lib/validation';

describe('Customer API Validation & Business Rules', () => {
  it('should accept valid customer payloads with minimum required fields', () => {
    const valid = CreateCustomerSchema.parse({
      name: 'Acme Logistics Ltd',
      email: 'contact@acmelogistics.com',
    });

    expect(valid.name).toBe('Acme Logistics Ltd');
    expect(valid.email).toBe('contact@acmelogistics.com');
    expect(valid.status).toBe('ACTIVE');
  });

  it('should reject customer payload with invalid email address', () => {
    expect(() => {
      CreateCustomerSchema.parse({
        name: 'Invalid Email Corp',
        email: 'not-an-email',
      });
    }).toThrow(/Invalid email address/);
  });

  it('should reject customer payload with name shorter than 2 characters', () => {
    expect(() => {
      CreateCustomerSchema.parse({
        name: 'A',
        email: 'valid@example.com',
      });
    }).toThrow(/at least 2 characters/);
  });

  it('should allow partial updates in UpdateCustomerSchema', () => {
    const patch = UpdateCustomerSchema.parse({
      company: 'Acme International Holding',
      status: 'LEAD',
    });

    expect(patch.company).toBe('Acme International Holding');
    expect(patch.status).toBe('LEAD');
    expect(patch.name).toBeUndefined();
  });

  it('should validate and sanitize customer query pagination parameters', () => {
    const query = CustomerQuerySchema.parse({
      page: '3',
      limit: '25',
      search: 'Apex',
      status: 'ACTIVE',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(query.page).toBe(3);
    expect(query.limit).toBe(25);
    expect(query.search).toBe('Apex');
    expect(query.status).toBe('ACTIVE');
    expect(query.sortBy).toBe('name');
    expect(query.sortOrder).toBe('asc');
  });
});
