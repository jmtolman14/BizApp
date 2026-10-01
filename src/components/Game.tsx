import { useEffect, useMemo, useState } from 'react'
import { APP_NAME } from '../config'
import { localDateKey, puzzleForDate, shortDateLabel } from '../lib/puzzles'
import { MULTIPLIERS, ROUND_COUNT, baseScore } from '../lib/scoring'
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
    return { date, puzzleDate: puzzle.date, guesses: [], bases: [], seen: 0 }
  })
  const [stats, setStats] = useState(loadStats)
  const [started, setStarted] = useState(day.guesses.length > 0)

  useEffect(() => {
    if (started) saveDay(day)
  }, [day, started])

  const locked = day.bases.length
  const finished = locked === ROUND_COUNT

  const lockIn = (guess: number) => {
    const question = puzzle.questions[locked]
    const next: DayState = {
      ...day,
      guesses: [...day.guesses, guess],
      bases: [...day.bases, baseScore(question, guess)],
    }
    setDay(next)
    if (next.bases.length === ROUND_COUNT) setStats(recordCompletion(date))
  }

  const advance = () => setDay((d) => ({ ...d, seen: d.seen + 1 }))

  let screen
  if (!started) {
    screen = <Intro title={puzzle.title} onStart={() => setStarted(true)} />
  } else if (day.seen < locked) {
    const i = day.seen
    screen = (
      <Reveal
        key={`reveal-${i}`}
        question={puzzle.questions[i]}
        roundIndex={i}
        guess={day.guesses[i]}
        base={day.bases[i]}
        isLast={i === ROUND_COUNT - 1}
        onNext={advance}
      />
    )
  } else if (!finished) {
    screen = <Round key={`round-${locked}`} question={puzzle.questions[locked]} roundIndex={locked} onLock={lockIn} />
  } else {
    screen = (
      <Results
        date={date}
        puzzle={puzzle}
        guesses={day.guesses}
        bases={day.bases}
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
        <li>Five numbers to estimate. Drag the slider, then lock in your guess.</li>
        <li>
          Closer guesses earn more, up to 100 points a round. Later rounds are harder and count{' '}
          {MULTIPLIERS.slice(2).map((m) => `${m}×`).join(', ')}.
        </li>
        <li>One shot per day. Everyone gets the same puzzle.</li>
      </ul>

      <div className="mt-auto pt-8">
        <PrimaryButton onClick={onStart}>Start</PrimaryButton>
      </div>
    </section>
  )
}
