/**
 * lennoxTheme — Centralized Alpine Chic Design Tokens for Lennox & Friends
 * All Lennox Zone 3 pages import from here. No inline color duplication.
 */

export const LENNOX = {
  /* ─── Core Palette ─── */
  forest:       'hsl(155, 35%, 22%)',
  forestLight:  'hsl(155, 28%, 32%)',
  forestHover:  'hsl(155, 35%, 18%)',

  cream:        'hsl(38, 45%, 96%)',
  warmWhite:    'hsl(40, 40%, 99%)',

  sand:         'hsl(32, 35%, 82%)',
  sandLight:    'hsl(35, 40%, 92%)',

  bark:         'hsl(25, 30%, 18%)',
  barkMuted:    'hsl(25, 15%, 42%)',

  coral:        'hsl(10, 78%, 58%)',
  coralHover:   'hsl(10, 78%, 50%)',

  gold:         'hsl(40, 85%, 50%)',

  white:        '#ffffff',
} as const;

/** Service tag translations */
export const SERVICE_TAG_LABELS: Record<string, string> = {
  boarding: 'Pension',
  daycare: 'Tagesstätte',
  grooming: 'Pflege',
  walking: 'Gassi',
  training: 'Training',
  sitting: 'Sitting',
  veterinary: 'Tierarzt',
  transport: 'Transport',
  nutrition: 'Ernährung',
  other: 'Sonstiges',
};

/** Species labels (German) */
export const SPECIES_LABELS: Record<string, string> = {
  dog: 'Hund',
  cat: 'Katze',
  bird: 'Vogel',
  small_animal: 'Kleintier',
  reptile: 'Reptil',
  other: 'Sonstiges',
};

/** Gender labels (German) */
export const GENDER_LABELS: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  unknown: 'Unbekannt',
};
