/**
 * Status Badge for Project Units
 * MOD-13 PROJEKTE
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UnitStatus } from '@/types/projekte';

interface Props {
  status: UnitStatus;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<UnitStatus, { 
  label: string; 
  className: string;
  dotColor: string;
}> = {
  available: { 
    label: 'Frei', 
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    dotColor: 'bg-green-500',
  },
  reserved: { 
    label: 'Reserviert', 
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
  },
  sold: { 
    label: 'Verkauft', 
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    dotColor: 'bg-blue-500',
  },
  blocked: { 
    label: 'Gesperrt', 
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    dotColor: 'bg-gray-500',
  },
};

export const UnitStatusBadge = memo(function UnitStatusBadge({ status, size = 'default', showIcon = true }: Props) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === 'sm' && 'text-xs px-1.5 py-0'
      )}
    >
      {showIcon && (
        <span className={cn('w-2 h-2 rounded-full mr-1.5', config.dotColor)} />
      )}
      {config.label}
    </Badge>
  );
});

export const UnitStatusDot = memo(function UnitStatusDot({ status, size = 'default' }: { status: UnitStatus; size?: 'sm' | 'default' }) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span 
      className={cn(
        'rounded-full',
        config.dotColor,
        size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
      )}
      title={config.label}
    />
  );
});
