import { useEffect, useMemo, useState } from 'react'
import { APP_NAME } from '../config'
import { localDateKey, puzzleForDate, secondsFor, shortDateLabel } from '../lib/puzzles'
import { MULTIPLIERS, ROUND_COUNT, SPEED_BONUS_RATE, baseScore, roundPoints, speedBonus } from '../lib/scoring'
import { loadDay, loadStats, liveStreak, recordCompletion, saveDay, type DayState } from '../lib/storage'
import { BandSquares, PrimaryButton } from './ui'
import Results from './Results'
import Reveal from './Reveal'
import Round from './Round'

export default function Game() {
  // The game date is fixed when the app opens; a puzzle started before midnight
  // finishes as that day's puzzle.
  const [date] = useState(() => localDateKey())
  const puzzle = useMemo(() => puzzleForDate(date), [date])

  const [day, setDay] = useState<DayState>(() => {
    const saved = loadDay(date)
    // Keep a finished game no matter what; drop an unfinished one if the puzzle changed.
    if (saved && (saved.puzzleDate === puzzle.date || saved.bases.length === ROUND_COUNT)) return saved
    return { date, puzzleDate: puzzle.date, guesses: [], bases: [], bonuses: [], times: [], seen: 0, roundStartedAt: null, draft: null }
  })
  const [stats, setStats] = useState(loadStats)
  const [started, setStarted] = useState(day.guesses.length > 0 || day.roundStartedAt !== null)

  useEffect(() => {
    if (started) saveDay(day)
  }, [day, started])

  const locked = day.bases.length
  const finished = locked === ROUND_COUNT

  const lockIn = (guess: number) => {
    const question = puzzle.questions[locked]
    const limit = secondsFor(question, locked)
    const used = Math.min(limit, Math.max(0, (Date.now() - (day.roundStartedAt ?? Date.now())) / 1000))
    const base = baseScore(question, guess)
    const next: DayState = {
      ...day,
      guesses: [...day.guesses, guess],
      bases: [...day.bases, base],
      bonuses: [...day.bonuses, speedBonus(roundPoints(base, locked), 1 - used / limit)],
      times: [...day.times, Math.round(used * 10) / 10],
      roundStartedAt: null,
      draft: null,
    }
    setDay(next)
    if (next.bases.length === ROUND_COUNT) setStats(recordCompletion(date))
  }

  // The clock for a round starts the moment its question is shown.
  const advance = () =>
    setDay((d) => ({ ...d, seen: d.seen + 1, roundStartedAt: d.seen + 1 < ROUND_COUNT ? Date.now() : null }))

  const start = () => {
    setDay((d) => ({ ...d, roundStartedAt: d.roundStartedAt ?? Date.now() }))
    setStarted(true)
  }

  let screen
  if (!started) {
    screen = <Intro title={puzzle.title} onStart={start} />
  } else if (day.seen < locked) {
    const i = day.seen
    screen = (
      <Reveal
        key={`reveal-${i}`}
        question={puzzle.questions[i]}
        roundIndex={i}
        guess={day.guesses[i]}
        base={day.bases[i]}
        bonus={day.bonuses[i]}
        timeUsed={day.times[i]}
        timeLimit={secondsFor(puzzle.questions[i], i)}
        isLast={i === ROUND_COUNT - 1}
        onNext={advance}
      />
    )
  } else if (!finished) {
    screen = (
      <Round
        key={`round-${locked}`}
        question={puzzle.questions[locked]}
        roundIndex={locked}
        startedAt={day.roundStartedAt}
        seconds={secondsFor(puzzle.questions[locked], locked)}
        draft={day.draft}
        onDraft={(v) => setDay((d) => ({ ...d, draft: v }))}
        onLock={lockIn}
      />
    )
  } else {
    screen = (
      <Results
        date={date}
        puzzle={puzzle}
        guesses={day.guesses}
        bases={day.bases}
        bonuses={day.bonuses}
        times={day.times}
        streak={liveStreak(stats, localDateKey())}
        bestStreak={stats.bestStreak}
      />
    )
  }

  const current = started && !finished && day.seen === locked ? locked : undefined

  return (
    <main className="app-shell mx-auto flex w-full max-w-md flex-col">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl text-text">{APP_NAME}</h1>
          <span className="text-sm text-muted">{shortDateLabel(date)}</span>
        </div>
        <BandSquares bases={day.bases} current={current} />
      </header>
      {screen}
    </main>
  )
}

function Intro({ title, onStart }: { title: string; onStart: () => void }) {
  return (
    <section className="anim-rise flex flex-1 flex-col">
      <div className="mt-[12dvh]">
        <p className="text-muted">Today's puzzle</p>
        <h2 className="font-display mt-2 text-[clamp(2.5rem,12vw,3.75rem)] leading-[0.95] text-balance text-teal">
          {title}
        </h2>
      </div>

      <ul className="mt-10 space-y-4 text-[1.05rem] leading-snug">
        <li>Five case interview math problems. Every number you need is in the question.</li>
        <li>
          The clock starts when each question appears. Answer fast for up to {SPEED_BONUS_RATE * 100}% bonus
          points. When time runs out, whatever is on the slider locks in.
        </li>
        <li>
          Closer answers score more. Later rounds are harder and count{' '}
          {MULTIPLIERS.slice(2).map((m) => `${m}×`).join(', ')}.
        </li>
        <li>One shot per day, the same puzzle for everyone. Do the math in your head.</li>
      </ul>

      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onStart}>Start</PrimaryButton>
      </div>
    </section>
  )
}
