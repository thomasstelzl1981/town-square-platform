import { useMemo, useRef, useEffect, useState } from 'react';
import defaultLetterheadLogo from '@/assets/logos/armstrong_logo_light.jpg';
import { formatDateLong } from '@/lib/formatters';

export type LetterFont = 'din' | 'arial' | 'calibri' | 'times' | 'georgia';

const FONT_STACKS: Record<LetterFont, string> = {
  din: "'D-DIN', 'DIN', ui-sans-serif, system-ui, sans-serif",
  arial: "Arial, Helvetica, sans-serif",
  calibri: "Calibri, 'Segoe UI', Tahoma, sans-serif",
  times: "'Times New Roman', Times, serif",
  georgia: "Georgia, 'Palatino Linotype', serif",
};

// A4 page proportions at 420px width: 420 x 594px
const PAGE_WIDTH = 420;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * (297 / 210)); // 594px

interface LetterPreviewProps {
  senderName?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderCity?: string;
  senderRole?: string;
  logoUrl?: string | null;
  recipientName?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  subject?: string;
  body?: string;
  date?: string;
  font?: LetterFont;
}

export function LetterPreview({
  senderName,
  senderCompany,
  senderAddress,
  senderCity,
  senderRole,
  logoUrl,
  recipientName,
  recipientCompany,
  recipientAddress,
  subject,
  body,
  date,
  font = 'din',
}: LetterPreviewProps) {
  const displayDate = formatDateLong(date ? new Date(date) : new Date(), senderCity);
  const logo = logoUrl || defaultLetterheadLogo;
  const fontFamily = FONT_STACKS[font];

  const senderLineParts = [senderCompany, senderName, senderAddress?.replace(/\n/g, ', ')].filter(Boolean);
  const senderLine = senderLineParts.length > 0 ? senderLineParts.join(' · ') : 'Absender';

  // Split body into lines for pagination
  const bodyLines = useMemo(() => {
    if (!body) return [];
    return body.split('\n');
  }, [body]);

  // Measure content and paginate
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      // Usable content area per page: page height minus top/bottom margins (~6.7% each = ~40px each)
      const usableHeight = PAGE_HEIGHT - 80; // ~514px
      const pages = Math.max(1, Math.ceil(contentHeight / usableHeight));
      setPageCount(pages);
    }
  }, [body, subject, recipientName, recipientAddress, recipientCompany, senderLine]);

  // Header block (sender line, recipient, date, subject) — only on page 1
  const headerBlock = (
    <>
      {/* Spacer for logo zone */}
      <div style={{ height: '50px', flexShrink: 0 }} />

      {/* Sender line */}
      <div
        className="border-b border-gray-300 text-gray-400 truncate"
        style={{ fontSize: '0.6em', paddingBottom: '3px', marginBottom: '2px', marginTop: '8px' }}
      >
        {senderLine}
      </div>

      {/* Recipient window */}
      <div style={{ minHeight: '90px', marginBottom: '6px' }}>
        {recipientName ? (
          <div className="text-gray-800" style={{ fontSize: '1em', lineHeight: '1.55' }}>
            {recipientCompany && <div>{recipientCompany}</div>}
            <div>{recipientName}</div>
            {recipientAddress && (
              <div className="whitespace-pre-line">{recipientAddress}</div>
            )}
          </div>
        ) : (
          <div className="text-gray-300 italic" style={{ fontSize: '1em' }}>
            Empfänger...
          </div>
        )}
      </div>

      {/* Date */}
      <div
        className="text-right text-gray-500"
        style={{ fontSize: '1em', marginBottom: '10px' }}
      >
        {displayDate}
      </div>

      {/* Subject */}
      {subject ? (
        <div
          className="font-bold text-gray-900"
          style={{ fontSize: '1.08em', marginBottom: '10px' }}
        >
          {subject}
        </div>
      ) : (
        <div
          className="text-gray-300 italic"
          style={{ fontSize: '1.08em', marginBottom: '10px' }}
        >
          Betreff...
        </div>
      )}
    </>
  );

  // For single-page or measuring: render everything in one flow
  // We use a hidden measurer to calculate page count, then render visible pages
  return (
    <div className="flex flex-col items-center gap-4" style={{ width: '100%', maxWidth: `${PAGE_WIDTH}px`, margin: '0 auto' }}>
      {/* Hidden measurer */}
      <div
        style={{
          position: 'absolute',
          visibility: 'hidden',
          width: `${PAGE_WIDTH}px`,
          fontFamily,
          fontSize: '8.5px',
          pointerEvents: 'none',
        }}
      >
        <div ref={contentRef} style={{ padding: '40px 40px 40px 50px' }}>
          {headerBlock}
          <div className="whitespace-pre-wrap text-gray-800" style={{ fontSize: '1em', lineHeight: '1.6' }}>
            {body || ''}
          </div>
        </div>
      </div>

      {/* Visible pages */}
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white rounded-sm shadow-lg border border-border/30 relative"
          style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
            fontFamily,
            fontSize: '8.5px',
            overflow: 'hidden',
          }}
        >
          {/* Logo — top-right, only on page 1 */}
          {pageIndex === 0 && (
            <div
              className="absolute flex items-start justify-end"
              style={{ top: '6.7%', right: '9.5%', width: '20%', height: '8.4%' }}
            >
              <img
                src={logo}
                alt="Briefkopf-Logo"
                className="max-h-full w-auto object-contain"
              />
            </div>
          )}

          {/* Content area */}
          <div
            className="absolute flex flex-col"
            style={{
              top: pageIndex === 0 ? '6.7%' : '6.7%',
              left: '11.9%',
              right: '9.5%',
              bottom: '6.7%',
              overflow: 'hidden',
            }}
          >
            {pageIndex === 0 ? (
              <>
                {headerBlock}
                {/* Body — first page, fills remaining space */}
                <div className="flex-1 overflow-hidden">
                  {body ? (
                    <div
                      className="whitespace-pre-wrap text-gray-800"
                      style={{ fontSize: '1em', lineHeight: '1.6' }}
                    >
                      {body}
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center h-full text-gray-300"
                      style={{ fontSize: '1em' }}
                    >
                      Ihr Brief erscheint hier...
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Continuation pages: offset body text */
              <div className="flex-1 overflow-hidden">
                <div
                  className="whitespace-pre-wrap text-gray-800"
                  style={{
                    fontSize: '1em',
                    lineHeight: '1.6',
                    // Offset the text upward to show the continuation
                    marginTop: `-${pageIndex * (PAGE_HEIGHT - 80)}px`,
                  }}
                >
                  {/* Re-render header as invisible spacer + full body */}
                  <div style={{ visibility: 'hidden' }}>
                    <div style={{ height: '220px' }} /> {/* Approximate header height */}
                  </div>
                  {body}
                </div>
              </div>
            )}
          </div>

          {/* Page number for multi-page */}
          {pageCount > 1 && (
            <div
              className="absolute text-gray-400 text-center"
              style={{ bottom: '2%', left: '0', right: '0', fontSize: '0.7em' }}
            >
              Seite {pageIndex + 1} von {pageCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
