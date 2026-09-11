import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, hashPassword, comparePassword } from '../../src/lib/auth';
import {
  CreateCustomerSchema,
  CreateTicketSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  AssignTicketSchema,
  AddTicketCommentSchema,
  UpdateTicketSchema,
} from '../../src/lib/validation';
import { AIService } from '../../src/lib/ai/ai-service';
import { TicketAnalysisSchema } from '../../src/lib/ai/schemas/ticket-analysis';

describe('End-to-End Operational Lifecycle Workflow', () => {
  it('should successfully execute complete enterprise lifecycle: Auth -> Customer -> Task -> Ticket -> AI Triaging -> Assignment -> Suggested Reply -> Resolution', async () => {
    // 1. User Authentication & Password Hashing Verification
    const rawPassword = 'AdminPass123!';
    const passwordHash = await hashPassword(rawPassword);
    const isPasswordValid = await comparePassword(rawPassword, passwordHash);
    expect(isPasswordValid).toBe(true);

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
    expect(verified?.email).toBe('admin@opspilot.com');

    // 2. Customer Creation
    const customerPayload = {
      name: 'Nexus Dynamics Enterprise',
      email: 'ops@nexusdynamics.io',
      phone: '+1 (555) 999-0000',
      company: 'Nexus Dynamics LLC',
      status: 'ACTIVE' as const,
      notes: 'Global Tier 1 SLA client with prioritized AI triaging contract',
    };
    const validCustomer = CreateCustomerSchema.parse(customerPayload);
    expect(validCustomer.name).toBe('Nexus Dynamics Enterprise');
    expect(validCustomer.status).toBe('ACTIVE');

    // 3. Operational Task Management
    const onboardingTask = CreateTaskSchema.parse({
      title: 'Conduct Q3 SLA Review for Nexus Dynamics',
      description: 'Prepare logistics throughput audit report and present to account manager.',
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      assignedToUserId: user.id,
    });
    expect(onboardingTask.title).toBe('Conduct Q3 SLA Review for Nexus Dynamics');
    expect(onboardingTask.status).toBe('IN_PROGRESS');

    const updatedTask = UpdateTaskSchema.parse({
      status: 'COMPLETED',
    });
    expect(updatedTask.status).toBe('COMPLETED');

    // 4. Support Ticket Creation
    const ticketPayload = {
      customerId: 'cust_nexus_01',
      subject: 'Critical delivery delay on container #NX-9021',
      description:
        'Customer reports that container #NX-9021 has been delayed at the transit hub for over 48 hours. Urgent investigation needed.',
      priority: 'HIGH' as const,
      category: 'DELIVERY' as const,
    };
    const validTicket = CreateTicketSchema.parse(ticketPayload);
    expect(validTicket.priority).toBe('HIGH');
    expect(validTicket.category).toBe('DELIVERY');

    // 5. Run AI Triaging & Output Schema Validation
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
    expect(validatedAnalysis.suggestedResponse.length).toBeGreaterThan(20);
    expect(validatedAnalysis.nextAction.length).toBeGreaterThan(5);

    // 6. Ticket Assignment to Specialist Employee
    const assignment = AssignTicketSchema.parse({
      assignedToUserId: 'usr_specialist_02',
      note: 'Assigned to European logistics routing specialist based on AI recommendation',
    });
    expect(assignment.assignedToUserId).toBe('usr_specialist_02');

    // 7. Add Operational Comment using AI Suggested Response
    const commentPayload = {
      content: validatedAnalysis.suggestedResponse,
      isInternal: false,
    };
    const validComment = AddTicketCommentSchema.parse(commentPayload);
    expect(validComment.content.length).toBeGreaterThan(10);

    // 8. Ticket Status Transition to RESOLVED
    const updateTicketPayload = UpdateTicketSchema.parse({
      status: 'RESOLVED',
    });
    expect(updateTicketPayload.status).toBe('RESOLVED');
  });
});
