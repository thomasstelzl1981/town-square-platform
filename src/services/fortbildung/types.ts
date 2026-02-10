/**
 * MOD-15 Fortbildung — Shared types for providers & UI
 */

export type FortbildungTab = 'books' | 'trainings' | 'talks' | 'courses';
export type FortbildungTopic = 'immobilien' | 'finanzen' | 'erfolg' | 'persoenlichkeit';
export type FortbildungProvider = 'amazon' | 'udemy' | 'eventbrite' | 'youtube' | 'impact';

export interface FortbildungItem {
  id: string;
  tab: FortbildungTab;
  topic: FortbildungTopic;
  provider: FortbildungProvider;
  title: string;
  author_or_channel: string | null;
  image_url: string | null;
  description: string | null;
  price_text: string | null;
  rating_text: string | null;
  duration_text: string | null;
  affiliate_link: string;
  external_id: string | null;
  sort_order: number;
}

export interface SearchResult {
  items: FortbildungItem[];
  apiAvailable: boolean;
}

export const TOPIC_LABELS: Record<FortbildungTopic, string> = {
  immobilien: 'Immobilien',
  finanzen: 'Finanzen',
  erfolg: 'Erfolg',
  persoenlichkeit: 'Persönlichkeit',
};

export const TAB_CONFIG: Record<FortbildungTab, {
  label: string;
  path: string;
  provider: FortbildungProvider;
  searchPlaceholder: string;
}> = {
  books: {
    label: 'Bücher',
    path: 'buecher',
    provider: 'amazon',
    searchPlaceholder: 'Bücher suchen…',
  },
  trainings: {
    label: 'Fortbildungen',
    path: 'fortbildungen',
    provider: 'udemy',
    searchPlaceholder: 'Fortbildungen suchen…',
  },
  talks: {
    label: 'Vorträge',
    path: 'vortraege',
    provider: 'eventbrite',
    searchPlaceholder: 'Vorträge & Events suchen…',
  },
  courses: {
    label: 'Kurse',
    path: 'kurse',
    provider: 'youtube',
    searchPlaceholder: 'Video-Kurse suchen…',
  },
};

export const TOPICS: FortbildungTopic[] = ['immobilien', 'finanzen', 'erfolg', 'persoenlichkeit'];
