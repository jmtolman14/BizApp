import { describe, expect, it } from 'vitest'
import {
  MAX_TOTAL,
  MULTIPLIERS,
  bandFor,
  baseScore,
  linearScore,
  logScore,
  multiplierFor,
  roundPoints,
} from './scoring'

describe('logScore', () => {
  it('scores 100 for an exact guess', () => {
    expect(logScore(1_650_000_000, 1_650_000_000)).toBe(100)
  })

  it('scores 0 when exactly 10x off in either direction', () => {
    expect(logScore(1000, 100)).toBe(0)
    expect(logScore(10, 100)).toBe(0)
  })

  it('scores 0 when more than 10x off', () => {
    expect(logScore(1_000_000, 100)).toBe(0)
    expect(logScore(0.001, 100)).toBe(0)
  })

  it('is symmetric in ratio', () => {
    expect(logScore(200, 100)).toBe(logScore(50, 100))
  })

  it('scores 2x off as 70 (1 - log10(2) ≈ 0.699)', () => {
    expect(logScore(200, 100)).toBe(70)
  })

  it('scores sqrt(10)x off as 50', () => {
    expect(logScore(100 * Math.sqrt(10), 100)).toBe(50)
  })

  it('returns 0 for zero, negative, NaN and infinite guesses', () => {
    expect(logScore(0, 100)).toBe(0)
    expect(logScore(-5, 100)).toBe(0)
    expect(logScore(Number.NaN, 100)).toBe(0)
    expect(logScore(Number.POSITIVE_INFINITY, 100)).toBe(0)
  })
})

describe('linearScore', () => {
  it('scores 100 for an exact guess', () => {
    expect(linearScore(21, 21, 0, 50)).toBe(100)
  })

  it('scores 0 when off by the full range', () => {
    expect(linearScore(100, 0, 0, 100)).toBe(0)
  })

  it('scales with the slider range', () => {
    expect(linearScore(60, 50, 0, 100)).toBe(90)
    expect(linearScore(55, 50, 0, 50)).toBe(90)
  })

  it('rounds to the nearest integer', () => {
    // 1 - 1.5/10 = 0.85 → 85; 1 - 0.33/10 = 0.967 → 97
    expect(linearScore(6.5, 5, 0, 10)).toBe(85)
    expect(linearScore(5.33, 5, 0, 10)).toBe(97)
  })

  it('handles out-of-range guesses without going negative', () => {
    expect(linearScore(150, 50, 0, 100)).toBe(0)
    expect(linearScore(-500, 50, 0, 100)).toBe(0)
    expect(linearScore(105, 95, 0, 100)).toBe(90)
  })

  it('returns 0 for a degenerate range or non-finite guess', () => {
    expect(linearScore(5, 5, 10, 10)).toBe(0)
    expect(linearScore(Number.NaN, 5, 0, 10)).toBe(0)
  })
})

describe('baseScore', () => {
  it('dispatches on question type', () => {
    expect(baseScore({ type: 'log', min: 1, max: 1e6, answer: 1000 }, 10_000)).toBe(0)
    expect(baseScore({ type: 'linear', min: 0, max: 100, answer: 40 }, 30)).toBe(90)
  })

  it('scores out-of-range log guesses on the ratio, not the slider bounds', () => {
    expect(baseScore({ type: 'log', min: 10, max: 1000, answer: 20 }, 2)).toBe(0)
    expect(baseScore({ type: 'log', min: 10, max: 1000, answer: 20 }, 40)).toBe(70)
  })
})

describe('multipliers and points', () => {
  it('uses 1x, 1x, 2x, 2x, 4x for a 1000-point maximum', () => {
    expect([...MULTIPLIERS]).toEqual([1, 1, 2, 2, 4])
    expect(MAX_TOTAL).toBe(1000)
  })

  it('multiplies the rounded base score', () => {
    expect(roundPoints(83, 0)).toBe(83)
    expect(roundPoints(83, 2)).toBe(166)
    expect(roundPoints(83, 4)).toBe(332)
  })

  it('throws for a round that does not exist', () => {
    expect(() => multiplierFor(5)).toThrow(RangeError)
  })
})

describe('bandFor', () => {
  it('maps band boundaries', () => {
    expect(bandFor(100)).toBe('green')
    expect(bandFor(80)).toBe('green')
    expect(bandFor(79)).toBe('yellow')
    expect(bandFor(60)).toBe('yellow')
    expect(bandFor(59)).toBe('orange')
    expect(bandFor(30)).toBe('orange')
    expect(bandFor(29)).toBe('red')
    expect(bandFor(0)).toBe('red')
  })
})
