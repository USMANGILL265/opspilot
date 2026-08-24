import { z } from 'zod';

// ==========================================
// Authentication Schemas
// ==========================================
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional().default('EMPLOYEE'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ==========================================
// Customer Schemas
// ==========================================
export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD']).default('ACTIVE'),
  notes: z.string().max(1000).optional().nullable(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD']).optional(),
  sortBy: z.enum(['name', 'email', 'company', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// Product Schemas
// ==========================================
export const CreateProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50).toUpperCase(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  stock: z.coerce.number().int().min(0, 'Stock must be non-negative').default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).default('IN_STOCK'),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
  sortBy: z.enum(['name', 'sku', 'price', 'stock', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// Support Ticket Schemas
// ==========================================
export const CreateTicketSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL']).default('GENERAL'),
  assignedToUserId: z.string().optional().nullable(),
});

export const UpdateTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum(['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  assignedToUserId: z.string().optional().nullable(),
});

export const AddTicketCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(3000),
  isInternal: z.boolean().default(false),
});

export const AssignTicketSchema = z.object({
  assignedToUserId: z.string().min(1, 'Assignee ID is required'),
  note: z.string().max(500).optional().nullable(),
});

export const TicketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum(['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL']).optional(),
  customerId: z.string().optional(),
  assignedToUserId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'ticketNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// Category Schemas
// ==========================================
export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).toLowerCase(),
  description: z.string().max(200).optional().nullable(),
});

// ==========================================
// Search Schema
// ==========================================
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').max(300),
  type: z.enum(['all', 'customers', 'products', 'tickets']).default('all'),
  aiAssisted: z.coerce.boolean().default(false),
});
