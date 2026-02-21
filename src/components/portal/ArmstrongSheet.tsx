import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useLocation, useParams } from 'react-router-dom';

interface ArmstrongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Module path mapping for MVP modules
 */
const MODULE_PATH_MAP: Record<string, string> = {
  'dashboard': 'MOD-00',
  'immobilien': 'MOD-04',
  'properties': 'MOD-04',
  'finanzierung': 'MOD-07',
  'finance': 'MOD-07',
  'investment': 'MOD-08',
  'investments': 'MOD-08',
  'mandate': 'MOD-08',
};

/**
 * Entity type mapping from path segments
 */
const ENTITY_TYPE_MAP: Record<string, string> = {
  'immobilien': 'property',
  'properties': 'property',
  'einheiten': 'unit',
  'units': 'unit',
  'mandate': 'mandate',
  'anfragen': 'finance_request',
  'requests': 'finance_request',
};

export function ArmstrongSheet({ open, onOpenChange }: ArmstrongSheetProps) {
  const location = useLocation();
  const params = useParams();
  
  // Derive context from current route with proper module mapping
  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // Determine module from path
    const moduleSegment = segments[1]?.toLowerCase() || 'dashboard';
    const moduleCode = MODULE_PATH_MAP[moduleSegment] || 'MOD-00';
    
    // Determine entity from path
    let entityType: string | undefined;
    let entityId: string | undefined;
    
    // Check for UUID in path (entity detail page)
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    for (let i = 0; i < segments.length; i++) {
      if (uuidPattern.test(segments[i])) {
        entityId = segments[i];
        // Get entity type from preceding segment
        const typeSegment = segments[i - 1]?.toLowerCase();
        entityType = ENTITY_TYPE_MAP[typeSegment] || typeSegment;
        break;
      }
    }
    
    // Also check route params
    if (!entityId && params.id) {
      entityId = params.id;
      entityType = ENTITY_TYPE_MAP[moduleSegment] || 'unknown';
    }
    
    return {
      zone: 'Z2',
      module: moduleCode,
      entity: entityId ? `${entityType}:${entityId}` : undefined,
    };
  };

  // Desktop: render compact floating widget (no Sheet)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  if (isDesktop) {
    if (!open) return null;
    return (
      <ChatPanel
        context={getContext()}
        position="compact"
        onClose={() => onOpenChange(false)}
      />
    );
  }

  // Mobile: bottom-sheet with reduced height
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[50vh] max-h-[50vh] rounded-t-xl p-0"
      >
        <ChatPanel
          context={getContext()}
          position="bottomsheet"
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
