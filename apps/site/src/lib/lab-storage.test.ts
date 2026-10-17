import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE_INFO } from '@birb-learn/code-runner/src/languages';
import { loadLabCode, saveLabCode, takeIncoming } from './lab-storage';

const INCOMING_KEY = 'birb-learn:lab:incoming';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('loadLabCode and saveLabCode', () => {
  it('falls back to the template when nothing is stored', () => {
    expect(loadLabCode('python')).toBe(LANGUAGE_INFO.python.template);
  });

  it('round-trips the code per language', () => {
    saveLabCode('python', 'print(1)');
    saveLabCode('lua', 'print(2)');
    expect(loadLabCode('python')).toBe('print(1)');
    expect(loadLabCode('lua')).toBe('print(2)');
    expect(localStorage.getItem('birb-learn:lab:python')).toBe('print(1)');
  });

  it('keeps an emptied editor empty instead of restoring the template', () => {
    saveLabCode('python', '');
    expect(loadLabCode('python')).toBe('');
  });

  it('falls back to the template when reading throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(loadLabCode('ruby')).toBe(LANGUAGE_INFO.ruby.template);
  });

  it('does not crash when writing throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => saveLabCode('ruby', 'puts 1')).not.toThrow();
  });
});

describe('takeIncoming', () => {
  it('returns the handed-over snippet and removes it', () => {
    sessionStorage.setItem(
      INCOMING_KEY,
      JSON.stringify({ language: 'python', code: 'print(input())', stdin: '5\n', sqlSetup: '' }),
    );
    expect(takeIncoming()).toEqual({ language: 'python', code: 'print(input())', stdin: '5\n', sqlSetup: '' });
    expect(sessionStorage.getItem(INCOMING_KEY)).toBeNull();
    expect(takeIncoming()).toBeNull();
  });

  it('accepts a snippet without stdin or setup', () => {
    sessionStorage.setItem(INCOMING_KEY, JSON.stringify({ language: 'go', code: 'package main' }));
    expect(takeIncoming()).toEqual({ language: 'go', code: 'package main' });
  });

  it('returns null, and still clears the entry, for an unknown language', () => {
    sessionStorage.setItem(INCOMING_KEY, JSON.stringify({ language: 'cobol', code: 'x' }));
    expect(takeIncoming()).toBeNull();
    expect(sessionStorage.getItem(INCOMING_KEY)).toBeNull();
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['a non-object', '42'],
    ['a missing code', JSON.stringify({ language: 'python' })],
    ['a non-string code', JSON.stringify({ language: 'python', code: 3 })],
  ])('returns null for %s', (_name, raw) => {
    sessionStorage.setItem(INCOMING_KEY, raw);
    expect(takeIncoming()).toBeNull();
  });

  it('returns null when nothing was handed over', () => {
    expect(takeIncoming()).toBeNull();
  });

  it('returns null when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(takeIncoming()).toBeNull();
  });
});
