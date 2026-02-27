/**
 * ArmstrongGreetingCard — Compact square greeting from Armstrong AI assistant
 * Updated for Widget System: aspect-square, no avatar icon
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Sparkles } from 'lucide-react';
import { usePortalLayout } from '@/hooks/usePortalLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { getWeatherTextForGreeting } from '@/lib/weatherCodes';
import { cn } from '@/lib/utils';
import type { WeatherData } from '@/hooks/useWeather';
import type { CalendarEvent } from '@/hooks/useTodayEvents';

interface ArmstrongGreetingCardProps {
  displayName: string;
  city: string;
  weather: WeatherData | null;
  todayEvents: CalendarEvent[];
  isLoading?: boolean;
}

// Greeting variations for variety
const morningGreetings = [
  (name: string) => `Guten Morgen, ${name}!`,
  (name: string) => `Einen wunderschönen Morgen, ${name}!`,
];

const afternoonGreetings = [
  (name: string) => `Guten Tag, ${name}!`,
  (name: string) => `Hallo ${name}!`,
];

const eveningGreetings = [
  (name: string) => `Guten Abend, ${name}!`,
  (name: string) => `Schönen Abend, ${name}!`,
];

function getRandomGreeting(name: string): string {
  const hour = new Date().getHours();
  const formattedName = name ? `Mr. ${name}` : 'Freund';
  
  let greetings;
  if (hour < 12) {
    greetings = morningGreetings;
  } else if (hour < 18) {
    greetings = afternoonGreetings;
  } else {
    greetings = eveningGreetings;
  }
  
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex](formattedName);
}

function getShortEventSummary(events: CalendarEvent[]): string {
  if (events.length === 0) {
    return 'Keine Termine heute.';
  }
  if (events.length === 1) {
    return `1 Termin heute.`;
  }
  return `${events.length} Termine heute.`;
}

function getKiBriefing(events: CalendarEvent[]): string {
  const hour = new Date().getHours();
  const tips: string[] = [];
  
  if (hour < 10) {
    tips.push('📊 Ich habe deine Dashboards aktualisiert.');
  }
  if (events.length > 3) {
    tips.push(`⚡ Voller Tag! ${events.length} Termine — soll ich priorisieren?`);
  }
  
  tips.push('🤖 Frag mich nach Marktdaten, Dokumentanalysen oder Renditeberechnungen.');
  
  return tips.join(' ');
}

export function ArmstrongGreetingCard({ 
  displayName, 
  city, 
  weather, 
  todayEvents,
  isLoading 
}: ArmstrongGreetingCardProps) {
  const { showArmstrong } = usePortalLayout();
  const isMobile = useIsMobile();
  const [greeting, setGreeting] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Generate compact greeting message
  useEffect(() => {
    const greetingText = getRandomGreeting(displayName);
    
    const contextParts: string[] = [];
    
    if (city) {
      contextParts.push(`Du bist in ${city}.`);
    }
    
    if (weather) {
      contextParts.push(getWeatherTextForGreeting(
        weather.current.weatherCode, 
        weather.current.temperature
      ));
    }
    
    contextParts.push(getShortEventSummary(todayEvents));
    
    // On mobile, skip "Wie kann ich helfen?" since input bar is always visible
    const kiBriefing = getKiBriefing(todayEvents);
    const fullMessage = isMobile
      ? `${greetingText}\n\n${contextParts.join(' ')}\n\n${kiBriefing}`
      : `${greetingText}\n\n${contextParts.join(' ')}\n\n${kiBriefing}\n\nWie kann ich dir heute helfen?`;
    
    setGreeting(fullMessage);
  }, [displayName, city, weather, todayEvents, isMobile]);

  // Typing animation effect
  useEffect(() => {
    if (!greeting || isLoading) return;
    
    setDisplayedText('');
    setIsTyping(true);
    
    let index = 0;
    const typingSpeed = 12; // Faster typing for compact card
    
    const typeInterval = setInterval(() => {
      if (index < greeting.length) {
        setDisplayedText(greeting.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, typingSpeed);
    
    return () => clearInterval(typeInterval);
  }, [greeting, isLoading]);

  const handleOpenChat = () => {
    showArmstrong({ expanded: true, resetPosition: true });
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-primary/20 h-[260px] md:h-auto md:aspect-square">
        <CardContent className="p-4 h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-semibold text-base text-foreground">Armstrong</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-muted/50 rounded animate-pulse w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="glass-card border-primary/20 h-[260px] md:h-auto md:aspect-square relative overflow-hidden cursor-pointer transition-all hover:border-primary/40 hover:shadow-lg"
      onClick={handleOpenChat}
    >
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)'
        }}
      />
      
      <CardContent className="p-4 relative z-10 h-full flex flex-col">
        {/* Header - No avatar, just text */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-base text-foreground">Armstrong</span>
        </div>

        {/* Message Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed line-clamp-6">
            {displayedText}
            {isTyping && (
              <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse" />
            )}
          </div>
        </div>

        {/* Events Preview as Chips - horizontal */}
        {!isTyping && todayEvents.length > 0 && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            {todayEvents.slice(0, 2).map((event) => (
              <div 
                key={event.id}
                className="flex items-center gap-1.5 text-xs bg-muted/40 rounded-full px-2 py-1 flex-shrink-0"
              >
                <span className="truncate max-w-[80px]">{event.title}</span>
              </div>
            ))}
            {todayEvents.length > 2 && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                +{todayEvents.length - 2}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
