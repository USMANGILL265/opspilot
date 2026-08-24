import { describe, it, expect } from 'vitest';
import { FallbackAIProvider } from '../../src/lib/ai/providers/fallback';
import { AIService } from '../../src/lib/ai/ai-service';
import { TicketAnalysisSchema } from '../../src/lib/ai/schemas/ticket-analysis';

describe('AI Service & Fallback Provider', () => {
  const provider = new FallbackAIProvider();

  it('should analyze a delivery delay ticket and return structured validated output', async () => {
    const ticket = {
      subject: 'Shipment tracking stopped updating 48 hours ago',
      description: 'Customer reports container #US-8891 has been stuck at the transit hub for over 48 hours. Delayed order is unacceptable.',
      customerName: 'Acme Global Logistics',
      customerCompany: 'Acme Corp',
    };

    const result = await provider.analyzeTicket(ticket);

    // Validate with Zod Schema
    const validated = TicketAnalysisSchema.parse(result);

    expect(['HIGH', 'URGENT']).toContain(validated.priority);
    expect(validated.category).toBe('DELIVERY');
    expect(validated.sentiment).toBe('NEGATIVE');
    expect(validated.summary).toContain('Acme Global Logistics');
    expect(validated.suggestedResponse).toContain('Acme Global Logistics');
    expect(validated.nextAction).toBeDefined();
  });

  it('should analyze a billing inquiry ticket with neutral sentiment', async () => {
    const ticket = {
      subject: 'Invoice charge clarification',
      description: 'Please explain the $50 line item on the invoice.',
      customerName: 'Apex FinTech',
    };

    const result = await provider.analyzeTicket(ticket);
    const validated = TicketAnalysisSchema.parse(result);

    expect(validated.category).toBe('BILLING');
    expect(validated.sentiment).toBe('NEUTRAL');
    expect(validated.priority).toBe('MEDIUM');
  });

  it('should analyze an urgent system outage ticket with URGENT priority', async () => {
    const ticket = {
      subject: 'URGENT: Production server down and broken',
      description: 'All customer traffic is failing. Critical emergency outage.',
      customerName: 'Enterprise Client',
    };

    const result = await provider.analyzeTicket(ticket);
    const validated = TicketAnalysisSchema.parse(result);

    expect(validated.priority).toBe('URGENT');
    expect(validated.sentiment).toBe('NEGATIVE');
    expect(validated.category).toBe('TECHNICAL');
  });

  it('should interpret natural language search queries into structured filters', async () => {
    const query = 'customers with overdue delivery complaints';
    const intent = await provider.interpretSearch(query);

    expect(intent.keywords).toBeDefined();
    expect(intent.keywords.length).toBeGreaterThan(0);
    expect(intent.categoryFilter).toBe('DELIVERY');
    expect(intent.sentimentFilter).toBe('NEGATIVE');
  });

  it('AIService should execute with latency measurement and schema validation', async () => {
    const aiService = new AIService();
    const result = await aiService.analyzeTicket({
      subject: 'Password reset failure on account',
      description: 'Cannot login to my account since yesterday.',
      customerName: 'John Doe',
    });

    expect(result.analysis).toBeDefined();
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.provider).toBeDefined();

    // Verify structured output conformance
    const parsed = TicketAnalysisSchema.safeParse(result.analysis);
    expect(parsed.success).toBe(true);
  });
});
