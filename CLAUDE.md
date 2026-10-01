# BizTap

Daily case-interview math game (inspired by MapTap). Every number needed is in the question, so
skill at consulting case math (margins, breakeven, market sizing, CAGR, LTV, payback, multiples, IRR) is what
wins. A per-round timer with a speed bonus keeps calculator use from flattening the skill gap. Mobile-first PWA, no backend.
Stack: Vite + React + TypeScript + Tailwind v4 + vite-plugin-pwa. Deploys to Vercel. Tests: Vitest.

## Commands
- `npm run dev`: dev server
- `npm test`: Vitest (scoring, puzzle data validation, dates, streaks, share text)
- `npm run build`: typecheck + production build (generates the service worker)
- `npm run icons`: regenerate PNG icons/favicon from `public/logo.svg`

## Game rules (do not change without being asked)
- One puzzle per local calendar day (YYYY-MM-DD), the same for everyone, from `src/data/puzzles.json`.
- No scheduled puzzle, or one with any `answer: null`, triggers a deterministic fallback: FNV hash of the date
  string modulo the pool of complete puzzles (`puzzleForDate` in `src/lib/puzzles.ts`).
- 5 rounds, multipliers 1x 1x 2x 2x 4x, 100 base points each: 1000 for accuracy.
- Timer per round: `ROUND_SECONDS` = 30/45/60/75/90 (a question's optional `seconds` overrides). The clock starts when
  the question appears and uses wall-clock `roundStartedAt`, so a refresh or a trip to the calculator app doesn't pause it.
  At zero, the current slider/typed value locks in.
- Speed bonus: `round(roundPoints × 0.2 × timeLeftFraction)`. It scales with accuracy, so a fast wild guess earns ~0.
  The max is 1200 (`MAX_TOTAL`). The user chose to keep the 10x log formula rather than tighten scoring.
- Answers can be dragged on the slider or typed (tap the big number). `parseEstimate` accepts 2.4m / $2,450 / 18.9% / 8x.
- Every question is a slider estimate. `log` questions use a log slider (big numbers), and `linear` questions use a linear one.
- Scoring (`src/lib/scoring.ts`, pure, keep it free of DOM and storage):
  - log: `100 * max(0, 1 - |ln(guess/answer)| / ln(10))`, so 10x off scores 0. A guess ≤ 0 scores 0.
  - linear: `100 * max(0, 1 - |guess - answer| / (max - min))`
  - Round to an integer, then multiply by the round multiplier.
- Bands use the base score: 🟩 80+, 🟨 60–79, 🟧 30–59, 🟥 under 30.
- Share text: `BizTap Oct 1` / `🟩🟩🟨🟧🟥 977/1200` / site URL. Squares use base accuracy only. It uses `navigator.share`, then falls back to the clipboard.

## Architecture
- `src/config.ts`: `APP_NAME` (single constant, also injected into the HTML title and PWA manifest by
  vite.config.ts), `STORAGE_PREFIX` (kept separate so a rename doesn't wipe saves), `THEME_COLOR`.
- `src/lib/format.ts`: slider position ↔ value mapping, number/unit formatting. Log guesses snap to 3
  significant figures, so the displayed number is the scored number.
- `src/lib/storage.ts`: localStorage, with every access in try/catch. There is one `DayState` per date with `guesses`,
  frozen `bases`/`bonuses`, `times`, `seen` (reveals dismissed), `roundStartedAt` and `draft`. Bump
  `STORAGE_PREFIX` (currently v2) when the DayState shape changes. Stats hold the current/best streak. Streak logic is pure (`applyCompletion`, `liveStreak`).
- `src/lib/share.ts`: share text and `siteUrl()` (`VITE_SITE_URL` env var, otherwise the current origin).
- `src/components/`: `Game` (state machine: intro → round → reveal → … → results), `Round`, `Reveal`,
  `Results`, `ShareButton`, plus `ui.tsx` (button, band squares), `bandStyles.ts`, `useCountUp.ts`.
- Screen derivation in Game: `seen < bases.length` shows the reveal, `bases.length < 5` shows a round, otherwise results.
  A finished day can never be replayed for a new score.

## Puzzle data rules (`src/data/puzzles.json`)
- Each question has: `id, prompt, unit ("$" | "%" | word), type ("log" | "linear"), min, max, answer, explanation, source`.
  `step` is optional for linear sliders (e.g. 0.01 for prices).
- Case-math style: every input number is stated in the prompt, and the answer is computed exactly from them.
  No outside facts are needed. Compute answers in code, never by hand. `source` holds `Case math: <the formula>`,
  shown on the reveal as "The math: …". `explanation` gives the answer plus the shortcut a pro would use.
- Difficulty ramps: round 1 is a one-step %, rounds 2–3 are breakeven/sizing chains, round 5 is multi-step
  (market sizing, NPV, IRR, price/volume trade-offs). Include classic traps (margin vs markup, −20% then +20%).
- If a question needs a real-world fact you aren't sure of, set `answer: null` with a TODO in `source`. Never invent
  numbers. A puzzle with a null answer is skipped (fallback is served).
- Log questions need `min > 0`, and the answer must sit inside [min, max]. Tests enforce this, and they check that every answer
  is reachable within 1% on the slider.
- Keep log ranges at 3 or more orders of magnitude so the default (middle) position doesn't give the answer away.

## Design
Dark teal-black (`ink #061416`), bold teal accent (`#19e3c4`), and Archivo variable (self-hosted via
@fontsource, so it works offline). Big numbers use `font-display` (125% width, black weight, tabular figures). The header's five
squares fill with band colors as you play, mirroring the share text. iPhone layout: `app-shell` utility applies
safe-area insets, 100dvh, and no horizontal scroll. Respect `prefers-reduced-motion`.
