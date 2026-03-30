import { describe, expect, it } from 'vitest';
import { SafetyLayer } from '../src/safety';
import { DEFAULT_CONFIG, SafetyTier } from '../src/types';

function makeAction(kind: string = 'click', extras: Record<string, unknown> = {}) {
  return { kind, x: 0, y: 0, ...extras } as any;
}

describe('SafetyLayer.classify', () => {
  const safety = new SafetyLayer(DEFAULT_CONFIG);

  it('returns Blocked for fork bomb', () => {
    const tier = safety.classify(makeAction(), ':(){:|:&};:');
    expect(tier).toBe(SafetyTier.Blocked);
  });

  it('returns Blocked for dd if=/dev/zero', () => {
    const tier = safety.classify(makeAction(), 'dd if=/dev/zero of=/dev/sda');
    expect(tier).toBe(SafetyTier.Blocked);
  });

  it('returns Blocked for format c:', () => {
    const tier = safety.classify(makeAction(), 'format c: /fs:ntfs');
    expect(tier).toBe(SafetyTier.Blocked);
  });

  it('returns Blocked for mkfs', () => {
    const tier = safety.classify(makeAction(), 'mkfs.ext4 /dev/sdb1');
    expect(tier).toBe(SafetyTier.Blocked);
  });

  it('returns Blocked for diskpart', () => {
    const tier = safety.classify(makeAction(), 'diskpart clean all');
    expect(tier).toBe(SafetyTier.Blocked);
  });

  it('returns Confirm for rm -rf /', () => {
    const tier = safety.classify(makeAction(), 'rm -rf /');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Confirm for shutdown', () => {
    const tier = safety.classify(makeAction(), 'shutdown now');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Confirm for reboot', () => {
    const tier = safety.classify(makeAction(), 'reboot');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Confirm for send action', () => {
    const tier = safety.classify(makeAction(), 'send email');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Confirm for delete action', () => {
    const tier = safety.classify(makeAction(), 'delete file');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Confirm for sudo', () => {
    const tier = safety.classify(makeAction(), 'sudo apt install');
    expect(tier).toBe(SafetyTier.Confirm);
  });

  it('returns Preview for type action', () => {
    const tier = safety.classify(
      makeAction('type', { text: 'hello world' }),
      'type hello world',
    );
    expect(tier).toBe(SafetyTier.Preview);
  });

  it('returns Auto for safe mouse click', () => {
    const tier = safety.classify(makeAction('click'), 'click the OK button');
    expect(tier).toBe(SafetyTier.Auto);
  });

  it('returns Auto for open app', () => {
    const tier = safety.classify(makeAction(), 'open notepad');
    expect(tier).toBe(SafetyTier.Auto);
  });
});

describe('SafetyLayer.isBlocked', () => {
  const safety = new SafetyLayer(DEFAULT_CONFIG);

  it('returns true for absolutelyBlockedPatterns', () => {
    expect(safety.isBlocked(':(){:|:&};:')).toBe(true);
    expect(safety.isBlocked('dd if=/dev/zero')).toBe(true);
    expect(safety.isBlocked('format c:')).toBe(true);
  });

  it('returns false for dangerousPatterns (they need confirm, not block)', () => {
    expect(safety.isBlocked('rm -rf /')).toBe(false);
    expect(safety.isBlocked('shutdown')).toBe(false);
  });

  it('returns false for safe actions', () => {
    expect(safety.isBlocked('open notepad')).toBe(false);
    expect(safety.isBlocked('click button')).toBe(false);
  });
});

describe('SafetyLayer.confirmation flow', () => {
  it('requestConfirmation creates pending action', () => {
    const safety = new SafetyLayer(DEFAULT_CONFIG);
    expect(safety.hasPendingConfirmation()).toBe(false);

    safety.requestConfirmation(makeAction(), 'send email');
    expect(safety.hasPendingConfirmation()).toBe(true);

    const pending = safety.getPendingAction();
    expect(pending?.description).toBe('send email');
  });

  it('respondToConfirmation resolves the promise', async () => {
    const safety = new SafetyLayer(DEFAULT_CONFIG);
    const promise = safety.requestConfirmation(makeAction(), 'delete file');

    safety.respondToConfirmation(true);
    await expect(promise).resolves.toBe(true);
    expect(safety.hasPendingConfirmation()).toBe(false);
  });

  it('respondToConfirmation returns false when no pending', () => {
    const safety = new SafetyLayer(DEFAULT_CONFIG);
    expect(safety.respondToConfirmation(true)).toBe(false);
  });
});
