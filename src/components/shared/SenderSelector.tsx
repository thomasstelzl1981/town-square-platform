import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Check, Plus } from 'lucide-react';

export interface SenderOption {
  id: string;
  type: 'PRIVATE' | 'BUSINESS';
  label: string;
  sublabel: string;
  address?: string;
  company?: string;
}

interface SenderSelectorProps {
  options: SenderOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  onAddContext?: () => void;
  className?: string;
}

export function SenderSelector({ 
  options, 
  selected, 
  onSelect,
  onAddContext,
  className 
}: SenderSelectorProps) {
  if (options.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Keine Absender-Kontexte verfügbar
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-start p-4 rounded-lg border-2 transition-all min-w-[180px] text-left",
            selected === option.id 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/50"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            {option.type === 'PRIVATE' ? (
              <User className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium text-sm">{option.label}</span>
          </div>
          <span className="text-xs text-muted-foreground">{option.sublabel}</span>
          {selected === option.id && (
            <Badge className="mt-2" variant="default">
              <Check className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          )}
        </button>
      ))}
      
      {onAddContext && (
        <button
          type="button"
          onClick={onAddContext}
          className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-muted hover:border-primary/50 transition-all min-w-[140px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-5 w-5 mb-1" />
          <span className="text-xs">Kontext anlegen</span>
        </button>
      )}
    </div>
  );
}
