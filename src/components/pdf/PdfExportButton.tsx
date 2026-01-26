import { useRef, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { usePdfExport, PdfExportOptions } from './usePdfExport';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PdfExportButtonProps {
  /** Reference to the content element to export */
  contentRef: RefObject<HTMLElement>;
  /** Export options */
  options: PdfExportOptions;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional class names */
  className?: string;
  /** Show label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
}

/**
 * PDF Export button component.
 * Place at the bottom of any page/section to enable PDF export.
 */
export function PdfExportButton({
  contentRef,
  options,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
  label = 'Als PDF exportieren',
}: PdfExportButtonProps) {
  const { isExporting, error, exportToPdf } = usePdfExport();

  const handleExport = async () => {
    await exportToPdf(contentRef, options);
    if (!error) {
      toast.success('PDF wird erstellt', {
        description: 'Das Druckfenster öffnet sich in Kürze.',
      });
    } else {
      toast.error('Export fehlgeschlagen', {
        description: error,
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={cn('gap-2 pdf-hide', className)}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {showLabel && <span>{label}</span>}
    </Button>
  );
}

/**
 * PDF Export footer bar component.
 * A styled bar with export button that sits at the bottom of a page.
 */
export function PdfExportFooter({
  contentRef,
  options,
  className,
}: {
  contentRef: RefObject<HTMLElement>;
  options: PdfExportOptions;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center justify-end gap-4 pt-6 mt-6 border-t pdf-hide',
      className
    )}>
      <span className="text-sm text-muted-foreground">
        Diese Ansicht als PDF speichern
      </span>
      <PdfExportButton
        contentRef={contentRef}
        options={options}
        variant="default"
      />
    </div>
  );
}

/**
 * Hook helper to create a content ref for PDF export.
 * Use this when you want to wrap page content.
 */
export function usePdfContentRef() {
  return useRef<HTMLDivElement>(null);
}

export default PdfExportButton;
