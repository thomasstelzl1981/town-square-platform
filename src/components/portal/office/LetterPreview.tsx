import defaultLetterheadLogo from '@/assets/logos/armstrong_logo_light.jpg';
import { formatDate } from '@/lib/formatters';
import { FileText } from 'lucide-react';

interface LetterPreviewProps {
  senderName?: string;
  senderCompany?: string;
  senderAddress?: string;
  logoUrl?: string | null;
  recipientName?: string;
  recipientCompany?: string;
  subject?: string;
  body?: string;
  date?: string;
}

export function LetterPreview({
  senderName,
  senderCompany,
  senderAddress,
  logoUrl,
  recipientName,
  recipientCompany,
  subject,
  body,
  date,
}: LetterPreviewProps) {
  const displayDate = date || formatDate(new Date());
  const hasContent = !!(body || subject || recipientName);
  const logo = logoUrl || defaultLetterheadLogo;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-border/50 overflow-hidden" style={{ aspectRatio: '210 / 297' }}>
      <div className="h-full flex flex-col p-5 text-[10px] leading-relaxed text-gray-800 font-serif">
        {/* Letterhead */}
        <div className="flex items-start justify-between mb-4">
          <img
            src={logo}
            alt="Briefkopf-Logo"
            className="h-8 w-auto object-contain"
          />
          <div className="text-right text-[8px] text-gray-500">
            {senderCompany && <div className="font-semibold text-gray-700">{senderCompany}</div>}
            {senderAddress && (
              <div className="whitespace-pre-line">{senderAddress}</div>
            )}
          </div>
        </div>

        {/* Sender line (small) */}
        <div className="text-[7px] text-gray-400 border-b border-gray-200 pb-1 mb-3">
          {[senderCompany, senderName, senderAddress?.replace(/\n/g, ', ')].filter(Boolean).join(' · ') || 'Absender'}
        </div>

        {/* Recipient */}
        <div className="mb-4 min-h-[40px]">
          {recipientName ? (
            <>
              {recipientCompany && <div>{recipientCompany}</div>}
              <div>{recipientName}</div>
            </>
          ) : (
            <div className="text-gray-300 italic">Empfänger...</div>
          )}
        </div>

        {/* Date */}
        <div className="text-right text-[9px] text-gray-500 mb-3">
          {displayDate}
        </div>

        {/* Subject */}
        {subject ? (
          <div className="font-bold text-[11px] mb-3">{subject}</div>
        ) : (
          <div className="text-gray-300 italic mb-3">Betreff...</div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {body ? (
            <div className="whitespace-pre-wrap text-[9px] leading-[1.6]">{body}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <FileText className="h-8 w-8 mb-2" />
              <span className="text-[9px]">Ihr Brief erscheint hier...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
