/**
 * PropertyDetailHeader — Back button, demo badge, armstrong, delete, split-view toggle
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, LayoutList, LayoutPanelLeft } from 'lucide-react';
import { ArmstrongAskButton } from '@/components/shared/ArmstrongAskButton';

interface PropertyDetailHeaderProps {
  property: { address: string; city: string; property_type: string; purchase_price: number | null };
  propertyId?: string;
  isDemo: boolean;
  splitView: boolean;
  onSplitViewChange: (v: boolean) => void;
  onDelete: () => void;
}

export function PropertyDetailHeader({ property, propertyId, isDemo, splitView, onSplitViewChange, onDelete }: PropertyDetailHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="sm" asChild className="no-print">
        <Link to="/portal/immobilien/portfolio">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground flex-1">Zurück zur Übersicht</span>

      {isDemo && (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">DEMO</Badge>
      )}

      <ArmstrongAskButton
        prompt={`Analysiere die Immobilie "${property.address}, ${property.city}" (Typ: ${property.property_type}, Kaufpreis: ${property.purchase_price || 'unbekannt'})`}
        entityType="property"
        entityId={propertyId}
        variant="icon"
        className="no-print"
      />

      {!isDemo && (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive no-print" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <div className="hidden lg:flex items-center gap-1 border rounded-md p-0.5 bg-muted/30 no-print">
        <Button variant={splitView ? 'ghost' : 'secondary'} size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => onSplitViewChange(false)}>
          <LayoutList className="h-3 w-3" /> Standard
        </Button>
        <Button variant={splitView ? 'secondary' : 'ghost'} size="sm" className="h-6 text-xs px-2 gap-1" onClick={() => onSplitViewChange(true)}>
          <LayoutPanelLeft className="h-3 w-3" /> Split-View
        </Button>
      </div>
    </div>
  );
}
