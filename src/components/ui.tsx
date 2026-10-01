import type { ButtonHTMLAttributes } from 'react'
import { bandFor } from '../lib/scoring'
import { BAND_BG } from './bandStyles'

export function PrimaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`font-wide h-16 w-full rounded-2xl bg-teal text-lg font-extrabold text-ink transition active:scale-[0.98] active:bg-teal-dim disabled:opacity-40 ${className}`}
    />
  )
}

/** One square per round, colored by band once scored. Mirrors the share text. */
export function BandSquares({
  bases,
  current,
  size = 'sm',
}: {
  bases: number[]
  current?: number
  size?: 'sm' | 'lg'
}) {
  const dim = size === 'lg' ? 'h-11 w-11 rounded-lg' : 'h-4 w-4 rounded-[4px]'
  return (
    <div className={`flex ${size === 'lg' ? 'gap-2.5' : 'gap-1.5'}`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => {
        const base = bases[i]
        if (base !== undefined) {
          return (
            <span
              key={i}
              className={`${dim} ${BAND_BG[bandFor(base)]} anim-pop`}
              style={{ animationDelay: size === 'lg' ? `${i * 90}ms` : undefined }}
            />
          )
        }
        const ring = i === current ? 'border-teal' : 'border-line'
        return <span key={i} className={`${dim} border-2 ${ring}`} />
      })}
    </div>
  )
}
