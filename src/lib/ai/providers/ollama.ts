import { AIProviderInterface } from './fallback';
import { TicketAnalysisOutput, TicketAnalysisSchema, SmartSearchIntent, SmartSearchIntentSchema } from '../schemas/ticket-analysis';
import { buildTicketAnalysisPrompt, buildSmartSearchPrompt } from '../prompts/ticket-prompt';
import { sanitizePromptInput, extractAndParseJSON } from '../safety/pii';
import { createChildLogger } from '../../logger';

const log = createChildLogger('OllamaProvider');

export class OllamaAIProvider implements AIProviderInterface {
  name = 'ollama';
  model: string;
  private baseUrl: string;

  constructor(baseUrl?: string, model = 'llama3.2:3b') {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = model || process.env.OLLAMA_MODEL || 'llama3.2:3b';
  }

  private async callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    const endpoint = `${this.baseUrl.replace(/\/$/, '')}/api/generate`;
    const payload = {
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.1,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      log.error({ status: response.status, body: errText }, 'Ollama local inference failed');
      throw new Error(`Ollama error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data?.response;
    if (!rawContent) {
      throw new Error('Ollama returned empty response string');
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

    const rawJson = await this.callOllama(systemPrompt, userPrompt);
    const parsed = extractAndParseJSON<unknown>(rawJson);
    return TicketAnalysisSchema.parse(parsed);
  }

  async interpretSearch(query: string): Promise<SmartSearchIntent> {
    const sanitizedQuery = sanitizePromptInput(query);
    const { systemPrompt, userPrompt } = buildSmartSearchPrompt(sanitizedQuery);
    const rawJson = await this.callOllama(systemPrompt, userPrompt);
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
