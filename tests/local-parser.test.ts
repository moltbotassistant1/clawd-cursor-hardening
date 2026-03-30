import { describe, expect, it } from 'vitest';
import { LocalTaskParser } from '../src/local-parser';

const parser = new LocalTaskParser();

describe('LocalTaskParser.decomposeTask', () => {
  // --- Null/invalid inputs ---
  it('returns null for empty string', () => {
    expect(parser.decomposeTask('')).toBeNull();
  });

  it('returns null for whitespace-only', () => {
    expect(parser.decomposeTask('   ')).toBeNull();
  });

  it('returns null for unrecognized input', () => {
    expect(parser.decomposeTask('dance like nobody is watching')).toBeNull();
  });

  // --- Single actions ---
  it('parses "open chrome"', () => {
    expect(parser.decomposeTask('open chrome')).toEqual(['open chrome']);
  });

  it('parses "launch notepad" (launch → open)', () => {
    expect(parser.decomposeTask('launch notepad')).toEqual(['open notepad']);
  });

  it('parses "go to google.com"', () => {
    expect(parser.decomposeTask('go to google.com')).toEqual(['go to google.com']);
  });

  it('parses "navigate to https://example.com"', () => {
    expect(parser.decomposeTask('navigate to https://example.com')).toEqual(['go to https://example.com']);
  });

  it('parses "close firefox"', () => {
    expect(parser.decomposeTask('close firefox')).toEqual(['close firefox']);
  });

  it('parses "type hello world"', () => {
    expect(parser.decomposeTask('type hello world')).toEqual(['type hello world']);
  });

  it('parses type with double quotes and strips them', () => {
    expect(parser.decomposeTask('type "hello world"')).toEqual(['type hello world']);
  });

  it('parses type with single quotes and strips them', () => {
    expect(parser.decomposeTask("type 'hello world'")).toEqual(['type hello world']);
  });

  it('parses "click submit"', () => {
    expect(parser.decomposeTask('click submit')).toEqual(['click submit']);
  });

  it('parses "press enter"', () => {
    expect(parser.decomposeTask('press enter')).toEqual(['press enter']);
  });

  it('parses bare "minimize" to "minimize window"', () => {
    expect(parser.decomposeTask('minimize')).toEqual(['minimize window']);
  });

  it('parses "maximize chrome"', () => {
    expect(parser.decomposeTask('maximize chrome')).toEqual(['maximize chrome']);
  });

  it('parses "focus terminal"', () => {
    expect(parser.decomposeTask('focus terminal')).toEqual(['focus terminal']);
  });

  it('parses "switch to vscode" → focus', () => {
    expect(parser.decomposeTask('switch to vscode')).toEqual(['focus vscode']);
  });

  // --- Shortcuts ---
  it('parses "copy"', () => {
    expect(parser.decomposeTask('copy')).toEqual(['copy']);
  });

  it('parses "paste"', () => {
    expect(parser.decomposeTask('paste')).toEqual(['paste']);
  });

  it('parses "undo"', () => {
    expect(parser.decomposeTask('undo')).toEqual(['undo']);
  });

  it('parses "ctrl+z" as undo', () => {
    expect(parser.decomposeTask('ctrl+z')).toEqual(['undo']);
  });

  it('parses "select all"', () => {
    expect(parser.decomposeTask('select all')).toEqual(['select all']);
  });

  it('parses "refresh"', () => {
    expect(parser.decomposeTask('refresh')).toEqual(['refresh']);
  });

  it('parses "save"', () => {
    expect(parser.decomposeTask('save')).toEqual(['save']);
  });

  // --- Scroll ---
  it('parses "scroll down"', () => {
    expect(parser.decomposeTask('scroll down')).toEqual(['scroll down']);
  });

  it('parses "scroll up by 100 px"', () => {
    expect(parser.decomposeTask('scroll up by 100 px')).toEqual(['scroll up 100px']);
  });

  // --- Wait ---
  it('parses "wait 3 seconds"', () => {
    expect(parser.decomposeTask('wait 3 seconds')).toEqual(['wait 3s']);
  });

  it('parses bare "wait"', () => {
    expect(parser.decomposeTask('wait')).toEqual(['wait']);
  });

  // --- Double/right click ---
  it('parses "double-click icon"', () => {
    expect(parser.decomposeTask('double-click icon')).toEqual(['double click icon']);
  });

  it('parses "right-click desktop"', () => {
    expect(parser.decomposeTask('right-click desktop')).toEqual(['right click desktop']);
  });

  // --- Search ---
  it('parses "search for cats"', () => {
    expect(parser.decomposeTask('search for cats')).toEqual(['search for cats']);
  });

  // --- Compound tasks ---
  it('splits on "and"', () => {
    expect(parser.decomposeTask('open chrome and go to google.com'))
      .toEqual(['open chrome', 'go to google.com']);
  });

  it('splits on "then"', () => {
    expect(parser.decomposeTask('open notepad then type hello'))
      .toEqual(['open notepad', 'type hello']);
  });

  it('splits on comma', () => {
    expect(parser.decomposeTask('copy, paste')).toEqual(['copy', 'paste']);
  });

  it('does not split inside double quotes', () => {
    expect(parser.decomposeTask('type "hello, world"')).toEqual(['type hello, world']);
  });

  it('returns null if any part is unrecognized', () => {
    expect(parser.decomposeTask('open chrome and do a backflip')).toBeNull();
  });
});

describe('LocalTaskParser.canParse', () => {
  it('returns true for parseable tasks', () => {
    expect(parser.canParse('open chrome')).toBe(true);
    expect(parser.canParse('copy')).toBe(true);
    expect(parser.canParse('scroll down')).toBe(true);
  });

  it('returns false for unparseable tasks', () => {
    expect(parser.canParse('explain quantum physics')).toBe(false);
    expect(parser.canParse('')).toBe(false);
  });
});
