/**
 * R-9: Letter preview card (Step 5) with font selector, PDF, signature
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Type, Eye, Download, Upload, X, Loader2 } from 'lucide-react';
import { LetterPreview, type LetterFont } from '@/components/portal/office/LetterPreview';
import type { SenderOption } from '@/components/shared';
import type { BriefContact, BriefProfile } from './briefTypes';

interface BriefPreviewCardProps {
  selectedSender: SenderOption | undefined;
  selectedSenderId: string | null;
  resolvedLogoUrl: string | null;
  recipient: BriefContact | null;
  subject: string;
  generatedBody: string;
  letterFont: LetterFont;
  setLetterFont: (f: LetterFont) => void;
  profile: BriefProfile | undefined;
  senderCity: string | undefined;
  onPdfPreview: () => void;
  onPdfDownload: () => void;
  onSignatureUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSignature: () => void;
  isUploadingSignature: boolean;
}

export function BriefPreviewCard({
  selectedSender, selectedSenderId, resolvedLogoUrl,
  recipient, subject, generatedBody,
  letterFont, setLetterFont, profile, senderCity,
  onPdfPreview, onPdfDownload,
  onSignatureUpload, onRemoveSignature, isUploadingSignature,
}: BriefPreviewCardProps) {
  const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : undefined;
  const recipientAddress = recipient
    ? [recipient.street, [recipient.postal_code, recipient.city].filter(Boolean).join(' ')].filter(Boolean).join('\n') || undefined
    : undefined;

  return (
    <Card className="glass-card">
      <CardContent className="p-5 space-y-4">
        <Label className="flex items-center gap-2">
          <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
          Brief-Vorschau
        </Label>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">DIN A4 Vorschau</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={letterFont} onValueChange={(v) => setLetterFont(v as LetterFont)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Type className="h-3 w-3 mr-1.5" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="din">D-DIN (System)</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="calibri">Calibri</SelectItem>
                <SelectItem value="times">Times New Roman</SelectItem>
                <SelectItem value="georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onPdfPreview} disabled={!generatedBody}>
              <Eye className="h-3.5 w-3.5" />PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onPdfDownload} disabled={!generatedBody}>
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>

        {/* Signature upload */}
        <div className="flex items-center gap-3 pt-1">
          <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Unterschrift:</Label>
          {profile?.signature_url ? (
            <div className="flex items-center gap-2">
              <img src={profile.signature_url} alt="Unterschrift" className="h-8 max-w-[120px] object-contain border rounded px-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemoveSignature}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={onSignatureUpload} />
              <Button variant="outline" size="sm" className="gap-1.5 pointer-events-none" disabled={isUploadingSignature}>
                {isUploadingSignature ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Bild hochladen
              </Button>
            </label>
          )}
        </div>

        <LetterPreview
          senderName={selectedSender?.label}
          senderCompany={selectedSender?.type === 'BUSINESS' ? selectedSender?.company : undefined}
          senderAddress={selectedSender?.address}
          senderCity={senderCity}
          senderRole={selectedSender?.sublabel !== 'Persönlicher Absender' ? selectedSender?.sublabel : undefined}
          logoUrl={resolvedLogoUrl || undefined}
          recipientName={recipientName}
          recipientCompany={recipient?.company || undefined}
          recipientAddress={recipientAddress}
          subject={subject}
          body={generatedBody}
          font={letterFont}
          signatureUrl={profile?.signature_url || undefined}
        />
      </CardContent>
    </Card>
  );
}
