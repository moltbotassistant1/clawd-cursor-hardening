/**
 * Shared LLM utilities — header construction and response parsing.
 * Used by ai-brain, smart-interaction, and a11y-reasoner.
 */

import { PROVIDERS } from './providers';

/**
 * Build HTTP headers for an LLM API call.
 */
export function buildHeaders(providerKey: string, apiKey: string): Record<string, string> {
  const provider = PROVIDERS[providerKey];
  const authHeaders = provider ? provider.authHeader(apiKey) : { 'Authorization': `Bearer ${apiKey}` };

  return {
    'content-type': 'application/json',
    ...authHeaders,
  };
}

/**
 * Extract and parse JSON from an LLM response string.
 * Handles: raw JSON, markdown code blocks, JSON with trailing text.
 * Returns null if no valid JSON found.
 */
export function parseJsonResponse(text: string): Record<string, unknown> | null {
  // Try markdown code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* fall through */ }
  }

  // Try finding JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* fall through */ }
  }

  return null;
}
