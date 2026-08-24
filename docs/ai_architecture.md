# OpsPilot — AI Architecture & Structured Output Guide

## 1. Provider Abstraction Architecture

OpsPilot decouples domain business logic from specific AI vendors using an extensible factory pattern (`AIService`):

```
                        ┌──────────────────────────────┐
                        │      AIService Factory       │
                        │    (src/lib/ai/ai-service.ts)│
                        └──────────────┬───────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
  ┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │  GeminiProvider  │       │  OpenAIProvider  │       │  OllamaProvider  │
  │ (Google Gemini)  │       │ (GPT-4o/LiteLLM) │       │ (Local Llama 3)  │
  └─────────┬────────┘       └─────────┬────────┘       └─────────┬────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │ (On Network/API Failure)
                                       ▼
                             ┌───────────────────┐
                             │FallbackAIProvider │
                             │  (Heuristic NLP)  │
                             └───────────────────┘
```

---

## 2. Supported Providers & Configuration

| Provider | Model | Typical Latency | Cost per 1k req | Use Case |
|---|---|---|---|---|
| **Google Gemini** | `gemini-1.5-flash` / `gemini-2.0-flash` | 400–700ms | ~\$0.001 | Production Cloud |
| **OpenAI** | `gpt-4o-mini` / `gpt-4o` | 500–900ms | ~\$0.002 | OpenAI Ecosystem |
| **Ollama** | `llama3.2:3b` / `qwen2.5:3b` | 200–600ms (GPU) | \$0.00 (Self-Hosted) | Private / Air-gapped |
| **Fallback NLP** | `heuristic-nlp-v1` | < 10ms | \$0.00 | Offline / Tests / Failover |

---

## 3. Strict Output Schema Contract (Zod)

Every provider must output a JSON object validated by `TicketAnalysisSchema`:

```typescript
export const TicketAnalysisSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  category: z.enum(["BILLING", "TECHNICAL", "DELIVERY", "ACCOUNT", "GENERAL"]),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  summary: z.string().min(5).max(300),
  suggestedResponse: z.string().min(10).max(2000),
  nextAction: z.string().min(5).max(300)
});
```

### JSON Extraction & Markdown Fence Repair
Even if an LLM wraps the response in ```json ... ``` code blocks or adds conversational whitespace, `extractAndParseJSON()` strips markdown fences, finds the outer braces `{ ... }`, and safely parses the payload.

---

## 4. Prompt Engineering & Boundary Isolation

```text
You are OpsPilot AI, an expert enterprise operations assistant for customer support.
Your task is to analyze customer support tickets with high precision and provide structured classification and actionable guidance.

You MUST respond strictly with a valid JSON object conforming exactly to this schema:
{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "category": "BILLING" | "TECHNICAL" | "DELIVERY" | "ACCOUNT" | "GENERAL",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "summary": "...",
  "suggestedResponse": "...",
  "nextAction": "..."
}

Rules:
1. Do not include markdown code blocks or conversational pleasantries outside the JSON object.
2. Base recommendations solely on customer facts provided within <ticket_context>.
```
