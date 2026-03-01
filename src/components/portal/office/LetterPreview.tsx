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

// A4 page proportions at 700px width: 700 x 990px
const PAGE_WIDTH = 700;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * (297 / 210)); // 990px

// Margins in px (proportional to A4 mm margins)
const TOP_MARGIN = Math.round(PAGE_HEIGHT * 0.067);
const BOTTOM_MARGIN = Math.round(PAGE_HEIGHT * 0.067);
const LEFT_MARGIN = Math.round(PAGE_WIDTH * 0.119);
const RIGHT_MARGIN = Math.round(PAGE_WIDTH * 0.095);
const USABLE_HEIGHT = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;

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
  signatureUrl?: string | null;
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
  signatureUrl,
}: LetterPreviewProps) {
  const displayDate = formatDateLong(date ? new Date(date) : new Date(), senderCity);
  const logo = logoUrl || defaultLetterheadLogo;
  const fontFamily = FONT_STACKS[font];

  const senderLineParts = [senderCompany, senderName, senderAddress?.replace(/\n/g, ', ')].filter(Boolean);
  const senderLine = senderLineParts.length > 0 ? senderLineParts.join(' · ') : 'Absender';

  // Measure header + body to calculate proper page breaks
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyLineHeights, setBodyLineHeights] = useState<number[]>([]);

  // Body split into paragraphs/lines for per-line pagination
  const bodyParagraphs = useMemo(() => {
    if (!body) return [];
    return body.split('\n');
  }, [body]);

  // Measure after render
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.scrollHeight);
    }
    if (bodyRef.current) {
      const children = bodyRef.current.children;
      const heights: number[] = [];
      for (let i = 0; i < children.length; i++) {
        heights.push((children[i] as HTMLElement).offsetHeight);
      }
      setBodyLineHeights(heights);
    }
  }, [body, subject, recipientName, recipientAddress, recipientCompany, senderLine, font]);

  // Calculate which lines go on which page
  const pages = useMemo(() => {
    if (bodyParagraphs.length === 0) return [[]] as number[][];

    const result: number[][] = [];
    let currentPage: number[] = [];
    let remainingHeight = USABLE_HEIGHT - headerHeight;
    
    for (let i = 0; i < bodyParagraphs.length; i++) {
      const lineH = bodyLineHeights[i] || 20;
      if (remainingHeight < lineH && currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [];
        remainingHeight = USABLE_HEIGHT;
      }
      currentPage.push(i);
      remainingHeight -= lineH;
    }
    if (currentPage.length > 0 || result.length === 0) {
      result.push(currentPage);
    }
    return result;
  }, [bodyParagraphs, headerHeight, bodyLineHeights]);

  // Signature block rendered after body on the last page
  const signatureBlock = signatureUrl ? (
    <div style={{ marginTop: '24px' }}>
      <img
        src={signatureUrl}
        alt="Unterschrift"
        style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain' }}
      />
    </div>
  ) : null;

  // Header block (sender line, recipient, date, subject) — only on page 1
  const headerBlock = (
    <>
      {/* Spacer for logo zone */}
      <div style={{ height: '84px', flexShrink: 0 }} />

      {/* Sender line */}
      <div
        className="border-b border-gray-300 text-gray-400 truncate"
        style={{ fontSize: '0.6em', paddingBottom: '4px', marginBottom: '3px', marginTop: '12px' }}
      >
        {senderLine}
      </div>

      {/* Recipient window */}
      <div style={{ minHeight: '150px', marginBottom: '10px' }}>
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
        style={{ fontSize: '1em', marginBottom: '16px' }}
      >
        {displayDate}
      </div>

      {/* Subject */}
      {subject ? (
        <div
          className="font-bold text-gray-900"
          style={{ fontSize: '1em', marginBottom: '16px' }}
        >
          {subject}
        </div>
      ) : (
        <div
          className="text-gray-300 italic"
          style={{ fontSize: '1em', marginBottom: '16px' }}
        >
          Betreff...
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col items-center gap-4" style={{ width: '100%', maxWidth: `${PAGE_WIDTH}px`, margin: '0 auto' }}>
      {/* Hidden measurer for header */}
      <div
        style={{
          position: 'absolute',
          visibility: 'hidden',
          width: `${PAGE_WIDTH}px`,
          fontFamily,
          fontSize: '12.3px',
          pointerEvents: 'none',
        }}
      >
        <div ref={headerRef} style={{ padding: `0 ${RIGHT_MARGIN}px 0 ${LEFT_MARGIN}px` }}>
          {headerBlock}
        </div>
        {/* Hidden measurer for body lines */}
        <div ref={bodyRef} style={{ padding: `0 ${RIGHT_MARGIN}px 0 ${LEFT_MARGIN}px` }}>
          {bodyParagraphs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap text-gray-800" style={{ fontSize: '1em', lineHeight: '1.6', minHeight: '1px' }}>
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>

      {/* Visible pages */}
      {pages.map((pageLineIndices, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white rounded-sm shadow-lg border border-border/30 relative"
          style={{
            width: `${PAGE_WIDTH}px`,
            height: `${PAGE_HEIGHT}px`,
            fontFamily,
            fontSize: '12.3px',
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
              top: `${TOP_MARGIN}px`,
              left: `${LEFT_MARGIN}px`,
              right: `${RIGHT_MARGIN}px`,
              bottom: `${BOTTOM_MARGIN}px`,
              overflow: 'hidden',
            }}
          >
            {pageIndex === 0 && headerBlock}

            {/* Body lines for this page */}
            {pageLineIndices.length > 0 ? (
              <div className="flex-1 overflow-hidden">
                {pageLineIndices.map((lineIdx) => (
                  <div
                    key={lineIdx}
                    className="whitespace-pre-wrap text-gray-800"
                    style={{ fontSize: '1em', lineHeight: '1.6' }}
                  >
                    {bodyParagraphs[lineIdx] || '\u00A0'}
                  </div>
                ))}
                {/* Signature on last page after last body line */}
                {pageIndex === pages.length - 1 && signatureBlock}
              </div>
            ) : !body ? (
              <div
                className="flex flex-col items-center justify-center flex-1 text-gray-300"
                style={{ fontSize: '1em' }}
              >
                Ihr Brief erscheint hier...
              </div>
            ) : null}
          </div>

          {/* Page number for multi-page */}
          {pages.length > 1 && (
            <div
              className="absolute text-gray-400 text-center"
              style={{ bottom: '2%', left: '0', right: '0', fontSize: '0.7em' }}
            >
              Seite {pageIndex + 1} von {pages.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
