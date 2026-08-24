import { prisma } from '../db';
import { aiService } from '../ai/ai-service';
import { SmartSearchIntent } from '../ai/schemas/ticket-analysis';
import { CustomerData, ProductData, TicketData } from '@/types';
import { createChildLogger } from '../logger';

const log = createChildLogger('SearchService');

export interface SearchResults {
  query: string;
  isAiAssisted: boolean;
  intent?: SmartSearchIntent | null;
  customers: CustomerData[];
  products: ProductData[];
  tickets: TicketData[];
  totalMatches: number;
}

export async function executeSearch(query: string, aiAssisted = false, entityType = 'all'): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return {
      query: q,
      isAiAssisted: false,
      customers: [],
      products: [],
      tickets: [],
      totalMatches: 0,
    };
  }

  let intent: SmartSearchIntent | null = null;

  if (aiAssisted) {
    try {
      intent = await aiService.interpretSearch(q);
      log.info({ query: q, intent }, 'AI Search interpreted intent successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ error: message }, 'AI search interpretation failed, falling back to standard search');
    }
  }

  // Keywords to search against text columns
  const searchTerms = intent?.keywords?.length ? intent.keywords : [q];
  const primaryTerm = searchTerms[0] || q;

  const results: SearchResults = {
    query: q,
    isAiAssisted: aiAssisted,
    intent,
    customers: [],
    products: [],
    tickets: [],
    totalMatches: 0,
  };

  const shouldSearchCustomers = entityType === 'all' || entityType === 'customers' || intent?.entityType === 'customers';
  const shouldSearchProducts = entityType === 'all' || entityType === 'products' || intent?.entityType === 'products';
  const shouldSearchTickets = entityType === 'all' || entityType === 'tickets' || intent?.entityType === 'tickets';

  // 1. Search Customers
  if (shouldSearchCustomers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerWhere: any = {
      deletedAt: null,
      OR: [
        { name: { contains: primaryTerm, mode: 'insensitive' } },
        { email: { contains: primaryTerm, mode: 'insensitive' } },
        { company: { contains: primaryTerm, mode: 'insensitive' } },
        { phone: { contains: primaryTerm, mode: 'insensitive' } },
      ],
    };

    if (intent?.statusFilter && ['ACTIVE', 'INACTIVE', 'LEAD'].includes(intent.statusFilter)) {
      customerWhere.status = intent.statusFilter;
    }

    try {
      const customers = await prisma.customer.findMany({
        where: customerWhere,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.customers = customers as any;
    } catch (err) {
      log.error({ error: err }, 'Customer search query error');
    }
  }

  // 2. Search Products
  if (shouldSearchProducts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productWhere: any = {
      deletedAt: null,
      OR: [
        { name: { contains: primaryTerm, mode: 'insensitive' } },
        { sku: { contains: primaryTerm, mode: 'insensitive' } },
        { description: { contains: primaryTerm, mode: 'insensitive' } },
      ],
    };

    if (intent?.statusFilter && ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(intent.statusFilter)) {
      productWhere.status = intent.statusFilter;
    }

    try {
      const products = await prisma.product.findMany({
        where: productWhere,
        include: { category: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.products = products as any;
    } catch (err) {
      log.error({ error: err }, 'Product search query error');
    }
  }

  // 3. Search Tickets
  if (shouldSearchTickets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticketWhere: any = {
      OR: [
        { subject: { contains: primaryTerm, mode: 'insensitive' } },
        { description: { contains: primaryTerm, mode: 'insensitive' } },
        { ticketNumber: { contains: primaryTerm, mode: 'insensitive' } },
      ],
    };

    if (intent?.statusFilter && ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'].includes(intent.statusFilter)) {
      ticketWhere.status = intent.statusFilter;
    }
    if (intent?.priorityFilter && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(intent.priorityFilter)) {
      ticketWhere.priority = intent.priorityFilter;
    }
    if (intent?.categoryFilter && ['BILLING', 'TECHNICAL', 'DELIVERY', 'ACCOUNT', 'GENERAL'].includes(intent.categoryFilter)) {
      ticketWhere.category = intent.categoryFilter;
    }
    if (intent?.sentimentFilter && ['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(intent.sentimentFilter)) {
      ticketWhere.aiAnalysis = {
        sentiment: intent.sentimentFilter,
      };
    }

    try {
      const tickets = await prisma.ticket.findMany({
        where: ticketWhere,
        include: {
          customer: true,
          createdByUser: { select: { id: true, name: true, email: true } },
          assignedToUser: { select: { id: true, name: true, email: true } },
          aiAnalysis: true,
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.tickets = tickets as any;
    } catch (err) {
      log.error({ error: err }, 'Ticket search query error');
    }
  }

  results.totalMatches = results.customers.length + results.products.length + results.tickets.length;
  return results;
}
