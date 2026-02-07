/**
 * ArmstrongGreetingCard — Compact horizontal greeting from Armstrong AI assistant
 * Optimized for 1/3 grid layout with avatar left, text center
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Calendar, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortalLayout } from '@/hooks/usePortalLayout';
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
  const formattedName = name ? `Mr. ${name.split(' ')[0]}` : 'Freund';
  
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

export function ArmstrongGreetingCard({ 
  displayName, 
  city, 
  weather, 
  todayEvents,
  isLoading 
}: ArmstrongGreetingCardProps) {
  const { showArmstrong } = usePortalLayout();
  const [greeting, setGreeting] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Generate compact greeting message
  useEffect(() => {
    const greetingText = getRandomGreeting(displayName);
    
    let contextParts: string[] = [];
    
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
    
    const fullMessage = `${greetingText}\n\n${contextParts.join(' ')}\n\nWie kann ich dir heute helfen?`;
    
    setGreeting(fullMessage);
  }, [displayName, city, weather, todayEvents]);

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
      <Card className="glass-card border-primary/20 h-full">
        <CardContent className="p-4 h-full flex items-center">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 relative overflow-hidden h-full">
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)'
        }}
      />
      
      <CardContent className="p-4 relative z-10 h-full flex flex-col">
        <div className="flex items-start gap-3 flex-1">
          {/* Armstrong Avatar - smaller */}
          <div className="flex-shrink-0">
            <div 
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-primary to-primary/70",
                "shadow-lg shadow-primary/20"
              )}
            >
              <Rocket className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">Armstrong</span>
              <span className="text-[10px] text-muted-foreground">KI</span>
            </div>
            
            <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Events Preview as Chips - horizontal */}
        {!isTyping && todayEvents.length > 0 && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            {todayEvents.slice(0, 2).map((event) => (
              <div 
                key={event.id}
                className="flex items-center gap-1.5 text-[10px] bg-muted/40 rounded-full px-2 py-1 flex-shrink-0"
              >
                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="font-mono text-muted-foreground">
                  {new Date(event.start_at).toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span className="truncate max-w-[80px]">{event.title}</span>
              </div>
            ))}
            {todayEvents.length > 2 && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                +{todayEvents.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        {!isTyping && (
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenChat}
              className="gap-1.5 h-7 text-xs w-full md:w-auto"
            >
              Chat öffnen
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
