/**
 * THEME TOGGLE — ORBITAL Design System
 * 
 * Sun/Moon icon button for switching between Light and Dark mode.
 * Placed in SystemBar, left side after Home button.
 */

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'h-9 w-9 text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      title={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
    >
      {/* Sun icon - visible in dark mode */}
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      {/* Moon icon - visible in light mode */}
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Theme wechseln</span>
    </Button>
  );
}
