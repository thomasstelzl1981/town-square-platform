/**
 * EmailDraftsSection — E-Mail-Entwürfe pro Bank
 * Extracted from FMEinreichung.tsx (R-1)
 */
import { Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { SelectedBank } from './fmEinreichungTypes';

interface EmailDraftsSectionProps {
  selectedBanks: SelectedBank[];
  emailSubject: string;
  getEmailDraft: (bankKey: string) => string;
  setEmailDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateBankEmail: (bankId: string, email: string) => void;
  generateEmailBody: () => string;
  handleSendEmail: (bank: SelectedBank) => Promise<void>;
  handleSendAll: () => Promise<void>;
  sendEmailPending: boolean;
}

export function EmailDraftsSection({
  selectedBanks, emailSubject, getEmailDraft, setEmailDrafts,
  updateBankEmail, generateEmailBody, handleSendEmail, handleSendAll, sendEmailPending,
}: EmailDraftsSectionProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">E-Mail-Entwürfe</span>
        {selectedBanks.length > 0 && (
          <Badge variant="outline" className="text-[10px] ml-auto">{selectedBanks.length} Empfänger</Badge>
        )}
      </div>

      {selectedBanks.length === 0 ? (
        <div className="border rounded-md overflow-hidden opacity-70">
          <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
            <span className="font-semibold text-sm text-muted-foreground">[Bank auswählen]</span>
            <Badge variant="outline" className="text-[10px]">Vorschau</Badge>
          </div>
          <div className="p-3 space-y-2 text-xs">
            <div><span className="text-muted-foreground">An:</span> <span className="text-muted-foreground italic">wird nach Bankauswahl befüllt</span></div>
            <div><span className="text-muted-foreground">Betreff:</span> {emailSubject}</div>
            <Textarea
              value={generateEmailBody()}
              readOnly
              className="text-xs min-h-[180px] mt-2 bg-muted/10"
            />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">📎 Finanzierungsakte.pdf</Badge>
              <Badge variant="secondary" className="text-[10px]">📎 Datenraum-Link</Badge>
            </div>
          </div>
        </div>
      ) : (
        <>
          {selectedBanks.map(bank => (
            <div key={bank.id} className="border rounded-md overflow-hidden">
              <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{bank.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {bank.source === 'kontaktbuch' ? 'Kontaktbuch' : bank.source === 'ki' ? 'KI' : 'Manuell'}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-[10px]">Entwurf</Badge>
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">An:</span>
                  <Input
                    value={bank.email}
                    onChange={(e) => updateBankEmail(bank.id, e.target.value)}
                    placeholder="E-Mail-Adresse eingeben…"
                    type="email"
                    className="h-7 text-xs flex-1"
                  />
                </div>
                <div><span className="text-muted-foreground">Betreff:</span> {emailSubject}</div>
                <Textarea
                  value={getEmailDraft(bank.id)}
                  onChange={(e) => setEmailDrafts(prev => ({ ...prev, [bank.id]: e.target.value }))}
                  className="text-xs min-h-[180px] mt-2"
                />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">📎 Finanzierungsakte.pdf</Badge>
                  <Badge variant="secondary" className="text-[10px]">📎 Datenraum-Link</Badge>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendEmail(bank)} disabled={sendEmailPending || !bank.email}>
                    <Send className="h-3 w-3 mr-1" /> Senden
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSendAll} disabled={sendEmailPending} className="text-xs">
              <Send className="h-3.5 w-3.5 mr-1" /> Alle senden ({selectedBanks.length})
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
