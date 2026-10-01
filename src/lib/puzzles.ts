import rawPuzzles from '../data/puzzles.json'
import { ROUND_COUNT, ROUND_SECONDS, type QuestionType } from './scoring'

export interface Question {
  id: string
  prompt: string
  unit: string
  type: QuestionType
  min: number
  max: number
  /** Optional slider step for linear questions (e.g. 0.01 for prices). */
  step?: number
  /** Optional time limit override; defaults to ROUND_SECONDS for the round. */
  seconds?: number
  /** null = not yet verified; a puzzle containing one is never served. */
  answer: number | null
  explanation: string
  source: string
}

export interface Puzzle {
  date: string // YYYY-MM-DD
  title: string
  questions: Question[]
}

export type ReadyQuestion = Question & { answer: number }
export type ReadyPuzzle = Omit<Puzzle, 'questions'> & { questions: ReadyQuestion[] }

export const ALL_PUZZLES = rawPuzzles as Puzzle[]

export function secondsFor(q: Question, roundIndex: number): number {
  return q.seconds ?? ROUND_SECONDS[roundIndex] ?? ROUND_SECONDS[ROUND_SECONDS.length - 1]
}

/** Player's local calendar date as YYYY-MM-DD. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as a local date (avoids the UTC shift of `new Date('2026-10-01')`). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return localDateKey(d)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-01" → "Oct 1" */
export function shortDateLabel(key: string): string {
  const [, m, d] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

/** Problems with a puzzle's data, or [] if it is ready to serve. */
export function puzzleProblems(p: Puzzle): string[] {
  const problems: string[] = []
  if (p.questions.length !== ROUND_COUNT) problems.push(`${p.date}: expected ${ROUND_COUNT} questions`)
  for (const q of p.questions) {
    const at = `${p.date}/${q.id}`
    if (q.answer === null) problems.push(`${at}: answer is null (unverified)`)
    if (!(q.max > q.min)) problems.push(`${at}: max must be greater than min`)
    if (q.type === 'log' && q.min <= 0) problems.push(`${at}: log questions need min > 0`)
    if (q.answer !== null && (q.answer < q.min || q.answer > q.max)) {
      problems.push(`${at}: answer ${q.answer} outside [${q.min}, ${q.max}]`)
    }
  }
  return problems
}

export function isReady(p: Puzzle): p is ReadyPuzzle {
  return puzzleProblems(p).length === 0
}

/** Small stable string hash (FNV-1a) for the date-based fallback. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Today's puzzle: the one scheduled for this date if it is complete, otherwise
 * a deterministic pick from the ready pool so everyone still gets the same game.
 */
export function puzzleForDate(date: string, puzzles: Puzzle[] = ALL_PUZZLES): ReadyPuzzle {
  const scheduled = puzzles.find((p) => p.date === date)
  if (scheduled && isReady(scheduled)) return scheduled

  const pool = puzzles.filter(isReady).sort((a, b) => a.date.localeCompare(b.date))
  if (pool.length === 0) throw new Error('No playable puzzles in puzzles.json')
  return pool[hashString(date) % pool.length]
}
