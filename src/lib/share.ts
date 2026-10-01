import { APP_NAME } from '../config'
import { shortDateLabel } from './puzzles'
import { BAND_EMOJI, MAX_TOTAL, bandFor } from './scoring'

// URL printed on the last line of the share text. Set VITE_SITE_URL in
// Vercel to pin a custom domain; otherwise the current origin is used.
export function siteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/**
 * BizTap Oct 1
 * 🟩🟩🟨🟧🟥 677/1200
 * https://example.com
 */
export function buildShareText(date: string, bases: number[], total: number, url: string): string {
  const squares = bases.map((b) => BAND_EMOJI[bandFor(b)]).join('')
  return [`${APP_NAME} ${shortDateLabel(date)}`, `${squares} ${total}/${MAX_TOTAL}`, url]
    .filter(Boolean)
    .join('\n')
}
