import { STORAGE_PREFIX } from '../config'
import { addDays } from './puzzles'

/**
 * Saved state for one calendar day. `guesses`/`bases` grow as rounds are locked
 * in; `seen` counts reveals the player has dismissed with Next. Base scores are
 * frozen at lock-in so editing puzzles.json can't change a finished score.
 */
export interface DayState {
  date: string
  puzzleDate: string // which puzzle was served (differs from `date` on fallback days)
  guesses: number[]
  bases: number[]
  seen: number
}

export interface Stats {
  currentStreak: number
  bestStreak: number
  lastCompletedDate: string | null
  played: number
}

const EMPTY_STATS: Stats = { currentStreak: 0, bestStreak: 0, lastCompletedDate: null, played: 0 }

const dayKey = (date: string) => `${STORAGE_PREFIX}:day:${date}`
const statsKey = `${STORAGE_PREFIX}:stats`

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode / quota / disabled storage: the game still works, it just won't persist.
  }
}

export function loadDay(date: string): DayState | null {
  const s = read<DayState>(dayKey(date))
  if (!s || s.date !== date || !Array.isArray(s.guesses) || !Array.isArray(s.bases)) return null
  return s
}

export function saveDay(state: DayState): void {
  write(dayKey(state.date), state)
}

export function loadStats(): Stats {
  return { ...EMPTY_STATS, ...read<Stats>(statsKey) }
}

/** Pure streak update for finishing `date`. Finishing the same day twice is a no-op. */
export function applyCompletion(stats: Stats, date: string): Stats {
  if (stats.lastCompletedDate === date) return stats
  const continues = stats.lastCompletedDate === addDays(date, -1)
  const currentStreak = continues ? stats.currentStreak + 1 : 1
  return {
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    lastCompletedDate: date,
    played: stats.played + 1,
  }
}

/** Streak as of `today`: it is broken if neither today nor yesterday was finished. */
export function liveStreak(stats: Stats, today: string): number {
  const last = stats.lastCompletedDate
  return last === today || last === addDays(today, -1) ? stats.currentStreak : 0
}

export function recordCompletion(date: string): Stats {
  const next = applyCompletion(loadStats(), date)
  write(statsKey, next)
  return next
}
