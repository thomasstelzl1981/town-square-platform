/**
 * useWeather Hook — Fetches weather data from Open-Meteo API (free, no API key!)
 */

import { useQuery } from '@tanstack/react-query';

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
    windspeed_10m: number;
    relative_humidity_2m: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

export function useWeather(latitude: number | null, longitude: number | null) {
  return useQuery<WeatherData>({
    queryKey: ['weather', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) {
        throw new Error('No coordinates provided');
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
        `&timezone=Europe/Berlin`
      );

      if (!response.ok) {
        throw new Error('Weather API request failed');
      }

      const data: OpenMeteoResponse = await response.json();

      // Transform to our interface
      return {
        current: {
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weathercode,
          windSpeed: Math.round(data.current.windspeed_10m),
          humidity: data.current.relative_humidity_2m,
        },
        daily: data.daily.time.map((date, index) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weathercode[index],
        })),
      };
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    retry: 2,
  });
}
