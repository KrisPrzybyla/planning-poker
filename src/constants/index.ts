// Application constants
export const TIMEOUTS = {
  VOTE_PROCESSING_DELAY: 500,
  AUTO_REJOIN_DELAY: 2000,
} as const;

export const TOAST_DURATIONS = {
  SHORT: 2000,
  MEDIUM: 3000,
} as const;

export const FIBONACCI_VALUES: readonly string[] = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];

export const CARD_TOOLTIPS = {
  '?': 'I don\'t know - need more information',
  '☕': 'I need a break',
} as const;

export const CARD_DIMENSIONS = {
  WIDTH: '70px',
  HEIGHT: '100px',
} as const;

export const GRID_BREAKPOINTS = {
  CARDS: { base: 2, sm: 3, md: 5 },
  LAYOUT: { base: '1fr', lg: '3fr 1fr' },
} as const;