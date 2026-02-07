/**
 * ArmstrongGreetingCard — Personalized greeting from Armstrong AI assistant
 * Combines time of day, weather, location, and calendar events
 */

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Calendar, ArrowRight } from 'lucide-react';
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
  (name: string) => `Guten Morgen! Schön, dich zu sehen, ${name}.`,
];

const afternoonGreetings = [
  (name: string) => `Guten Tag, ${name}!`,
  (name: string) => `Hallo ${name}, schön dich zu sehen!`,
  (name: string) => `Hi ${name}! Wie läuft dein Tag?`,
];

const eveningGreetings = [
  (name: string) => `Guten Abend, ${name}!`,
  (name: string) => `Guten Abend! Ich hoffe, du hattest einen produktiven Tag, ${name}.`,
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

function getEventSummary(events: CalendarEvent[]): string {
  if (events.length === 0) {
    return 'Du hast heute keine Termine eingetragen. Ein ruhiger Tag, perfekt zum Fokussieren.';
  }
  
  if (events.length === 1) {
    const event = events[0];
    const time = new Date(event.start_at).toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `Du hast heute einen Termin: "${event.title}" um ${time}.`;
  }
  
  return `Wie ich an deinem Terminkalender sehe, hast du heute ${events.length} Termine.`;
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

  // Generate full greeting message
  useEffect(() => {
    const greetingText = getRandomGreeting(displayName);
    
    let locationText = '';
    if (city) {
      locationText = `Du bist heute in ${city}. `;
    }
    
    let weatherText = '';
    if (weather) {
      weatherText = getWeatherTextForGreeting(
        weather.current.weatherCode, 
        weather.current.temperature
      ) + ' ';
    }
    
    const eventText = getEventSummary(todayEvents);
    
    const fullMessage = `${greetingText}\n\n${locationText}${weatherText}\n\n${eventText}\n\nWenn ich dich bei etwas unterstützen kann, sag mir einfach Bescheid!`;
    
    setGreeting(fullMessage);
  }, [displayName, city, weather, todayEvents]);

  // Typing animation effect
  useEffect(() => {
    if (!greeting || isLoading) return;
    
    setDisplayedText('');
    setIsTyping(true);
    
    let index = 0;
    const typingSpeed = 15; // ms per character
    
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
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%, hsl(var(--accent) / 0.05) 100%)'
        }}
      />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start gap-4">
          {/* Armstrong Avatar */}
          <div className="flex-shrink-0">
            <div 
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-primary to-primary/70",
                "shadow-lg shadow-primary/20"
              )}
            >
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-foreground">Armstrong</span>
              <span className="text-xs text-muted-foreground">KI-Assistent</span>
            </div>
            
            <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />
              )}
            </div>

            {/* Today's Events Preview */}
            {!isTyping && todayEvents.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Heutige Termine</span>
                </div>
                <div className="space-y-1.5">
                  {todayEvents.slice(0, 3).map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {new Date(event.start_at).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  {todayEvents.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-3">
                      +{todayEvents.length - 3} weitere Termine
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            {!isTyping && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenChat}
                  className="gap-2"
                >
                  Mit Armstrong chatten
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
