/**
 * APP LOGO - Theme-aware logo container
 * 
 * Automatically switches between light/dark logo variants
 * based on current theme. Supports different size presets.
 */

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// Logo imports - PNG with transparency
import logoLight from '@/assets/logos/armstrong_logo_light.png';
import logoDark from '@/assets/logos/armstrong_logo_dark.png';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AppLogo({ size = 'sm', className }: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  
  const logo = resolvedTheme === 'dark' ? logoDark : logoLight;
  
  const sizeClasses = {
    sm: 'h-8',    // SystemBar (larger)
    md: 'h-10',   // Login page
    lg: 'h-16',   // Landing page
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={logo} 
        alt="Armstrong - System of a Town" 
        className={cn(sizeClasses[size], "w-auto object-contain")}
      />
    </div>
  );
}
