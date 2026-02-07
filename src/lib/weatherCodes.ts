/**
 * WMO Weather Codes Mapping (Open-Meteo Standard)
 * Maps weather codes to icons and German descriptions
 */

import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  Snowflake,
  type LucideIcon
} from 'lucide-react';

export interface WeatherInfo {
  icon: LucideIcon;
  description: string;
  shortDescription: string;
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
export const weatherCodes: Record<number, WeatherInfo> = {
  // Clear
  0: { icon: Sun, description: 'Klarer Himmel', shortDescription: 'Klar' },
  
  // Mainly clear, partly cloudy, and overcast
  1: { icon: Sun, description: 'Überwiegend klar', shortDescription: 'Klar' },
  2: { icon: CloudSun, description: 'Teilweise bewölkt', shortDescription: 'Bewölkt' },
  3: { icon: Cloud, description: 'Bedeckt', shortDescription: 'Bedeckt' },
  
  // Fog and depositing rime fog
  45: { icon: CloudFog, description: 'Nebel', shortDescription: 'Nebel' },
  48: { icon: CloudFog, description: 'Nebel mit Reifablagerung', shortDescription: 'Nebel' },
  
  // Drizzle: Light, moderate, and dense intensity
  51: { icon: CloudDrizzle, description: 'Leichter Nieselregen', shortDescription: 'Niesel' },
  53: { icon: CloudDrizzle, description: 'Mäßiger Nieselregen', shortDescription: 'Niesel' },
  55: { icon: CloudDrizzle, description: 'Starker Nieselregen', shortDescription: 'Niesel' },
  
  // Freezing Drizzle: Light and dense intensity
  56: { icon: CloudDrizzle, description: 'Leichter gefrierender Nieselregen', shortDescription: 'Glätte' },
  57: { icon: CloudDrizzle, description: 'Starker gefrierender Nieselregen', shortDescription: 'Glätte' },
  
  // Rain: Slight, moderate and heavy intensity
  61: { icon: CloudRain, description: 'Leichter Regen', shortDescription: 'Regen' },
  63: { icon: CloudRain, description: 'Mäßiger Regen', shortDescription: 'Regen' },
  65: { icon: CloudRain, description: 'Starker Regen', shortDescription: 'Regen' },
  
  // Freezing Rain: Light and heavy intensity
  66: { icon: CloudRain, description: 'Leichter gefrierender Regen', shortDescription: 'Glätte' },
  67: { icon: CloudRain, description: 'Starker gefrierender Regen', shortDescription: 'Glätte' },
  
  // Snow fall: Slight, moderate, and heavy intensity
  71: { icon: CloudSnow, description: 'Leichter Schneefall', shortDescription: 'Schnee' },
  73: { icon: CloudSnow, description: 'Mäßiger Schneefall', shortDescription: 'Schnee' },
  75: { icon: CloudSnow, description: 'Starker Schneefall', shortDescription: 'Schnee' },
  
  // Snow grains
  77: { icon: Snowflake, description: 'Schneegriesel', shortDescription: 'Schnee' },
  
  // Rain showers: Slight, moderate, and violent
  80: { icon: CloudRain, description: 'Leichte Regenschauer', shortDescription: 'Schauer' },
  81: { icon: CloudRain, description: 'Mäßige Regenschauer', shortDescription: 'Schauer' },
  82: { icon: CloudRain, description: 'Starke Regenschauer', shortDescription: 'Schauer' },
  
  // Snow showers slight and heavy
  85: { icon: CloudSnow, description: 'Leichte Schneeschauer', shortDescription: 'Schnee' },
  86: { icon: CloudSnow, description: 'Starke Schneeschauer', shortDescription: 'Schnee' },
  
  // Thunderstorm: Slight or moderate, with hail
  95: { icon: CloudLightning, description: 'Gewitter', shortDescription: 'Gewitter' },
  96: { icon: CloudLightning, description: 'Gewitter mit leichtem Hagel', shortDescription: 'Gewitter' },
  99: { icon: CloudLightning, description: 'Gewitter mit starkem Hagel', shortDescription: 'Gewitter' },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return weatherCodes[code] || { icon: Cloud, description: 'Unbekannt', shortDescription: 'Wetter' };
}

export function getWeatherEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌧️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export function getWeatherTextForGreeting(code: number, temperature: number): string {
  const emoji = getWeatherEmoji(code);
  const info = getWeatherInfo(code);
  
  // Generate natural language weather description
  if (code === 0 || code === 1) {
    if (temperature >= 25) return `Das Wetter wird heute herrlich ${emoji} — ${temperature}°C, perfekt für draußen!`;
    if (temperature >= 15) return `Das Wetter wird heute schön ${emoji} — ${temperature}°C, angenehm warm.`;
    return `Das Wetter ist heute klar ${emoji} — ${temperature}°C.`;
  }
  
  if (code === 2 || code === 3) {
    return `Heute ist es ${info.shortDescription.toLowerCase()} ${emoji} bei ${temperature}°C.`;
  }
  
  if (code >= 45 && code <= 48) {
    return `Vorsicht, heute ist es neblig ${emoji} bei ${temperature}°C.`;
  }
  
  if (code >= 51 && code <= 67) {
    return `Heute wird es regnerisch ${emoji} — ${temperature}°C. Regenschirm nicht vergessen!`;
  }
  
  if (code >= 71 && code <= 86) {
    return `Heute gibt es Schnee ${emoji} bei ${temperature}°C. Warm anziehen!`;
  }
  
  if (code >= 95) {
    return `Achtung, heute sind Gewitter möglich ${emoji} bei ${temperature}°C.`;
  }
  
  return `Das Wetter heute: ${info.description} ${emoji} bei ${temperature}°C.`;
}
