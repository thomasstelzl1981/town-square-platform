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

  // Build compact sender line for above envelope window
  const senderLineParts = [senderCompany, senderName, senderAddress?.replace(/\n/g, ', ')].filter(Boolean);
  const senderLine = senderLineParts.length > 0 ? senderLineParts.join(' · ') : 'Absender';

  return (
    <div
      className="bg-white rounded-sm shadow-lg border border-border/30 overflow-hidden relative"
      style={{ aspectRatio: '210 / 297', fontFamily }}
    >
      {/* A4 page with DIN 5008 zones — all sizing relative to the container */}
      <div className="h-full w-full relative" style={{ fontSize: '0.55cqw' }}>

        {/* ── LOGO — top-right, max ~20% of page width, 25mm zone ── */}
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

        {/* ── CONTENT AREA — 20mm margins simulated ── */}
        <div
          className="absolute flex flex-col"
          style={{ top: '6.7%', left: '9.5%', right: '9.5%', bottom: '6.7%' }}
        >

          {/* Spacer for logo zone (~25mm) */}
          <div style={{ height: '8.4%', flexShrink: 0 }} />

          {/* ── SENDER LINE (small, above envelope window) ── */}
          <div
            className="border-b border-gray-300 text-gray-400 truncate"
            style={{ fontSize: '1.4em', paddingBottom: '0.6em', marginBottom: '0.4em', marginTop: '2em' }}
          >
            {senderLine}
          </div>

          {/* ── RECIPIENT WINDOW (DIN 5008 Fensterzone: 85×45mm) ── */}
          <div style={{ minHeight: '15.2%', marginBottom: '1.5em' }}>
            {recipientName ? (
              <div className="text-gray-800" style={{ fontSize: '2em', lineHeight: '1.6' }}>
                {recipientCompany && <div>{recipientCompany}</div>}
                <div>{recipientName}</div>
                {recipientAddress && (
                  <div className="whitespace-pre-line">{recipientAddress}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-300 italic" style={{ fontSize: '2em' }}>
                Empfänger...
              </div>
            )}
          </div>

          {/* ── DATE — right-aligned ── */}
          <div
            className="text-right text-gray-500"
            style={{ fontSize: '1.8em', marginBottom: '2em' }}
          >
            {displayDate}
          </div>

          {/* ── SUBJECT — bold, no "Betreff:" prefix ── */}
          {subject ? (
            <div
              className="font-bold text-gray-900"
              style={{ fontSize: '2.2em', marginBottom: '2em' }}
            >
              {subject}
            </div>
          ) : (
            <div
              className="text-gray-300 italic"
              style={{ fontSize: '2.2em', marginBottom: '2em' }}
            >
              Betreff...
            </div>
          )}

          {/* ── BODY (Anrede + Fließtext + Grußformel + Signatur) ── */}
          <div className="flex-1 overflow-hidden">
            {body ? (
              <div
                className="whitespace-pre-wrap text-gray-800"
                style={{ fontSize: '1.8em', lineHeight: '1.6' }}
              >
                {body}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full text-gray-300"
                style={{ fontSize: '1.8em' }}
              >
                Ihr Brief erscheint hier...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
