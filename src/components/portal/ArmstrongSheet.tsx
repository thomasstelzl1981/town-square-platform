import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useLocation } from 'react-router-dom';

interface ArmstrongSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArmstrongSheet({ open, onOpenChange }: ArmstrongSheetProps) {
  const location = useLocation();
  
  // Derive context from current route
  const getContext = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    return {
      zone: 'Portal',
      module: segments[1] ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1) : 'Dashboard',
      entity: segments[2] || undefined,
    };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] max-h-[80vh] rounded-t-xl p-0"
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
