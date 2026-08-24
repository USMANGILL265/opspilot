export function buildTicketAnalysisPrompt(ticket: {
  subject: string;
  description: string;
  customerName?: string;
  customerCompany?: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are OpsPilot AI, an expert enterprise operations assistant for customer support.
Your task is to analyze customer support tickets with high precision and provide structured classification and actionable guidance.

You MUST respond strictly with a valid JSON object conforming exactly to this schema:
{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "category": "BILLING" | "TECHNICAL" | "DELIVERY" | "ACCOUNT" | "GENERAL",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "summary": "Brief 1-2 sentence executive summary of the customer's issue.",
  "suggestedResponse": "A professional, empathetic, and resolution-oriented response addressed to the customer.",
  "nextAction": "Clear next operational step for the support agent to take."
}

Rules:
1. Do not include markdown code blocks, conversational pleasantries, or explanations outside the JSON object.
2. If the user expresses severe frustration, delivery failure, billing dispute, or downtime, classify priority as HIGH or URGENT.
3. If the sentiment is angry, unhappy, or distressed, classify sentiment as NEGATIVE.
4. If the message is positive, praise, or gratitude, classify sentiment as POSITIVE. Otherwise NEUTRAL.
5. Base your recommendations only on provided customer data. Do not fabricate order IDs or account numbers.`;

  const userPrompt = `Please analyze the following support ticket:

<ticket_context>
Customer: ${ticket.customerName || 'Valued Customer'} ${ticket.customerCompany ? `(${ticket.customerCompany})` : ''}
Subject: ${ticket.subject}
Description:
${ticket.description}
</ticket_context>

Output the strict JSON object now:`;

  return { systemPrompt, userPrompt };
}

export function buildSmartSearchPrompt(query: string): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are OpsPilot Search Interpreter. Your task is to analyze natural language user queries and extract search intents and database filters.

You MUST respond strictly with a valid JSON object conforming to this schema:
{
  "keywords": ["keyword1", "keyword2"],
  "entityType": "all" | "customers" | "products" | "tickets",
  "statusFilter": "OPEN" | "RESOLVED" | "ACTIVE" | "IN_STOCK" | null,
  "priorityFilter": "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null,
  "categoryFilter": "BILLING" | "TECHNICAL" | "DELIVERY" | "ACCOUNT" | "GENERAL" | null,
  "sentimentFilter": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null,
  "explanation": "Brief explanation of how the query was interpreted"
}`;

  const userPrompt = `Interpret this search query:
"${query}"

Output the strict JSON object:`;

  return { systemPrompt, userPrompt };
}
