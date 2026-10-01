import { describe, expect, it } from 'vitest'
import { applyCompletion, liveStreak, type Stats } from './storage'
import { positionToValue, sliderSteps, valueToPosition } from './format'
import {
  ALL_PUZZLES,
  addDays,
  localDateKey,
  puzzleForDate,
  puzzleProblems,
  shortDateLabel,
  type Puzzle,
} from './puzzles'

describe('puzzles.json', () => {
  it('has unique dates and question ids', () => {
    const dates = ALL_PUZZLES.map((p) => p.date)
    const ids = ALL_PUZZLES.flatMap((p) => p.questions.map((q) => q.id))
    expect(new Set(dates).size).toBe(dates.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has well-formed questions (null answers are reported, not failed)', () => {
    const problems = ALL_PUZZLES.flatMap(puzzleProblems).filter((p) => !p.includes('null'))
    expect(problems).toEqual([])
  })

  it('every answer is reachable within 1% on the slider', () => {
    for (const q of ALL_PUZZLES.flatMap((p) => p.questions)) {
      if (q.answer === null) continue
      const n = sliderSteps(q)
      const best = positionToValue(q, Math.round(valueToPosition(q, q.answer) * n) / n)
      expect(Math.abs(best - q.answer) / q.answer, q.id).toBeLessThan(0.01)
    }
  })
})

describe('dates', () => {
  it('formats local dates', () => {
    expect(localDateKey(new Date(2026, 9, 1, 23, 59))).toBe('2026-10-01')
    expect(shortDateLabel('2026-10-01')).toBe('Oct 1')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })
})

describe('puzzleForDate', () => {
  const q = (answer: number | null) => ({
    id: Math.random().toString(),
    prompt: '',
    unit: '',
    type: 'log' as const,
    min: 1,
    max: 1000,
    answer,
    explanation: '',
    source: '',
  })
  const ready = (date: string): Puzzle => ({ date, title: date, questions: [1, 2, 3, 4, 5].map(() => q(10)) })
  const pending: Puzzle = { date: '2026-01-03', title: 'x', questions: [q(10), q(10), q(null), q(10), q(10)] }
  const pool = [ready('2026-01-01'), ready('2026-01-02'), pending]

  it('returns the scheduled puzzle', () => {
    expect(puzzleForDate('2026-01-02', pool).date).toBe('2026-01-02')
  })

  it('falls back deterministically when no puzzle is scheduled', () => {
    const a = puzzleForDate('2030-05-05', pool)
    expect(puzzleForDate('2030-05-05', pool)).toBe(a)
    expect(['2026-01-01', '2026-01-02']).toContain(a.date)
  })

  it('skips a scheduled puzzle that still has unverified answers', () => {
    expect(puzzleForDate('2026-01-03', pool).date).not.toBe('2026-01-03')
  })

  it('always returns something for the real data', () => {
    expect(puzzleForDate('2099-12-31').questions).toHaveLength(5)
  })
})

describe('streaks', () => {
  const base: Stats = { currentStreak: 0, bestStreak: 0, lastCompletedDate: null, played: 0 }

  it('builds, breaks and remembers best streaks', () => {
    let s = applyCompletion(base, '2026-10-01')
    s = applyCompletion(s, '2026-10-02')
    s = applyCompletion(s, '2026-10-03')
    expect(s).toMatchObject({ currentStreak: 3, bestStreak: 3, played: 3 })
    s = applyCompletion(s, '2026-10-05')
    expect(s).toMatchObject({ currentStreak: 1, bestStreak: 3, played: 4 })
  })

  it('ignores completing the same day twice', () => {
    const s = applyCompletion(base, '2026-10-01')
    expect(applyCompletion(s, '2026-10-01')).toBe(s)
  })

  it('shows a lapsed streak as 0', () => {
    const s = applyCompletion(base, '2026-10-01')
    expect(liveStreak(s, '2026-10-02')).toBe(1)
    expect(liveStreak(s, '2026-10-03')).toBe(0)
  })
})
