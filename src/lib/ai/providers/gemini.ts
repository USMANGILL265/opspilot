import { AIProviderInterface } from './fallback';
import { TicketAnalysisOutput, TicketAnalysisSchema, SmartSearchIntent, SmartSearchIntentSchema } from '../schemas/ticket-analysis';
import { buildTicketAnalysisPrompt, buildSmartSearchPrompt } from '../prompts/ticket-prompt';
import { sanitizePromptInput, extractAndParseJSON } from '../safety/pii';
import { createChildLogger } from '../../logger';

const log = createChildLogger('GeminiProvider');

export class GeminiAIProvider implements AIProviderInterface {
  name = 'gemini';
  model: string;
  private apiKey: string;

  constructor(apiKey?: string, model = 'gemini-1.5-flash') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model;
  }

  private async callGeminiAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      log.error({ status: response.status, body: errText }, 'Gemini API call failed');
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini returned an empty candidate response');
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

    const rawJson = await this.callGeminiAPI(systemPrompt, userPrompt);
    const parsed = extractAndParseJSON<unknown>(rawJson);
    return TicketAnalysisSchema.parse(parsed);
  }

  async interpretSearch(query: string): Promise<SmartSearchIntent> {
    const sanitizedQuery = sanitizePromptInput(query);
    const { systemPrompt, userPrompt } = buildSmartSearchPrompt(sanitizedQuery);
    const rawJson = await this.callGeminiAPI(systemPrompt, userPrompt);
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
