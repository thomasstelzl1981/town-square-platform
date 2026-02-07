/**
 * PortalDashboard — Redesigned with immersive welcome experience
 * 
 * Layout:
 * +--------------------------------+--------------------------------+
 * |     🌍 EARTH GLOBE             |    ☀️ WEATHER WIDGET           |
 * +--------------------------------+--------------------------------+
 * |     🤖 ARMSTRONG GREETING (full width)                          |
 * +-----------------------------------------------------------------+
 */

import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeather } from '@/hooks/useWeather';
import { useTodayEvents } from '@/hooks/useTodayEvents';
import { EarthGlobeCard } from '@/components/dashboard/EarthGlobeCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { ArmstrongGreetingCard } from '@/components/dashboard/ArmstrongGreetingCard';

export default function PortalDashboard() {
  const { profile, isDevelopmentMode } = useAuth();
  const { location, loading: locationLoading } = useGeolocation();
  const { data: weather, isLoading: weatherLoading } = useWeather(
    location?.latitude ?? null,
    location?.longitude ?? null
  );
  const { data: todayEvents = [], isLoading: eventsLoading } = useTodayEvents();

  const isLoading = locationLoading || weatherLoading || eventsLoading;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Development Mode Indicator */}
      {isDevelopmentMode && (
        <p className="text-xs text-status-warn mb-4">
          Entwicklungsmodus aktiv
        </p>
      )}

      {/* All three cards in one row on desktop, only Armstrong on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Google Earth 3D Globe Card - hidden on mobile */}
        <div className="hidden md:block">
          <EarthGlobeCard
            latitude={location?.latitude ?? null}
            longitude={location?.longitude ?? null}
            city={location?.city}
          />
        </div>

        {/* Weather Widget - hidden on mobile */}
        <div className="hidden md:block">
          <WeatherCard
            latitude={location?.latitude ?? null}
            longitude={location?.longitude ?? null}
            city={location?.city}
          />
        </div>

        {/* Armstrong Greeting - always visible */}
        <ArmstrongGreetingCard
          displayName={profile?.display_name || ''}
          city={location?.city || ''}
          weather={weather ?? null}
          todayEvents={todayEvents}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
