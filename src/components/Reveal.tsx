import { useEffect, useState } from 'react'
import { formatValue, shortUnit, valueToPosition } from '../lib/format'
import type { ReadyQuestion } from '../lib/puzzles'
import { BAND_LABEL, bandFor, multiplierFor } from '../lib/scoring'
import { BAND_BG, BAND_TEXT } from './bandStyles'
import { PrimaryButton } from './ui'
import { useCountUp } from './useCountUp'

interface Props {
  question: ReadyQuestion
  roundIndex: number
  guess: number
  base: number
  isLast: boolean
  onNext: () => void
}

export default function Reveal({ question, roundIndex, guess, base, isLast, onNext }: Props) {
  const multiplier = multiplierFor(roundIndex)
  const points = base * multiplier
  const band = bandFor(base)
  const shown = useCountUp(points, 900, 250)

  const guessPos = valueToPosition(question, guess)
  const answerPos = valueToPosition(question, question.answer)
  // The answer marker starts on the guess and slides to the truth.
  const [markerPos, setMarkerPos] = useState(guessPos)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMarkerPos(answerPos))
    return () => cancelAnimationFrame(id)
  }, [answerPos])

  return (
    <section className="anim-rise flex flex-1 flex-col">
      <h2 className="mt-5 text-base leading-snug font-medium text-muted text-balance">{question.prompt}</h2>

      <div className="mt-4">
        <p className={`text-lg font-bold ${BAND_TEXT[band]}`}>{BAND_LABEL[band]}</p>
        <p className={`font-display text-[clamp(3.75rem,21vw,6rem)] leading-[0.9] ${BAND_TEXT[band]}`}>
          +{shown}
        </p>
        <p className="mt-2 text-muted tabular-nums">
          {multiplier > 1 ? `${base} base points × ${multiplier}` : `${base} of 100 points`}
        </p>
      </div>

      <div className="mt-5">
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
          <span
            className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-ink bg-teal"
            style={{ left: `${guessPos * 100}%` }}
          />
          <span
            className={`marker-slide absolute top-1/2 h-10 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${BAND_BG[band]}`}
            style={{ left: `${markerPos * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted tabular-nums">
          <span>{formatValue(question.min, shortUnit(question.unit))}</span>
          <span>{formatValue(question.max, shortUnit(question.unit))}</span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Your guess
            </dt>
            <dd className="font-display mt-1 text-2xl">{formatValue(guess, shortUnit(question.unit))}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm text-muted">
              <span className={`h-3 w-1.5 rounded-full ${BAND_BG[band]}`} /> Answer
            </dt>
            <dd className="font-display mt-1 text-2xl">{formatValue(question.answer, shortUnit(question.unit))}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 leading-normal">{question.explanation}</p>
      <p className="mt-2 text-xs leading-snug text-muted">Source: {question.source}</p>

      <div className="mt-auto pt-6">
        <PrimaryButton onClick={onNext}>
          {isLast ? 'See results' : 'Next round'}
        </PrimaryButton>
      </div>
    </section>
  )
}
