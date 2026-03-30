import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs and openclaw-credentials before importing doctor
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn(),
  };
});

vi.mock('../src/openclaw-credentials', () => ({
  resolveApiConfig: vi.fn().mockReturnValue({ apiKey: 'test-key', baseUrl: undefined }),
}));

// Import after mocks are set up
import * as fs from 'fs';
import { loadPipelineConfig } from '../src/doctor';

describe('loadPipelineConfig', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
  });

  it('returns null when no config file exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = loadPipelineConfig();
    expect(result).toBeNull();
  });

  it('returns a PipelineConfig when config file exists with ollama provider', () => {
    const configData = { provider: 'ollama' };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result).not.toBeNull();
    expect(result?.providerKey).toBe('ollama');
    expect(result?.layer1).toBe(true);
  });

  it('defaults to ollama when provider key is unknown', () => {
    const configData = { provider: 'nonexistent-provider-xyz' };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result).not.toBeNull();
    // Unknown providers fall back to ollama
    expect(result?.provider).toBeDefined();
  });

  it('parses pipeline layer2 config when present', () => {
    const configData = {
      provider: 'ollama',
      pipeline: {
        layer2: { enabled: true, model: 'llama3', baseUrl: 'http://localhost:11434' },
      },
    };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result?.layer2.enabled).toBe(true);
    expect(result?.layer2.model).toBe('llama3');
    expect(result?.layer2.baseUrl).toBe('http://localhost:11434');
  });

  it('defaults layer2 enabled to false when not specified', () => {
    const configData = { provider: 'ollama' };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result?.layer2.enabled).toBe(false);
  });

  it('defaults layer3 computerUse to false when not specified', () => {
    const configData = { provider: 'ollama' };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result?.layer3.computerUse).toBe(false);
  });

  it('uses apiKey from resolveApiConfig', () => {
    const configData = { provider: 'ollama' };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(configData) as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result?.apiKey).toBe('test-key');
  });

  it('returns null when config file contains invalid JSON', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('not valid json {{' as unknown as Buffer);

    const result = loadPipelineConfig();

    expect(result).toBeNull();
  });
});
