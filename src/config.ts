// Single source of truth for branding. Changing APP_NAME updates the UI,
// the share text, the HTML <title>, and the PWA manifest.
export const APP_NAME = 'BizTap'
export const APP_TAGLINE = 'The daily business estimation game'

// Kept separate from APP_NAME on purpose: renaming the app must not wipe
// players' saved games and streaks.
export const STORAGE_PREFIX = 'biztap:v1'

export const THEME_COLOR = '#061416'
