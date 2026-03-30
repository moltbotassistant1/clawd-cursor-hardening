import { describe, expect, it } from 'vitest';
import { buildHeaders, parseJsonResponse } from '../src/llm-utils';

describe('buildHeaders', () => {
  it('builds Anthropic headers', () => {
    const headers = buildHeaders('anthropic', 'sk-ant-test');
    expect(headers['x-api-key']).toBe('sk-ant-test');
    expect(headers['anthropic-version']).toBeDefined();
    expect(headers['content-type']).toBe('application/json');
  });

  it('builds OpenAI-compatible headers', () => {
    const headers = buildHeaders('openai', 'sk-test');
    expect(headers['Authorization']).toBe('Bearer sk-test');
    expect(headers['content-type']).toBe('application/json');
  });

  it('builds Ollama headers (no auth)', () => {
    const headers = buildHeaders('ollama', '');
    expect(headers['Authorization']).toBeUndefined();
    expect(headers['content-type']).toBe('application/json');
  });
});

describe('parseJsonResponse', () => {
  it('extracts JSON from markdown code block', () => {
    const text = 'Here is the result:\n```json\n{"action": "click", "x": 100}\n```';
    expect(parseJsonResponse(text)).toEqual({ action: 'click', x: 100 });
  });

  it('extracts JSON from plain text', () => {
    const text = '{"action": "type", "text": "hello"}';
    expect(parseJsonResponse(text)).toEqual({ action: 'type', text: 'hello' });
  });

  it('returns null for non-JSON', () => {
    expect(parseJsonResponse('no json here')).toBeNull();
  });

  it('handles JSON with trailing text', () => {
    const text = '{"x": 1} and some extra text';
    expect(parseJsonResponse(text)).toEqual({ x: 1 });
  });
});
