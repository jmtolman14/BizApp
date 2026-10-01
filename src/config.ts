// Single source of truth for branding. Changing APP_NAME updates the UI,
// the share text, the HTML <title>, and the PWA manifest.
export const APP_NAME = 'BizTap'
export const APP_TAGLINE = 'Daily case interview math'

// Kept separate from APP_NAME on purpose: renaming the app must not wipe
// players' saved games and streaks.
export const STORAGE_PREFIX = 'biztap:v2'

export const THEME_COLOR = '#061416'
