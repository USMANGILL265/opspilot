import { AIProviderInterface, FallbackAIProvider } from './providers/fallback';
import { GeminiAIProvider } from './providers/gemini';
import { OpenAIAIProvider } from './providers/openai';
import { OllamaAIProvider } from './providers/ollama';
import { TicketAnalysisOutput, SmartSearchIntent } from './schemas/ticket-analysis';
import { createChildLogger } from '../logger';

const log = createChildLogger('AIService');

export interface AIAnalysisExecutionResult {
  analysis: TicketAnalysisOutput;
  provider: string;
  model: string;
  processingTimeMs: number;
  isFallback: boolean;
}

export class AIService {
  private primaryProvider: AIProviderInterface;
  private fallbackProvider: AIProviderInterface;

  constructor() {
    this.fallbackProvider = new FallbackAIProvider();
    this.primaryProvider = this.resolveProvider();
  }

  private resolveProvider(): AIProviderInterface {
    const configuredProvider = (process.env.AI_PROVIDER || 'fallback').toLowerCase();

    try {
      switch (configuredProvider) {
        case 'gemini':
          if (process.env.GEMINI_API_KEY) {
            log.info('AI Service initialized with Gemini provider');
            return new GeminiAIProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
          }
          log.warn('GEMINI_API_KEY missing, defaulting to heuristic fallback');
          return this.fallbackProvider;

        case 'openai':
          if (process.env.OPENAI_API_KEY) {
            log.info('AI Service initialized with OpenAI provider');
            return new OpenAIAIProvider(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL, process.env.OPENAI_BASE_URL);
          }
          log.warn('OPENAI_API_KEY missing, defaulting to heuristic fallback');
          return this.fallbackProvider;

        case 'ollama':
          log.info('AI Service initialized with Ollama local provider');
          return new OllamaAIProvider(process.env.OLLAMA_BASE_URL, process.env.OLLAMA_MODEL);

        case 'fallback':
        default:
          log.info('AI Service running in Deterministic Heuristic Fallback mode');
          return this.fallbackProvider;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ error: message }, 'Failed to initialize requested AI provider, using fallback');
      return this.fallbackProvider;
    }
  }

  /**
   * Analyzes a support ticket with primary provider and automatic graceful fallback.
   */
  async analyzeTicket(ticket: {
    subject: string;
    description: string;
    customerName?: string;
    customerCompany?: string;
  }): Promise<AIAnalysisExecutionResult> {
    const startTime = Date.now();

    // 1. Try Primary Provider
    try {
      log.info({ provider: this.primaryProvider.name, subject: ticket.subject }, 'Executing AI ticket analysis');
      const analysis = await this.primaryProvider.analyzeTicket(ticket);
      const processingTimeMs = Date.now() - startTime;

      return {
        analysis,
        provider: this.primaryProvider.name,
        model: this.primaryProvider.model,
        processingTimeMs,
        isFallback: this.primaryProvider.name === 'fallback',
      };
    } catch (primaryError: unknown) {
      const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      log.warn(
        { error: primaryMsg, provider: this.primaryProvider.name },
        'Primary AI provider failed. Gracefully invoking heuristic fallback provider.'
      );

      // 2. Invoke Fallback
      const analysis = await this.fallbackProvider.analyzeTicket(ticket);
      const processingTimeMs = Date.now() - startTime;

      return {
        analysis,
        provider: 'fallback',
        model: this.fallbackProvider.model,
        processingTimeMs,
        isFallback: true,
      };
    }
  }

  /**
   * Interprets natural language search queries with automatic fallback.
   */
  async interpretSearch(query: string): Promise<SmartSearchIntent> {
    try {
      return await this.primaryProvider.interpretSearch(query);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ error: message }, 'Primary search interpreter failed, using fallback interpreter');
      return await this.fallbackProvider.interpretSearch(query);
    }
  }

  /**
   * Generates a suggested response message for a ticket.
   */
  async generateSuggestedResponse(ticket: {
    subject: string;
    description: string;
    customerName?: string;
  }): Promise<string> {
    try {
      return await this.primaryProvider.generateSuggestedResponse(ticket);
    } catch {
      return await this.fallbackProvider.generateSuggestedResponse(ticket);
    }
  }

  getStatus(): { activeProvider: string; activeModel: string } {
    return {
      activeProvider: this.primaryProvider.name,
      activeModel: this.primaryProvider.model,
    };
  }
}

export const aiService = new AIService();
