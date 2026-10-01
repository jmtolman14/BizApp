import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  formatParts,
  formatValue,
  isHugging,
  parseEstimate,
  positionToValue,
  shortUnit,
  sliderSteps,
  startValue,
  valueToPosition,
} from '../lib/format'
import type { ReadyQuestion } from '../lib/puzzles'
import { multiplierFor } from '../lib/scoring'
import { PrimaryButton } from './ui'

interface Props {
  question: ReadyQuestion
  roundIndex: number
  /** Wall-clock ms when this round's timer started (null: start now). */
  startedAt: number | null
  seconds: number
  draft: number | null
  onDraft: (value: number) => void
  onLock: (guess: number) => void
}

/** Seconds left, ticking 10x a second so the bar drains smoothly. */
function useTimeLeft(startedAt: number, seconds: number): number {
  const [left, setLeft] = useState(() => Math.max(0, seconds - (Date.now() - startedAt) / 1000))
  useEffect(() => {
    const id = window.setInterval(() => setLeft(Math.max(0, seconds - (Date.now() - startedAt) / 1000)), 100)
    return () => window.clearInterval(id)
  }, [startedAt, seconds])
  return left
}

export default function Round({ question, roundIndex, startedAt: savedStart, seconds, draft, onDraft, onLock }: Props) {
  const [mountedAt] = useState(() => Date.now())
  const startedAt = savedStart ?? mountedAt
  const steps = sliderSteps(question)
  const [value, setValue] = useState(() => draft ?? startValue(question))
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [typoError, setTypoError] = useState(false)
  const lockedRef = useRef(false)

  const timeLeft = useTimeLeft(startedAt, seconds)
  const fraction = timeLeft / seconds
  const multiplier = multiplierFor(roundIndex)
  const pos = Math.round(valueToPosition(question, value) * steps)
  const parts = formatParts(value, question.unit)

  const clamp = (v: number) => Math.min(question.max, Math.max(question.min, v))

  const update = (v: number) => {
    setValue(v)
    onDraft(v)
  }

  /** Locks the typed number if the keyboard is open and it parses, else the slider value. */
  const lockCurrent = () => {
    if (lockedRef.current) return
    lockedRef.current = true
    const typed = editing ? parseEstimate(text) : null
    onLock(typed !== null ? clamp(typed) : value)
  }

  // Buzzer: whatever is showing locks in.
  useEffect(() => {
    if (timeLeft <= 0) lockCurrent()
  })

  const commitTyped = () => {
    const parsed = parseEstimate(text)
    setTypoError(parsed === null && text.trim() !== '')
    if (parsed !== null) update(clamp(parsed))
    setEditing(false)
  }

  const nudge = (delta: number) => {
    const next = Math.min(steps, Math.max(0, pos + delta))
    update(positionToValue(question, next / steps))
  }

  const urgent = fraction <= 0.15
  const warning = fraction <= 0.33
  const timerText = urgent ? 'text-band-red' : warning ? 'text-band-orange' : 'text-text'
  const barColor = urgent ? 'bg-band-red' : warning ? 'bg-band-orange' : 'bg-teal'

  return (
    <section className="anim-rise flex flex-1 flex-col">
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${fraction * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-2">
            Round {roundIndex + 1} of 5
            {multiplier > 1 && (
              <span className="rounded-full bg-teal/15 px-2.5 py-0.5 font-bold text-teal">{multiplier}× points</span>
            )}
          </span>
          <span role="timer" aria-label={`${Math.ceil(timeLeft)} seconds left`} className={`font-display text-base ${timerText}`}>
            {Math.floor(Math.ceil(timeLeft) / 60)}:{String(Math.ceil(timeLeft) % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      <h2 className="mt-4 text-[1.3rem] leading-[1.3] font-semibold text-pretty">{question.prompt}</h2>

      <div className="mt-auto pt-6">
        {editing ? (
          <input
            autoFocus
            inputMode="decimal"
            enterKeyHint="done"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitTyped}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label="Type your answer"
            placeholder={question.type === 'log' ? 'e.g. 2.4m' : 'e.g. 18.5'}
            className="font-display w-full rounded-xl border-2 border-teal bg-panel px-3 py-2 text-[clamp(2rem,11vw,3.5rem)] leading-none text-teal outline-none placeholder:text-muted/50"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setText('')
              setEditing(true)
            }}
            aria-label={`Your answer: ${formatValue(value, question.unit)}. Tap to type an exact number.`}
            className="font-display block text-left text-[clamp(3rem,17vw,5.5rem)] leading-none text-teal"
          >
            {parts.prefix && <span className="align-[0.35em] text-[0.6em]">{parts.prefix}</span>}
            {parts.number}
            {isHugging(parts.suffix) && <span className="text-[0.6em]">{parts.suffix}</span>}
          </button>
        )}
        <div className="mt-2 flex h-6 justify-between gap-3 text-sm text-muted">
          {typoError ? (
            <span className="text-band-orange">That isn't a number. Try "2.4m" or "18.5".</span>
          ) : (
            <>
              <span className="text-base">{isHugging(parts.suffix) ? '' : parts.suffix}</span>
              <span>{editing ? 'k, m and b work' : 'Tap the number to type it'}</span>
            </>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <NudgeButton label="Decrease" onClick={() => nudge(-1)}>−</NudgeButton>
          <input
            type="range"
            className="estimate-slider"
            min={0}
            max={steps}
            step={1}
            value={pos}
            onChange={(e) => update(positionToValue(question, Number(e.target.value) / steps))}
            aria-label="Your answer"
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

        {/* preventDefault keeps the typed input from blurring first, so one tap locks the typed number. */}
        <PrimaryButton className="mt-6" onPointerDown={(e) => e.preventDefault()} onClick={lockCurrent}>
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
