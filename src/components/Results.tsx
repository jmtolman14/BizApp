import { useEffect, useState } from 'react'
import { formatValue, shortUnit } from '../lib/format'
import { localDateKey, type ReadyPuzzle } from '../lib/puzzles'
import { MAX_TOTAL, bandFor, multiplierFor } from '../lib/scoring'
import { buildShareText, siteUrl } from '../lib/share'
import { BAND_BG, BAND_TEXT } from './bandStyles'
import { BandSquares } from './ui'
import { useCountUp } from './useCountUp'
import ShareButton from './ShareButton'

interface Props {
  date: string
  puzzle: ReadyPuzzle
  guesses: number[]
  bases: number[]
  bonuses: number[]
  times: number[]
  streak: number
  bestStreak: number
}

function msUntilMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}

/** Ticks every second: time to local midnight, plus today's date key. */
function useClock(): { remaining: number; today: string } {
  const read = () => ({ remaining: msUntilMidnight(), today: localDateKey() })
  const [clock, setClock] = useState(read)
  useEffect(() => {
    const id = window.setInterval(() => setClock(read()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return clock
}

function hms(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export default function Results({ date, puzzle, guesses, bases, bonuses, times, streak, bestStreak }: Props) {
  const accuracy = bases.reduce((sum, b, i) => sum + b * multiplierFor(i), 0)
  const speed = bonuses.reduce((sum, b) => sum + b, 0)
  const total = accuracy + speed
  const seconds = Math.round(times.reduce((sum, t) => sum + t, 0))
  const shown = useCountUp(total, 1200, 150)
  const { remaining, today } = useClock()
  const newDay = today !== date

  return (
    <section className="anim-rise flex flex-1 flex-col">
      <p className="mt-6 text-muted">{puzzle.title}</p>
      <p className="font-display mt-1 text-[clamp(4rem,22vw,8rem)] leading-[0.85] text-teal">{shown}</p>
      <p className="mt-2 text-lg text-muted tabular-nums">out of {MAX_TOTAL}</p>
      <p className="text-sm text-muted tabular-nums">
        {accuracy} accuracy + {speed} speed, {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} total time
      </p>

      <div className="mt-6">
        <BandSquares bases={bases} size="lg" />
      </div>

      <ol className="mt-8 divide-y divide-line border-y border-line">
        {puzzle.questions.map((q, i) => {
          const base = bases[i] ?? 0
          const band = bandFor(base)
          return (
            <li key={q.id} className="flex items-center gap-3 py-3">
              <span className={`h-3 w-3 shrink-0 rounded-[3px] ${BAND_BG[band]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{q.prompt}</p>
                <p className="text-xs text-muted tabular-nums">
                  You {formatValue(guesses[i], shortUnit(q.unit))}, answer {formatValue(q.answer, shortUnit(q.unit))}
                </p>
              </div>
              <span className={`font-display text-lg ${BAND_TEXT[band]}`}>{base * multiplierFor(i) + (bonuses[i] ?? 0)}</span>
            </li>
          )
        })}
      </ol>

      <dl className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">Current streak</dt>
          <dd className="font-display text-3xl">{streak}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Best streak</dt>
          <dd className="font-display text-3xl">{bestStreak}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-8">
        <ShareButton text={buildShareText(date, bases, total, siteUrl())} />
        {newDay ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-12 w-full rounded-2xl border-2 border-teal font-bold text-teal"
          >
            Play today's puzzle
          </button>
        ) : (
          <p className="mt-4 text-center text-muted">
            Next puzzle in <span className="font-bold text-text tabular-nums">{hms(remaining)}</span>
          </p>
        )}
      </div>
    </section>
  )
}
