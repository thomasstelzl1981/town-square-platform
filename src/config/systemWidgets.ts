/**
 * System Widgets Registry — Zentrale Konfiguration aller Systemwidgets
 * 
 * Diese Widgets werden im MOD-00 Dashboard angezeigt und können über
 * KI-Office → Widgets → Systemwidgets aktiviert/deaktiviert werden.
 */

export interface SystemWidgetDefinition {
  code: string;
  name_de: string;
  description_de: string;
  icon: string;
  gradient: string;
  data_source: string;
  cache_interval_min: number;
  cost_model: 'free' | 'metered';
  status: 'live' | 'stub';
  has_autoplay: boolean;
  privacy_note?: string;
  default_enabled: boolean;
}

export const SYSTEM_WIDGETS: SystemWidgetDefinition[] = [
  {
    code: 'SYS.GLOBE.EARTH',
    name_de: 'Google Earth',
    description_de: '3D-Globus mit Ihrem aktuellen Standort. Zeigt Ihre Position auf einer interaktiven Weltkarte.',
    icon: 'Globe',
    gradient: 'from-green-500/10 to-green-600/5',
    data_source: 'Google Maps 3D API',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Nutzt Ihren Standort (Browser-Geolocation)',
    default_enabled: true,
  },
  {
    code: 'SYS.WEATHER.SUMMARY',
    name_de: 'Wetter',
    description_de: 'Aktuelle Wetterdaten für Ihren Standort inkl. Temperatur, Windgeschwindigkeit und Vorhersage.',
    icon: 'Cloud',
    gradient: 'from-blue-500/10 to-blue-600/5',
    data_source: 'Open-Meteo API',
    cache_interval_min: 30,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Nutzt Ihren Standort für lokale Wetterdaten',
    default_enabled: true,
  },
  {
    code: 'SYS.FIN.MARKETS',
    name_de: 'Finanzüberblick',
    description_de: 'Kompakte Übersicht zu Aktienindizes, Währungskursen und Kryptowährungen.',
    icon: 'TrendingUp',
    gradient: 'from-amber-500/10 to-amber-600/5',
    data_source: 'Finnhub API (geplant)',
    cache_interval_min: 30,
    cost_model: 'free',
    status: 'stub',
    has_autoplay: false,
    privacy_note: 'Keine personenbezogenen Daten erforderlich',
    default_enabled: false,
  },
  {
    code: 'SYS.NEWS.BRIEFING',
    name_de: 'News Briefing',
    description_de: 'Aktuelle Wirtschafts- und Immobilien-Headlines aus seriösen Quellen.',
    icon: 'Newspaper',
    gradient: 'from-purple-500/10 to-purple-600/5',
    data_source: 'RSS Feeds / NewsAPI',
    cache_interval_min: 60,
    cost_model: 'free',
    status: 'stub',
    has_autoplay: false,
    privacy_note: 'Keine personenbezogenen Daten erforderlich',
    default_enabled: false,
  },
  {
    code: 'SYS.SPACE.DAILY',
    name_de: 'Space Update',
    description_de: 'Tägliches Astronomiebild oder ISS-Position — echte Raumfahrt-Facts.',
    icon: 'Rocket',
    gradient: 'from-indigo-500/10 to-indigo-600/5',
    data_source: 'NASA APOD',
    cache_interval_min: 1440, // 24h for APOD
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Keine personenbezogenen Daten erforderlich',
    default_enabled: false,
  },
  {
    code: 'SYS.MINDSET.QUOTE',
    name_de: 'Zitat des Tages',
    description_de: 'Inspirierende Zitate für Fokus und Motivation.',
    icon: 'Quote',
    gradient: 'from-pink-500/10 to-rose-600/5',
    data_source: 'ZenQuotes API',
    cache_interval_min: 1440, // 24h
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Keine personenbezogenen Daten erforderlich',
    default_enabled: false,
  },
  {
    code: 'SYS.AUDIO.RADIO',
    name_de: 'Radio',
    description_de: 'Internet-Radio mit verschiedenen Genres. Kein Autoplay — nur auf Klick.',
    icon: 'Radio',
    gradient: 'from-cyan-500/10 to-teal-600/5',
    data_source: 'Radio Browser API',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Stream-URLs werden bei Wiedergabe geladen',
    default_enabled: false,
  },
];

// Helper to get widget by code
export function getSystemWidget(code: string): SystemWidgetDefinition | undefined {
  return SYSTEM_WIDGETS.find(w => w.code === code);
}

// Get all default-enabled widget codes
export function getDefaultEnabledWidgets(): string[] {
  return SYSTEM_WIDGETS.filter(w => w.default_enabled).map(w => w.code);
}

// Map legacy widget IDs to new codes
export const LEGACY_TO_NEW_CODE: Record<string, string> = {
  'system_globe': 'SYS.GLOBE.EARTH',
  'system_weather': 'SYS.WEATHER.SUMMARY',
  'system_armstrong': 'SYS.ARMSTRONG.GREETING', // Armstrong greeting is separate, not in this list
};

export const NEW_CODE_TO_LEGACY: Record<string, string> = {
  'SYS.GLOBE.EARTH': 'system_globe',
  'SYS.WEATHER.SUMMARY': 'system_weather',
};
