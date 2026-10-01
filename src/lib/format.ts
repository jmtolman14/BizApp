import type { QuestionType } from './scoring'

export interface SliderQuestion {
  type: QuestionType
  min: number
  max: number
  step?: number
}

/** Resolution of the log slider; positions run 0..LOG_STEPS. */
export const LOG_STEPS = 1000

function roundSig(value: number, digits: number): number {
  if (value === 0) return 0
  const magnitude = Math.floor(Math.log10(Math.abs(value)))
  const factor = 10 ** (digits - 1 - magnitude)
  return Math.round(value * factor) / factor
}

function niceStep(range: number): number {
  const rough = range / 200
  const pow = 10 ** Math.floor(Math.log10(rough))
  const n = rough / pow
  const nice = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10
  return nice * pow
}

export function linearStep(q: SliderQuestion): number {
  return q.step ?? niceStep(q.max - q.min)
}

/** Snap a log-scale value so the number shown is exactly the number scored. */
export function snapLog(value: number): number {
  const v = roundSig(value, 3)
  return v >= 1 ? Math.round(v) : v
}

/** Number of discrete slider positions (the range input runs 0..sliderSteps). */
export function sliderSteps(q: SliderQuestion): number {
  return q.type === 'log' ? LOG_STEPS : Math.round((q.max - q.min) / linearStep(q))
}

/** Slider position (0..1) → guess value. */
export function positionToValue(q: SliderQuestion, t: number): number {
  const p = Math.min(1, Math.max(0, t))
  if (q.type === 'log') {
    return snapLog(q.min * (q.max / q.min) ** p)
  }
  const step = linearStep(q)
  const raw = q.min + p * (q.max - q.min)
  const snapped = Math.round((raw - q.min) / step) * step + q.min
  return Number(Math.min(q.max, Math.max(q.min, snapped)).toFixed(6))
}

/** Guess value → slider position (0..1). Used for the reveal scale bar. */
export function valueToPosition(q: SliderQuestion, value: number): number {
  const p =
    q.type === 'log'
      ? Math.log(value / q.min) / Math.log(q.max / q.min)
      : (value - q.min) / (q.max - q.min)
  return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0
}

/** Default slider position: the middle of the scale (geometric middle for log). */
export function startValue(q: SliderQuestion): number {
  return positionToValue(q, 0.5)
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumSignificantDigits: 3 })
const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function formatNumber(value: number, unit: string): string {
  const abs = Math.abs(value)
  if (unit === '$' && abs < 1000 && !Number.isInteger(value)) return value.toFixed(2)
  if (abs >= 10_000) return compact.format(value)
  return plain.format(value)
}

/** "$1.65B", "21%", "13 people". Units: "$" is a prefix, "%" hugs, anything else trails. */
export function formatValue(value: number, unit: string): string {
  const n = formatNumber(value, unit)
  if (unit === '$') return `$${n}`
  if (unit === '%') return `${n}%`
  if (!unit) return n
  return `${n} ${unit}`
}

/** Split for the big hero display: { prefix, number, suffix }. */
export function formatParts(value: number, unit: string): { prefix: string; number: string; suffix: string } {
  const number = formatNumber(value, unit)
  if (unit === '$') return { prefix: '$', number, suffix: '' }
  if (unit === '%') return { prefix: '', number, suffix: '%' }
  return { prefix: '', number, suffix: unit }
}

/** Keep "$" and "%" but drop word units, for tight scale labels. */
export function shortUnit(unit: string): string {
  return unit === '$' || unit === '%' ? unit : ''
}
