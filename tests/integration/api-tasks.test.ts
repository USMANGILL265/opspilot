import { describe, it, expect } from 'vitest';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '../../src/lib/validation';
import { hasRequiredRole } from '../../src/lib/auth';

describe('Operational Task Management API Rules', () => {
  it('should validate task creation with title and optional description', () => {
    const task = CreateTaskSchema.parse({
      title: 'Conduct weekly inventory cycle count',
      description: 'Verify warehouse aisle B4 for electronic sensors stock discrepancy.',
      status: 'PENDING',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(task.title).toBe('Conduct weekly inventory cycle count');
    expect(task.status).toBe('PENDING');
    expect(task.dueDate).toBeDefined();
  });

  it('should default status to PENDING when not provided', () => {
    const task = CreateTaskSchema.parse({
      title: 'Review supplier contract renewal',
    });

    expect(task.status).toBe('PENDING');
  });

  it('should reject task creation when title is too short', () => {
    expect(() => {
      CreateTaskSchema.parse({
        title: 'A',
      });
    }).toThrow(/at least 2 characters/);
  });

  it('should allow partial task updates', () => {
    const update = UpdateTaskSchema.parse({
      status: 'COMPLETED',
      assignedToUserId: 'usr_manager_01',
    });

    expect(update.status).toBe('COMPLETED');
    expect(update.assignedToUserId).toBe('usr_manager_01');
    expect(update.title).toBeUndefined();
  });

  it('should enforce role-based permissions for deleting tasks', () => {
    // Only Admin and Manager can delete tasks
    expect(hasRequiredRole('ADMIN', ['ADMIN', 'MANAGER'])).toBe(true);
    expect(hasRequiredRole('MANAGER', ['ADMIN', 'MANAGER'])).toBe(true);
    expect(hasRequiredRole('EMPLOYEE', ['ADMIN', 'MANAGER'])).toBe(false);
  });

  it('should validate task query sorting and filtering parameters', () => {
    const query = TaskQuerySchema.parse({
      page: '1',
      limit: '15',
      status: 'IN_PROGRESS',
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });

    expect(query.page).toBe(1);
    expect(query.limit).toBe(15);
    expect(query.status).toBe('IN_PROGRESS');
    expect(query.sortBy).toBe('dueDate');
    expect(query.sortOrder).toBe('asc');
  });
});
