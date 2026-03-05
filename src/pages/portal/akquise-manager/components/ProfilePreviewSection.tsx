import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { AcqProfilePreview } from '@/components/akquise/AcqProfilePreview';
import type { ExtractedProfile } from './types';

interface Props {
  previewData: ExtractedProfile | null;
  previewTextLong: string;
  clientName: string;
  onGeneratePdf: () => void;
  logoUrl?: string;
  companyName?: string;
  // Consent
  profileGenerated: boolean;
  mandateCreated: boolean;
  mandateCode: string;
  acqConsentData: boolean;
  setAcqConsentData: (v: boolean) => void;
  acqConsentResearch: boolean;
  setAcqConsentResearch: (v: boolean) => void;
  acqConsentDsgvo: boolean;
  setAcqConsentDsgvo: (v: boolean) => void;
  onCreateMandate: () => void;
  isCreating: boolean;
}

export function ProfilePreviewSection({
  previewData, previewTextLong, clientName, onGeneratePdf,
  profileGenerated, mandateCreated, mandateCode,
  acqConsentData, setAcqConsentData,
  acqConsentResearch, setAcqConsentResearch,
  acqConsentDsgvo, setAcqConsentDsgvo,
  onCreateMandate, isCreating,
}: Props) {
  const allConsents = acqConsentData && acqConsentResearch && acqConsentDsgvo;

  return (
    <>
      {/* CI-Vorschau */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              CI-Vorschau — Ankaufsprofil
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onGeneratePdf} disabled={!previewData}>
                <Download className="h-4 w-4 mr-2" />
                PDF exportieren
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} disabled={!previewData}>
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AcqProfilePreview
            clientName={clientName}
            profileData={previewData}
            profileTextLong={previewTextLong}
          />
        </CardContent>
      </Card>

      {/* Consent + Mandat erstellen */}
      {profileGenerated && !mandateCreated && (
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Einwilligung & Mandatserteilung</h3>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-data" checked={acqConsentData} onCheckedChange={(v) => setAcqConsentData(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-data" className="text-xs leading-relaxed cursor-pointer">
                  Ich bestätige die Richtigkeit der eingegebenen Daten und des Ankaufsprofils.
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-research" checked={acqConsentResearch} onCheckedChange={(v) => setAcqConsentResearch(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-research" className="text-xs leading-relaxed cursor-pointer">
                  Ich genehmige die automatisierte Kontaktrecherche und Datenverarbeitung im Rahmen dieses Mandats.
                </Label>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox id="acq-consent-dsgvo" checked={acqConsentDsgvo} onCheckedChange={(v) => setAcqConsentDsgvo(v === true)} className="mt-0.5" />
                <Label htmlFor="acq-consent-dsgvo" className="text-xs leading-relaxed cursor-pointer">
                  Ich stimme der Verarbeitung personenbezogener Daten gemäß DSGVO zu.
                </Label>
              </div>
            </div>
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={onCreateMandate} disabled={isCreating || !clientName.trim() || !allConsents}>
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Ankaufsprofil anlegen — Mandat erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mandateCreated && (
        <div className="flex items-center gap-2 justify-center">
          <Badge variant="default" className="text-sm py-1 px-3">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mandat {mandateCode} erstellt
          </Badge>
        </div>
      )}
    </>
  );
}
