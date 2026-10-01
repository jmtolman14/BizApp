// Pure scoring logic. No DOM, no storage — keep it that way so it stays testable.

export type QuestionType = 'log' | 'linear'

export interface ScorableQuestion {
  type: QuestionType
  min: number
  max: number
  answer: number
}

export const ROUND_COUNT = 5
export const MULTIPLIERS = [1, 1, 2, 2, 4] as const
export const MAX_BASE = 100
export const MAX_ACCURACY = MULTIPLIERS.reduce((sum, m) => sum + m * MAX_BASE, 0) // 1000

/** Seconds allowed per round (questions can override with `seconds`). */
export const ROUND_SECONDS = [30, 45, 60, 75, 90] as const

/** Answering instantly adds up to 20% of the round's points; nothing once the clock runs out. */
export const SPEED_BONUS_RATE = 0.2
export const MAX_TOTAL = Math.round(MAX_ACCURACY * (1 + SPEED_BONUS_RATE)) // 1200

/**
 * Bonus scales with both accuracy (the round's points) and the share of time
 * left, so a fast wild guess earns almost nothing.
 */
export function speedBonus(points: number, timeLeftFraction: number): number {
  const f = Number.isFinite(timeLeftFraction) ? Math.min(1, Math.max(0, timeLeftFraction)) : 0
  return Math.round(points * SPEED_BONUS_RATE * f)
}

/** 100 for exact, 0 at 10x off (either direction). Non-positive guesses score 0. */
export function logScore(guess: number, answer: number): number {
  if (!Number.isFinite(guess) || !Number.isFinite(answer) || guess <= 0 || answer <= 0) return 0
  const raw = MAX_BASE * Math.max(0, 1 - Math.abs(Math.log(guess / answer)) / Math.log(10))
  return Math.round(raw)
}

/** 100 for exact, falling linearly to 0 once the miss equals the whole slider range. */
export function linearScore(guess: number, answer: number, min: number, max: number): number {
  const range = max - min
  if (!Number.isFinite(guess) || !Number.isFinite(answer) || !(range > 0)) return 0
  const raw = MAX_BASE * Math.max(0, 1 - Math.abs(guess - answer) / range)
  return Math.round(raw)
}

/** Base score 0–100 for a guess, before the round multiplier. */
export function baseScore(question: ScorableQuestion, guess: number): number {
  return question.type === 'log'
    ? logScore(guess, question.answer)
    : linearScore(guess, question.answer, question.min, question.max)
}

export function multiplierFor(roundIndex: number): number {
  const m = MULTIPLIERS[roundIndex]
  if (m === undefined) throw new RangeError(`No round at index ${roundIndex}`)
  return m
}

/** Final points for a round: rounded base score times the round multiplier. */
export function roundPoints(base: number, roundIndex: number): number {
  return base * multiplierFor(roundIndex)
}

export type Band = 'green' | 'yellow' | 'orange' | 'red'

/** Color band from the base (0–100) score. */
export function bandFor(base: number): Band {
  if (base >= 80) return 'green'
  if (base >= 60) return 'yellow'
  if (base >= 30) return 'orange'
  return 'red'
}

export const BAND_EMOJI: Record<Band, string> = {
  green: '🟩',
  yellow: '🟨',
  orange: '🟧',
  red: '🟥',
}

export const BAND_LABEL: Record<Band, string> = {
  green: 'Nailed it',
  yellow: 'Close',
  orange: 'In the ballpark',
  red: 'Way off',
}
