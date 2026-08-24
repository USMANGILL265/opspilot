import { TicketAnalysisOutput, SmartSearchIntent } from '../schemas/ticket-analysis';

export interface AIProviderInterface {
  name: string;
  model: string;
  analyzeTicket(ticket: {
    subject: string;
    description: string;
    customerName?: string;
    customerCompany?: string;
  }): Promise<TicketAnalysisOutput>;
  interpretSearch(query: string): Promise<SmartSearchIntent>;
  generateSuggestedResponse(ticket: {
    subject: string;
    description: string;
    customerName?: string;
  }): Promise<string>;
}

export class FallbackAIProvider implements AIProviderInterface {
  name = 'fallback';
  model = 'heuristic-nlp-v1';

  async analyzeTicket(ticket: {
    subject: string;
    description: string;
    customerName?: string;
    customerCompany?: string;
  }): Promise<TicketAnalysisOutput> {
    const text = `${ticket.subject} ${ticket.description}`.toLowerCase();
    const customer = ticket.customerName || 'Valued Customer';

    // 1. Sentiment Detection
    let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
    const negativeKeywords = [
      'broken', 'down', 'fail', 'failed', 'urgent', 'angry', 'terrible', 'worst',
      'horrible', 'not working', 'crash', 'delayed', 'lost', 'refund', 'unacceptable',
      'overdue', 'late', 'error', 'bug', 'glitch', 'poor', 'disappointed'
    ];
    const positiveKeywords = [
      'thank', 'thanks', 'great', 'awesome', 'excellent', 'love', 'helpful',
      'appreciate', 'kudos', 'good job', 'perfect', 'resolved'
    ];

    if (negativeKeywords.some((w) => text.includes(w))) {
      sentiment = 'NEGATIVE';
    } else if (positiveKeywords.some((w) => text.includes(w))) {
      sentiment = 'POSITIVE';
    }

    // 2. Category Detection
    let category: 'BILLING' | 'TECHNICAL' | 'DELIVERY' | 'ACCOUNT' | 'GENERAL' = 'GENERAL';
    if (text.includes('bill') || text.includes('invoice') || text.includes('charge') || text.includes('payment') || text.includes('refund') || text.includes('price')) {
      category = 'BILLING';
    } else if (text.includes('deliver') || text.includes('ship') || text.includes('track') || text.includes('package') || text.includes('courier') || text.includes('transit') || text.includes('arrive')) {
      category = 'DELIVERY';
    } else if (text.includes('login') || text.includes('password') || text.includes('account') || text.includes('permission') || text.includes('user') || text.includes('access')) {
      category = 'ACCOUNT';
    } else if (text.includes('bug') || text.includes('error') || text.includes('crash') || text.includes('api') || text.includes('database') || text.includes('server') || text.includes('code') || text.includes('integration')) {
      category = 'TECHNICAL';
    }

    // 3. Priority Detection
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    if (text.includes('urgent') || text.includes('emergency') || text.includes('outage') || text.includes('production down') || text.includes('critical') || text.includes('asap')) {
      priority = 'URGENT';
    } else if (sentiment === 'NEGATIVE' || text.includes('delayed') || text.includes('overdue') || text.includes('broken') || text.includes('refund')) {
      priority = 'HIGH';
    } else if (sentiment === 'POSITIVE' || text.includes('question') || text.includes('inquiry') || text.includes('how to')) {
      priority = 'LOW';
    }

    // 4. Summary Generation
    const summary = `Customer ${customer} reports ${ticket.subject.toLowerCase().replace(/[.!?]+$/, '')}. Requires review in ${category.toLowerCase()} category.`;

    // 5. Suggested Response
    let suggestedResponse = `Hello ${customer},\n\nThank you for reaching out to OpsPilot Support. We have received your inquiry regarding "${ticket.subject}" and our team is actively looking into this.\n\n`;
    if (category === 'DELIVERY') {
      suggestedResponse += `We are currently contacting our logistics provider to trace the exact shipment location and expedite transit. We will provide you with an updated tracking timeline shortly.`;
    } else if (category === 'BILLING') {
      suggestedResponse += `We have escalated this to our billing reconciliation team to review the transaction details and ensure any discrepancies or refund requests are promptly addressed.`;
    } else if (category === 'TECHNICAL') {
      suggestedResponse += `Our engineering specialists are analyzing the system diagnostic logs to reproduce and resolve the reported technical anomaly.`;
    } else {
      suggestedResponse += `An account specialist will review your request and follow up with a detailed solution within the next business hours.`;
    }
    suggestedResponse += `\n\nBest regards,\nOpsPilot Customer Operations Team`;

    // 6. Suggested Next Action
    let nextAction = 'Review ticket history and contact customer with initial update.';
    if (category === 'DELIVERY') nextAction = 'Verify courier tracking status and contact warehouse dispatch.';
    if (category === 'BILLING') nextAction = 'Inspect invoice transaction ledger and verify payment gateway status.';
    if (category === 'TECHNICAL') nextAction = 'Review application error logs and assign to engineering on-call.';

    return {
      priority,
      category,
      sentiment,
      summary,
      suggestedResponse,
      nextAction,
    };
  }

  async interpretSearch(query: string): Promise<SmartSearchIntent> {
    const q = query.toLowerCase();
    const keywords: string[] = query
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['the', 'and', 'with', 'for', 'about', 'from', 'show', 'find'].includes(w));

    let entityType: 'all' | 'customers' | 'products' | 'tickets' = 'all';
    if (q.includes('customer') || q.includes('client')) entityType = 'customers';
    else if (q.includes('product') || q.includes('item') || q.includes('stock') || q.includes('inventory')) entityType = 'products';
    else if (q.includes('ticket') || q.includes('complaint') || q.includes('issue') || q.includes('request')) entityType = 'tickets';

    let statusFilter: string | null = null;
    if (q.includes('open')) statusFilter = 'OPEN';
    if (q.includes('resolved') || q.includes('closed')) statusFilter = 'RESOLVED';
    if (q.includes('active')) statusFilter = 'ACTIVE';

    let priorityFilter: string | null = null;
    if (q.includes('urgent') || q.includes('critical')) priorityFilter = 'URGENT';
    if (q.includes('high')) priorityFilter = 'HIGH';

    let categoryFilter: string | null = null;
    if (q.includes('delivery') || q.includes('shipping')) categoryFilter = 'DELIVERY';
    if (q.includes('billing') || q.includes('payment') || q.includes('invoice')) categoryFilter = 'BILLING';
    if (q.includes('technical') || q.includes('bug')) categoryFilter = 'TECHNICAL';

    let sentimentFilter: string | null = null;
    if (q.includes('angry') || q.includes('complaint') || q.includes('negative') || q.includes('frustrated')) sentimentFilter = 'NEGATIVE';

    return {
      keywords,
      entityType,
      statusFilter,
      priorityFilter,
      categoryFilter,
      sentimentFilter,
      explanation: `Parsed query into ${entityType} search targeting ${keywords.join(', ')} with matching filters.`,
    };
  }

  async generateSuggestedResponse(ticket: {
    subject: string;
    description: string;
    customerName?: string;
  }): Promise<string> {
    const analysis = await this.analyzeTicket(ticket);
    return analysis.suggestedResponse;
  }
}
