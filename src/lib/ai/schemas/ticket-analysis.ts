import { z } from 'zod';

export const TicketAnalysisSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.enum(['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL']),
  sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
  summary: z.string().min(5, 'Summary must be at least 5 characters').max(300),
  suggestedResponse: z.string().min(10, 'Suggested response must be at least 10 characters').max(2000),
  nextAction: z.string().min(5, 'Next action must be at least 5 characters').max(300),
});

export type TicketAnalysisOutput = z.infer<typeof TicketAnalysisSchema>;

export const SmartSearchIntentSchema = z.object({
  keywords: z.array(z.string()).default([]),
  entityType: z.enum(['all', 'customers', 'products', 'tickets']).default('all'),
  statusFilter: z.string().optional().nullable(),
  priorityFilter: z.string().optional().nullable(),
  categoryFilter: z.string().optional().nullable(),
  sentimentFilter: z.string().optional().nullable(),
  explanation: z.string().optional(),
});

export type SmartSearchIntent = z.infer<typeof SmartSearchIntentSchema>;
