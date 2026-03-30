import { describe, expect, it } from 'vitest';
import {
  detectProvider,
  buildPipeline,
  buildMixedPipeline,
  PROVIDERS,
} from '../src/providers';
import type { ProviderScanResult, ModelTestResult } from '../src/providers';

describe('detectProvider', () => {
  it('returns explicit provider if known', () => {
    expect(detectProvider('any-key', 'anthropic')).toBe('anthropic');
    expect(detectProvider('any-key', 'openai')).toBe('openai');
    expect(detectProvider('any-key', 'groq')).toBe('groq');
  });

  it('returns generic for unknown explicit provider', () => {
    expect(detectProvider('any-key', 'my-custom-provider')).toBe('generic');
  });

  it('detects anthropic from key prefix', () => {
    expect(detectProvider('sk-ant-abc123')).toBe('anthropic');
  });

  it('detects openai from short sk- key', () => {
    const shortKey = 'sk-' + 'a'.repeat(48); // <= 60 chars total
    expect(detectProvider(shortKey)).toBe('openai');
  });

  it('detects kimi from long sk- key (>60 chars)', () => {
    const longKey = 'sk-' + 'a'.repeat(80); // > 60 chars total
    expect(detectProvider(longKey)).toBe('kimi');
  });

  it('detects groq from gsk_ prefix', () => {
    expect(detectProvider('gsk_abc123def456')).toBe('groq');
  });

  it('returns ollama when no key', () => {
    expect(detectProvider('')).toBe('ollama');
  });

  it('defaults to openai for unknown key format', () => {
    expect(detectProvider('some-random-key-format')).toBe('openai');
  });
});

describe('PROVIDERS registry', () => {
  it('contains all expected providers', () => {
    const expected = ['anthropic', 'openai', 'ollama', 'kimi', 'groq', 'together', 'deepseek', 'generic'];
    for (const key of expected) {
      expect(PROVIDERS[key]).toBeDefined();
      expect(PROVIDERS[key].name).toBeTruthy();
    }
  });

  it('anthropic is the only provider with computerUse', () => {
    expect(PROVIDERS['anthropic'].computerUse).toBe(true);
    for (const [key, profile] of Object.entries(PROVIDERS)) {
      if (key !== 'anthropic') {
        expect(profile.computerUse).toBe(false);
      }
    }
  });

  it('anthropic is the only non-openaiCompat provider', () => {
    expect(PROVIDERS['anthropic'].openaiCompat).toBe(false);
    for (const [key, profile] of Object.entries(PROVIDERS)) {
      if (key !== 'anthropic') {
        expect(profile.openaiCompat).toBe(true);
      }
    }
  });

  it('authHeader returns correct format per provider', () => {
    const anthropicHeaders = PROVIDERS['anthropic'].authHeader('test-key');
    expect(anthropicHeaders['x-api-key']).toBe('test-key');
    expect(anthropicHeaders['anthropic-version']).toBeDefined();

    const openaiHeaders = PROVIDERS['openai'].authHeader('test-key');
    expect(openaiHeaders['Authorization']).toBe('Bearer test-key');

    const ollamaHeaders = PROVIDERS['ollama'].authHeader('');
    expect(Object.keys(ollamaHeaders)).toHaveLength(0);
  });
});

describe('buildPipeline', () => {
  it('builds pipeline with all layers enabled', () => {
    const pipeline = buildPipeline('anthropic', 'sk-ant-test', true, true);
    expect(pipeline.providerKey).toBe('anthropic');
    expect(pipeline.layer1).toBe(true);
    expect(pipeline.layer2.enabled).toBe(true);
    expect(pipeline.layer3.enabled).toBe(true);
    expect(pipeline.layer3.computerUse).toBe(true);
  });

  it('disables layers when models fail', () => {
    const pipeline = buildPipeline('openai', 'sk-test', false, false);
    expect(pipeline.layer2.enabled).toBe(false);
    expect(pipeline.layer3.enabled).toBe(false);
  });

  it('uses model overrides when provided', () => {
    const pipeline = buildPipeline('openai', 'sk-test', true, true, 'gpt-4o-mini', 'gpt-4o');
    expect(pipeline.layer2.model).toBe('gpt-4o-mini');
    expect(pipeline.layer3.model).toBe('gpt-4o');
  });

  it('falls back to ollama for unknown provider key', () => {
    const pipeline = buildPipeline('nonexistent', '', true, true);
    expect(pipeline.provider.name).toBe(PROVIDERS['ollama'].name);
  });
});

describe('buildMixedPipeline', () => {
  const scanResults: ProviderScanResult[] = [
    { key: 'anthropic', name: 'Anthropic', available: true, detail: 'key', apiKey: 'sk-ant-test' },
    { key: 'groq', name: 'Groq', available: true, detail: 'key', apiKey: 'gsk_test' },
    { key: 'ollama', name: 'Ollama', available: true, detail: 'running', apiKey: '' },
  ];

  it('picks cheapest text model (ollama over groq) and best vision model (anthropic)', () => {
    const modelTests: ModelTestResult[] = [
      { providerKey: 'ollama', model: 'llama3.1', role: 'text', ok: true, latencyMs: 100 },
      { providerKey: 'groq', model: 'llama-3.3-70b', role: 'text', ok: true, latencyMs: 50 },
      { providerKey: 'anthropic', model: 'claude-sonnet', role: 'vision', ok: true, latencyMs: 200 },
    ];

    const pipeline = buildMixedPipeline(scanResults, modelTests);

    // Text: ollama is preferred (first in TEXT_MODEL_PREFERENCE order)
    expect(pipeline.layer2.model).toBe('llama3.1');
    // Vision: anthropic is preferred (first in VISION_MODEL_PREFERENCE order)
    expect(pipeline.layer3.model).toBe('claude-sonnet');
    expect(pipeline.layer3.computerUse).toBe(true);
  });

  it('handles no working models gracefully', () => {
    const pipeline = buildMixedPipeline(scanResults, []);
    expect(pipeline.layer2.enabled).toBe(false);
    expect(pipeline.layer3.enabled).toBe(false);
  });

  it('uses single provider for both layers if only one works', () => {
    const modelTests: ModelTestResult[] = [
      { providerKey: 'groq', model: 'llama-3.3', role: 'text', ok: true },
      { providerKey: 'groq', model: 'llama-vision', role: 'vision', ok: true },
    ];

    const pipeline = buildMixedPipeline(scanResults, modelTests);
    expect(pipeline.layer2.model).toBe('llama-3.3');
    expect(pipeline.layer3.model).toBe('llama-vision');
  });
});
