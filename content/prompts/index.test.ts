import { describe, expect, it } from 'vitest';
import { CATEGORIES, PROMPTS, dailyPrompt, pickPrompt } from './index';

describe('authored conversation bank', () => {
  it('contains 120 distinct complete conversations across 15 categories', () => {
    expect(PROMPTS).toHaveLength(120);
    expect(CATEGORIES).toHaveLength(15);
    expect(new Set(PROMPTS.map(prompt => prompt.id)).size).toBe(120);
    expect(new Set(PROMPTS.map(prompt => prompt.messages.map(message => message.text).join('|'))).size).toBe(120);
    for (const prompt of PROMPTS) {
      expect(prompt.messages.length).toBeGreaterThanOrEqual(2);
      expect(prompt.deletedIndex).toBeGreaterThanOrEqual(0);
      expect(prompt.deletedIndex).toBeLessThanOrEqual(prompt.messages.length);
      expect(prompt.example.length).toBeGreaterThan(10);
      expect(prompt.rating).toBe('family');
      expect(prompt.language).toBe('en');
      expect(prompt.version).toBeGreaterThan(0);
      for (const message of prompt.messages) {
        expect(message.sender.length).toBeGreaterThan(0);
        expect(message.text.length).toBeLessThanOrEqual(150);
      }
      if (prompt.constraint === 'Use exactly five words.') expect(prompt.example.trim().split(/\s+/)).toHaveLength(5);
    }
  });

  it('offers substantial tailored couples packs without requiring disclosures', () => {
    const couples = PROMPTS.filter(prompt => prompt.modes.includes('couples'));
    expect(couples.length).toBeGreaterThanOrEqual(30);
    expect(couples.filter(prompt => prompt.tags.includes('wholesome')).length).toBeGreaterThanOrEqual(12);
    expect(couples.filter(prompt => prompt.tags.includes('date-night')).length).toBeGreaterThanOrEqual(12);
    expect(couples.every(prompt => prompt.tags.includes('couples'))).toBe(true);
  });

  it('avoids every used prompt until the mode pool is exhausted', () => {
    const usedIds: string[] = [];
    for (let i = 0; i < PROMPTS.length; i++) {
      const next = pickPrompt({ mode: 'duo', usedIds, seed: `round-${i}` });
      expect(usedIds).not.toContain(next.id);
      usedIds.push(next.id);
    }
    expect(PROMPTS.map(prompt => prompt.id)).toContain(pickPrompt({ mode: 'duo', usedIds, seed: 'reset' }).id);
  });

  it('supports category and couples pack selection', () => {
    expect(pickPrompt({ mode: 'party', category: 'science-fiction', seed: 1 }).category).toBe('science-fiction');
    expect(pickPrompt({ mode: 'couples', category: 'wholesome', seed: 1 }).tags).toContain('wholesome');
    expect(pickPrompt({ mode: 'couples', category: 'date-night', seed: 1 }).tags).toContain('date-night');
    expect(pickPrompt({ mode: 'duo', category: 'unknown', seed: 1 }).id).toBeTruthy();
  });

  it('gives deterministic daily prompts and cycles the bank without repeats', () => {
    expect(dailyPrompt('2026-10-28').id).toBe(dailyPrompt('2026-10-28').id);
    const selected = new Set<string>();
    const start = Date.parse('2026-10-28T00:00:00.000Z');
    for (let i = 0; i < 120; i++) selected.add(dailyPrompt(new Date(start + i * 86_400_000).toISOString().slice(0, 10)).id);
    expect(selected.size).toBe(120);
    expect(() => dailyPrompt('2026-02-30')).toThrow();
    expect(() => dailyPrompt('yesterday')).toThrow();
  });
});
