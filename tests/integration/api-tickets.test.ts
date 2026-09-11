import { describe, it, expect } from 'vitest';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  AddTicketCommentSchema,
  AssignTicketSchema,
  TicketQuerySchema,
} from '../../src/lib/validation';
import { hasRequiredRole } from '../../src/lib/auth';

describe('Support Ticket API Business Logic & Authorization', () => {
  it('should validate ticket creation payload with valid customer relation', () => {
    const ticket = CreateTicketSchema.parse({
      customerId: 'cust_enterprise_01',
      subject: 'Critical outage on EU payment gateway',
      description: 'Transactions fail with code 504 gateway timeout across all EU clients.',
      priority: 'URGENT',
      category: 'TECHNICAL',
    });

    expect(ticket.customerId).toBe('cust_enterprise_01');
    expect(ticket.priority).toBe('URGENT');
    expect(ticket.category).toBe('TECHNICAL');
  });

  it('should enforce role-based permissions for ticket assignment', () => {
    // ADMIN can assign tickets
    expect(hasRequiredRole('ADMIN', ['ADMIN', 'MANAGER'])).toBe(true);

    // MANAGER can assign tickets
    expect(hasRequiredRole('MANAGER', ['ADMIN', 'MANAGER'])).toBe(true);

    // EMPLOYEE cannot reassign tickets to other staff
    expect(hasRequiredRole('EMPLOYEE', ['ADMIN', 'MANAGER'])).toBe(false);
  });

  it('should validate ticket assignment schema', () => {
    const assignment = AssignTicketSchema.parse({
      assignedToUserId: 'usr_tech_lead_01',
      note: 'Assigned due to specialized European gateway routing expertise.',
    });

    expect(assignment.assignedToUserId).toBe('usr_tech_lead_01');
    expect(assignment.note).toContain('specialized');
  });

  it('should reject invalid ticket description less than 10 characters', () => {
    expect(() => {
      CreateTicketSchema.parse({
        customerId: 'cust_01',
        subject: 'Broken system',
        description: 'Too short',
      });
    }).toThrow(/at least 10 characters/);
  });

  it('should validate staff ticket comment with internal note flag', () => {
    const comment = AddTicketCommentSchema.parse({
      content: 'Contacted payment provider upstream NOC. Escalation ticket #PAY-8812 opened.',
      isInternal: true,
    });

    expect(comment.isInternal).toBe(true);
    expect(comment.content.length).toBeGreaterThan(15);
  });

  it('should parse ticket query filters correctly', () => {
    const query = TicketQuerySchema.parse({
      page: '2',
      limit: '20',
      status: 'OPEN',
      priority: 'URGENT',
      category: 'TECHNICAL',
      sortBy: 'priority',
      sortOrder: 'desc',
    });

    expect(query.page).toBe(2);
    expect(query.limit).toBe(20);
    expect(query.status).toBe('OPEN');
    expect(query.priority).toBe('URGENT');
    expect(query.category).toBe('TECHNICAL');
    expect(query.sortBy).toBe('priority');
  });
});
