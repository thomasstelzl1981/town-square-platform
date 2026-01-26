import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface PdfExportOptions {
  /** Document title shown in header */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Module or area identifier for branding */
  module?: string;
  /** Filename without extension */
  filename?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

export interface PdfExportState {
  isExporting: boolean;
  error: string | null;
}

/**
 * Hook for generating PDF exports from page content.
 * Uses browser print with custom styling for clean PDF output.
 */
export function usePdfExport() {
  const [state, setState] = useState<PdfExportState>({
    isExporting: false,
    error: null,
  });

  const exportToPdf = useCallback(async (
    contentRef: React.RefObject<HTMLElement>,
    options: PdfExportOptions
  ) => {
    if (!contentRef.current) {
      setState({ isExporting: false, error: 'Kein Inhalt zum Exportieren gefunden' });
      return;
    }

    setState({ isExporting: true, error: null });

    try {
      const content = contentRef.current;
      const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de });
      const filename = options.filename || `${options.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}`;

      // Create print-friendly window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Popup blockiert. Bitte erlauben Sie Popups für diese Seite.');
      }

      // Build header HTML
      const headerHtml = `
        <div class="pdf-header">
          <div class="pdf-branding">
            <div class="pdf-logo">System of a Town</div>
            ${options.module ? `<div class="pdf-module">${options.module}</div>` : ''}
          </div>
          <div class="pdf-title-block">
            <h1 class="pdf-title">${options.title}</h1>
            ${options.subtitle ? `<p class="pdf-subtitle">${options.subtitle}</p>` : ''}
          </div>
          <div class="pdf-meta">
            <span>Erstellt: ${timestamp}</span>
            ${options.metadata ? Object.entries(options.metadata).map(([k, v]) => `<span>${k}: ${v}</span>`).join('') : ''}
          </div>
        </div>
      `;

      // Build footer HTML
      const footerHtml = `
        <div class="pdf-footer">
          <span>© ${new Date().getFullYear()} System of a Town – Vertraulich</span>
          <span class="pdf-page-number"></span>
        </div>
      `;

      // Clone content and clean it for PDF
      const clonedContent = content.cloneNode(true) as HTMLElement;
      
      // Remove interactive elements that don't make sense in PDF
      clonedContent.querySelectorAll('button:not(.pdf-keep), input, select, .pdf-hide').forEach(el => {
        el.remove();
      });

      // Build complete document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>${options.title}</title>
          <style>
            /* Reset and Base Styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #1a1a1a;
              background: white;
              padding: 0;
            }
            
            /* Print Styles */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              @page {
                margin: 15mm 10mm;
                size: A4;
              }
              
              .pdf-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
              }
              
              .pdf-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
              }
              
              .pdf-content {
                margin-top: 60px;
              }
              
              .no-print {
                display: none !important;
              }
            }
            
            /* PDF Header */
            .pdf-header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            
            .pdf-branding {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            
            .pdf-logo {
              font-size: 14pt;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            
            .pdf-module {
              font-size: 9pt;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .pdf-title-block {
              margin: 12px 0;
            }
            
            .pdf-title {
              font-size: 20pt;
              font-weight: 600;
              color: #0f172a;
              margin: 0;
            }
            
            .pdf-subtitle {
              font-size: 11pt;
              color: #64748b;
              margin-top: 4px;
            }
            
            .pdf-meta {
              display: flex;
              gap: 24px;
              font-size: 9pt;
              color: #94a3b8;
            }
            
            /* PDF Footer */
            .pdf-footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 8px;
              margin-top: 32px;
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              color: #94a3b8;
            }
            
            /* Content Styles */
            .pdf-content {
              padding: 0;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              color: #0f172a;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            
            h1 { font-size: 18pt; }
            h2 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            h3 { font-size: 12pt; }
            h4 { font-size: 11pt; }
            
            p { margin-bottom: 0.75em; }
            
            /* Tables */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 10pt;
            }
            
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: left;
            }
            
            th {
              background: #f8fafc;
              font-weight: 600;
              color: #475569;
            }
            
            tr:nth-child(even) {
              background: #fafafa;
            }
            
            /* Cards */
            .card, [class*="Card"] {
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 16px;
              margin: 12px 0;
              background: white;
            }
            
            /* Badges */
            .badge, [class*="Badge"] {
              display: inline-block;
              padding: 2px 8px;
              font-size: 9pt;
              border-radius: 4px;
              background: #f1f5f9;
              color: #475569;
            }
            
            /* Grid layouts - flatten for print */
            .grid {
              display: block !important;
            }
            
            .grid > * {
              margin-bottom: 16px;
            }
            
            /* Stats/KPIs */
            .stat-value, .text-2xl, .text-3xl, .text-4xl {
              font-size: 18pt;
              font-weight: 700;
              color: #0f172a;
            }
            
            .stat-label, .text-muted-foreground {
              font-size: 9pt;
              color: #64748b;
            }
            
            /* Charts - show placeholder */
            .recharts-wrapper, [class*="Chart"] {
              border: 1px dashed #cbd5e1;
              padding: 32px;
              text-align: center;
              color: #94a3b8;
              font-style: italic;
            }
            
            .recharts-wrapper::after, [class*="Chart"]::after {
              content: "[Diagramm - siehe interaktive Ansicht]";
            }
            
            /* Hide interactive elements */
            button, input, select, textarea, .cursor-pointer {
              display: none !important;
            }
            
            /* Show text alternatives */
            input[type="text"]::before,
            input[type="number"]::before {
              content: attr(value);
              display: block;
            }
            
            /* Page breaks */
            .page-break {
              page-break-before: always;
            }
            
            .avoid-break {
              page-break-inside: avoid;
            }
            
            /* Spacing adjustments */
            .space-y-6 > * + * { margin-top: 16px; }
            .space-y-4 > * + * { margin-top: 12px; }
            .space-y-2 > * + * { margin-top: 6px; }
            .gap-4 { gap: 12px; }
            .gap-2 { gap: 6px; }
            .mb-4, .mb-6, .mb-8 { margin-bottom: 16px; }
            .mt-4, .mt-6, .mt-8 { margin-top: 16px; }
            .p-4, .p-6 { padding: 12px; }
            
            /* Flex layouts */
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="pdf-content">
            ${clonedContent.innerHTML}
          </div>
          ${footerHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
      setState({ isExporting: false, error: null });

    } catch (error: any) {
      setState({ isExporting: false, error: error.message || 'Export fehlgeschlagen' });
    }
  }, []);

  return {
    ...state,
    exportToPdf,
  };
}
