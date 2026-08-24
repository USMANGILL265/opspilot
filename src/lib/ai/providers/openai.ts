import { AIProviderInterface } from './fallback';
import { TicketAnalysisOutput, TicketAnalysisSchema, SmartSearchIntent, SmartSearchIntentSchema } from '../schemas/ticket-analysis';
import { buildTicketAnalysisPrompt, buildSmartSearchPrompt } from '../prompts/ticket-prompt';
import { sanitizePromptInput, extractAndParseJSON } from '../safety/pii';
import { createChildLogger } from '../../logger';

const log = createChildLogger('OpenAIProvider');

export class OpenAIAIProvider implements AIProviderInterface {
  name = 'openai';
  model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, model = 'gpt-4o-mini', baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      log.error({ status: response.status, body: errText }, 'OpenAI API call failed');
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned an empty message content');
    }

    return rawContent;
  }

  async analyzeTicket(ticket: {
    subject: string;
    description: string;
    customerName?: string;
    customerCompany?: string;
  }): Promise<TicketAnalysisOutput> {
    const sanitizedSubject = sanitizePromptInput(ticket.subject);
    const sanitizedDesc = sanitizePromptInput(ticket.description);
    const { systemPrompt, userPrompt } = buildTicketAnalysisPrompt({
      subject: sanitizedSubject,
      description: sanitizedDesc,
      customerName: ticket.customerName,
      customerCompany: ticket.customerCompany,
    });

    const rawJson = await this.callOpenAI(systemPrompt, userPrompt);
    const parsed = extractAndParseJSON<unknown>(rawJson);
    return TicketAnalysisSchema.parse(parsed);
  }

  async interpretSearch(query: string): Promise<SmartSearchIntent> {
    const sanitizedQuery = sanitizePromptInput(query);
    const { systemPrompt, userPrompt } = buildSmartSearchPrompt(sanitizedQuery);
    const rawJson = await this.callOpenAI(systemPrompt, userPrompt);
    const parsed = extractAndParseJSON<unknown>(rawJson);
    return SmartSearchIntentSchema.parse(parsed);
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
