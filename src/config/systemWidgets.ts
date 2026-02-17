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
    data_source: 'CoinGecko + ECB (kostenlos)',
    cache_interval_min: 30,
    cost_model: 'free',
    status: 'live',
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
    data_source: 'Tagesschau RSS (kostenlos)',
    cache_interval_min: 60,
    cost_model: 'free',
    status: 'live',
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
  {
    code: 'SYS.BRAND.KAUFY',
    name_de: 'Kaufy',
    description_de: 'Marktplatz für Immobilienkauf, -verkauf und Kapitalanlage.',
    icon: 'ShoppingBag',
    gradient: 'from-blue-500/10 to-violet-600/5',
    data_source: 'Statischer Link',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    default_enabled: true,
  },
  {
    code: 'SYS.BRAND.FUTUREROOM',
    name_de: 'FutureRoom',
    description_de: 'KI-gestützte Finanzierungsorchestrierung und digitale Bankeinreichung.',
    icon: 'Landmark',
    gradient: 'from-teal-500/10 to-emerald-600/5',
    data_source: 'Statischer Link',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    default_enabled: true,
  },
  {
    code: 'SYS.BRAND.SOT',
    name_de: 'System of a Town',
    description_de: 'Immobilienverwaltung, KI-Office und operative Steuerung.',
    icon: 'Building2',
    gradient: 'from-neutral-500/10 to-neutral-600/5',
    data_source: 'Statischer Link',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    default_enabled: true,
  },
  {
    code: 'SYS.BRAND.ACQUIARY',
    name_de: 'Acquiary',
    description_de: 'Immobilien-Sourcing, Analyse und strategische Akquisition.',
    icon: 'Search',
    gradient: 'from-sky-500/10 to-blue-600/5',
    data_source: 'Statischer Link',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    default_enabled: true,
  },
  {
    code: 'SYS.PV.LIVE',
    name_de: 'PV Live',
    description_de: 'Echtzeit-Monitoring Ihrer Photovoltaik-Anlagen mit Live-Leistung und Tagesertrag.',
    icon: 'Sun',
    gradient: 'from-yellow-500/10 to-orange-600/5',
    data_source: 'PV Demo / SMA / Solar-Log',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Zeigt PV-Anlagendaten aus Ihrem Konto',
    default_enabled: false,
  },
  {
    code: 'SYS.FIN.ACCOUNTS',
    name_de: 'Konten',
    description_de: 'Finanzübersicht mit Vermögen, Verbindlichkeiten und Nettovermögen aus der Finanzanalyse.',
    icon: 'Wallet',
    gradient: 'from-primary/10 to-primary/5',
    data_source: 'Finanzanalyse Engine',
    cache_interval_min: 0,
    cost_model: 'free',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Zeigt aggregierte Finanzdaten aus Ihrem Konto',
    default_enabled: true,
  },
  {
    code: 'SYS.MEET.RECORDER',
    name_de: 'Meeting Recorder',
    description_de: 'Physische Besprechungen live transkribieren und automatisch zusammenfassen lassen.',
    icon: 'Mic',
    gradient: 'from-red-500/10 to-orange-600/5',
    data_source: 'ElevenLabs STT + Lovable AI',
    cache_interval_min: 0,
    cost_model: 'metered',
    status: 'live',
    has_autoplay: false,
    privacy_note: 'Nutzt Ihr Mikrofon. Es wird kein Audio gespeichert, nur Text.',
    default_enabled: true,
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
