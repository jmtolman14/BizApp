import { useState, type CSSProperties } from 'react'
import { formatParts, formatValue, positionToValue, shortUnit, sliderSteps } from '../lib/format'
import type { ReadyQuestion } from '../lib/puzzles'
import { multiplierFor } from '../lib/scoring'
import { PrimaryButton } from './ui'

interface Props {
  question: ReadyQuestion
  roundIndex: number
  onLock: (guess: number) => void
}

export default function Round({ question, roundIndex, onLock }: Props) {
  const steps = sliderSteps(question)
  const [pos, setPos] = useState(() => Math.round(steps / 2))
  const value = positionToValue(question, pos / steps)
  const parts = formatParts(value, question.unit)
  const multiplier = multiplierFor(roundIndex)

  const nudge = (delta: number) => setPos((p) => Math.min(steps, Math.max(0, p + delta)))

  return (
    <section key={question.id} className="anim-rise flex flex-1 flex-col">
      <div className="mt-6 flex items-baseline justify-between text-sm text-muted">
        <span>Round {roundIndex + 1} of 5</span>
        {multiplier > 1 && (
          <span className="rounded-full bg-teal/15 px-3 py-1 font-bold text-teal">{multiplier}× points</span>
        )}
      </div>

      <h2 className="mt-4 text-[1.6rem] leading-[1.2] font-semibold text-balance">{question.prompt}</h2>

      <div className="mt-auto pt-8">
        <output
          aria-live="polite"
          className="font-display block text-[clamp(3rem,17vw,5.5rem)] leading-none text-teal"
        >
          {parts.prefix && <span className="text-[0.6em] align-[0.35em]">{parts.prefix}</span>}
          {parts.number}
          {parts.suffix === '%' && <span className="text-[0.6em]">%</span>}
        </output>
        <p className="mt-2 h-6 text-lg text-muted">{parts.suffix !== '%' && parts.suffix}</p>

        <div className="mt-4 flex items-center gap-3">
          <NudgeButton label="Decrease" onClick={() => nudge(-1)}>−</NudgeButton>
          <input
            type="range"
            className="estimate-slider"
            min={0}
            max={steps}
            step={1}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label="Your estimate"
            aria-valuetext={formatValue(value, question.unit)}
            style={{ '--fill': `${(pos / steps) * 100}%` } as CSSProperties}
          />
          <NudgeButton label="Increase" onClick={() => nudge(1)}>+</NudgeButton>
        </div>
        <div className="mt-1 flex justify-between px-1 text-sm text-muted tabular-nums">
          <span>{formatValue(question.min, shortUnit(question.unit))}</span>
          <span>{question.type === 'log' ? 'log scale' : ''}</span>
          <span>{formatValue(question.max, shortUnit(question.unit))}</span>
        </div>

        <PrimaryButton className="mt-8" onClick={() => onLock(value)}>
          Lock in
        </PrimaryButton>
      </div>
    </section>
  )
}

function NudgeButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-line text-2xl font-bold text-text active:border-teal active:text-teal"
    >
      {children}
    </button>
  )
}
