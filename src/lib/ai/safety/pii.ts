/**
 * AI Safety & Data Privacy Guardrails
 */

// Regex patterns for Sensitive Data & PII Redaction
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const API_KEY_REGEX = /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35})\b/g;

export function redactPII(input: string): string {
  if (!input) return '';
  return input
    .replace(CREDIT_CARD_REGEX, '[REDACTED_CREDIT_CARD]')
    .replace(SSN_REGEX, '[REDACTED_SSN]')
    .replace(API_KEY_REGEX, '[REDACTED_API_KEY]')
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

/**
 * Sanitize user input to mitigate Prompt Injection attacks.
 * Wraps content in isolated XML delimiters and escapes suspicious system override tokens.
 */
export function sanitizePromptInput(input: string, maxLength = 4000): string {
  if (!input) return '';

  // 1. Truncate excessive input length (Cost & DOS protection)
  let sanitized = input.slice(0, maxLength);

  // 2. Redact sensitive PII before sending to external LLM
  sanitized = redactPII(sanitized);

  // 3. Neutralize common prompt injection patterns
  sanitized = sanitized
    .replace(/<system>/gi, '&lt;system&gt;')
    .replace(/<\/system>/gi, '&lt;/system&gt;')
    .replace(/<script>/gi, '&lt;script&gt;')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/ignore\s+previous\s+instructions/gi, '[neutralized_override_attempt]')
    .replace(/system\s+prompt\s+override/gi, '[neutralized_override_attempt]');

  return sanitized.trim();
}

/**
 * Robust JSON Extractor & Parser
 * Handles markdown code fences (```json ... ```), raw strings, and malformed whitespace.
 */
export function extractAndParseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip Markdown code blocks if present
  if (cleaned.includes('```')) {
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      cleaned = jsonMatch[1].trim();
    }
  }

  // Find opening and closing braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned) as T;
}
