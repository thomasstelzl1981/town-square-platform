import { cn } from '@/lib/utils';

export type ModuleStatus = 'inactive' | 'pending' | 'active';

interface StatusIndicatorProps {
  label: string;
  status: ModuleStatus;
  className?: string;
}

const STATUS_CONFIG: Record<ModuleStatus, { color: string; text: string }> = {
  inactive: { color: 'bg-muted-foreground/40', text: 'Nicht aktiv' },
  pending: { color: 'bg-amber-500', text: 'Beantragt' },
  active: { color: 'bg-green-500', text: 'Aktiv' },
};

export function StatusIndicator({ label, status, className }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
      <span className="text-sm">
        {label}: <span className="font-medium">{config.text}</span>
      </span>
    </div>
  );
}
