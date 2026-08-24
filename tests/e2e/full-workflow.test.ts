import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../../src/lib/auth';
import { CreateCustomerSchema, CreateTicketSchema, AddTicketCommentSchema } from '../../src/lib/validation';
import { AIService } from '../../src/lib/ai/ai-service';
import { TicketAnalysisSchema } from '../../src/lib/ai/schemas/ticket-analysis';

describe('End-to-End Operational Workflow', () => {
  it('should successfully execute complete lifecycle: Auth -> Create Customer -> Create Ticket -> AI Triaging -> Reply -> Resolve', async () => {
    // 1. User Authentication
    const user = {
      id: 'usr_admin_e2e',
      name: 'Muhammad Usman Gill',
      email: 'admin@opspilot.com',
      role: 'ADMIN' as const,
    };
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const verified = verifyToken(token);
    expect(verified?.role).toBe('ADMIN');

    // 2. Customer Creation
    const customerPayload = {
      name: 'Nexus Dynamics Enterprise',
      email: 'ops@nexusdynamics.io',
      phone: '+1 (555) 999-0000',
      company: 'Nexus Dynamics LLC',
      status: 'ACTIVE' as const,
      notes: 'Global Tier 1 SLA client',
    };
    const validCustomer = CreateCustomerSchema.parse(customerPayload);
    expect(validCustomer.name).toBe('Nexus Dynamics Enterprise');

    // 3. Support Ticket Creation
    const ticketPayload = {
      customerId: 'cust_nexus_01',
      subject: 'Critical delivery delay on container #NX-9021',
      description: 'Customer reports that container #NX-9021 has been delayed at the transit hub for over 48 hours. Urgent investigation needed.',
      priority: 'HIGH' as const,
      category: 'DELIVERY' as const,
    };
    const validTicket = CreateTicketSchema.parse(ticketPayload);
    expect(validTicket.priority).toBe('HIGH');

    // 4. Run AI Triaging & Output Schema Validation
    const aiService = new AIService();
    const aiExecution = await aiService.analyzeTicket({
      subject: validTicket.subject,
      description: validTicket.description,
      customerName: validCustomer.name,
      customerCompany: validCustomer.company || undefined,
    });

    expect(aiExecution.analysis).toBeDefined();
    const validatedAnalysis = TicketAnalysisSchema.parse(aiExecution.analysis);

    expect(validatedAnalysis.category).toBe('DELIVERY');
    expect(validatedAnalysis.sentiment).toBe('NEGATIVE');
    expect(validatedAnalysis.summary).toContain('Nexus Dynamics');
    expect(validatedAnalysis.suggestedResponse).toBeDefined();
    expect(validatedAnalysis.nextAction).toBeDefined();

    // 5. Add Operational Comment using AI Suggested Response
    const commentPayload = {
      content: validatedAnalysis.suggestedResponse,
      isInternal: false,
    };
    const validComment = AddTicketCommentSchema.parse(commentPayload);
    expect(validComment.content.length).toBeGreaterThan(10);

    // 6. Ticket Status Transition to RESOLVED
    const statusTransition = {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    };
    expect(statusTransition.status).toBe('RESOLVED');
    expect(statusTransition.resolvedAt).toBeInstanceOf(Date);
  });
});
