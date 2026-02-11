/**
 * SalesStatusReportWidget
 * KPI aggregation, PDF download, email dispatch for project reports.
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Download, Send, X, Plus, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { DeveloperContext } from './demoProjectData';
import { generateProjectReportPdf, loadImageAsDataUrl, type ReportParams, type ReportUnit } from './generateProjectReportPdf';
import { DEMO_PROJECT_DESCRIPTION } from './demoProjectData';

// Import demo images
import imgExterior from '@/assets/demo-project-exterior.jpg';
import imgLivingroom from '@/assets/demo-project-livingroom.jpg';
import imgKitchen from '@/assets/demo-project-kitchen.jpg';

interface CalculatedUnit {
  id: string;
  unit_number: string;
  rooms: number;
  area_sqm: number;
  effective_price: number;
  effective_yield: number;
  effective_price_per_sqm: number;
  effective_provision: number;
  parking_price: number;
  status: string;
}

interface SalesStatusReportWidgetProps {
  units: CalculatedUnit[];
  projectName: string;
  investmentCosts: number;
  totalSaleTarget: number;
  provisionRate: number;
  targetYield: number;
  developerContext: DeveloperContext;
  isDemo: boolean;
}

const STORAGE_KEY_PREFIX = 'sot-report-recipients-';

export function SalesStatusReportWidget({
  units, projectName, investmentCosts, totalSaleTarget, provisionRate, targetYield, developerContext, isDemo,
}: SalesStatusReportWidgetProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Load recipients from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${projectName}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecipients(parsed);
      }
    } catch { /* ignore parse errors */ }
  }, [projectName]);

  // Persist recipients to localStorage on change
  const persistRecipients = (updated: string[]) => {
    setRecipients(updated);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${projectName}`, JSON.stringify(updated));
    } catch { /* ignore quota errors */ }
  };

  // KPIs
  const kpis = useMemo(() => {
    const sumUnits = units.reduce((s, u) => s + u.effective_price, 0);
    const totalVolume = totalSaleTarget > 0 ? totalSaleTarget : sumUnits;
    const reservedEur = units.filter(u => u.status === 'reserved').reduce((s, u) => s + u.effective_price, 0);
    const soldEur = units.filter(u => u.status === 'sold' || u.status === 'notary').reduce((s, u) => s + u.effective_price, 0);
    const freeEur = units.filter(u => u.status === 'available').reduce((s, u) => s + u.effective_price, 0);
    const totalProvision = units
      .filter(u => u.status === 'sold' || u.status === 'notary')
      .reduce((s, u) => s + u.effective_provision, 0);
    const grossProfit = totalVolume - investmentCosts - totalProvision;
    return { totalVolume, sumUnits, reservedEur, soldEur, freeEur, totalProvision, grossProfit };
  }, [units, investmentCosts, totalSaleTarget]);

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Bitte gültige E-Mail-Adresse eingeben');
      return;
    }
    if (recipients.includes(email)) {
      toast.error('E-Mail bereits hinzugefügt');
      return;
    }
    persistRecipients([...recipients, email]);
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    persistRecipients(recipients.filter(r => r !== email));
  };

  const dateStr = new Date().toLocaleDateString('de-DE');
  const subject = `Vertriebsstatusreport — ${projectName} — ${dateStr}`;
  const coverLetterText = `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie den aktuellen Vertriebsstatusreport für unser Projekt „${projectName}".\n\nDer Report umfasst die aktuelle Preisliste, den Reservierungsstand sowie die wesentlichen Projektkennzahlen auf Basis unserer laufenden Kalkulation.\n\nBei Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\nIhr System of a Town Team`;

  const coverLetterHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <p>Sehr geehrte Damen und Herren,</p>
      <p>anbei erhalten Sie den aktuellen Vertriebsstatusreport für unser Projekt „${projectName}".</p>
      <p>Der Report umfasst die aktuelle Preisliste, den Reservierungsstand sowie die wesentlichen Projektkennzahlen auf Basis unserer laufenden Kalkulation.</p>
      <p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
      <p>Mit freundlichen Grüßen<br/>Ihr System of a Town Team</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999;">Vertraulich — System of a Town GmbH</p>
    </div>
  `;

  const buildReportParams = async (): Promise<ReportParams> => {
    const imageSources = [imgExterior, imgLivingroom, imgKitchen];
    const imageDataUrls: string[] = [];
    for (const src of imageSources) {
      try {
        const dataUrl = await loadImageAsDataUrl(src);
        imageDataUrls.push(dataUrl);
      } catch { /* skip failed images */ }
    }

    const reportUnits: ReportUnit[] = units.map(u => ({
      unit_number: u.unit_number,
      rooms: u.rooms,
      area_sqm: u.area_sqm,
      effective_price: u.effective_price,
      effective_price_per_sqm: u.effective_price_per_sqm,
      effective_yield: u.effective_yield,
      effective_provision: u.effective_provision,
      parking_price: u.parking_price,
      status: u.status,
    }));

    return {
      projectName,
      projectAddress: DEMO_PROJECT_DESCRIPTION.address,
      projectCity: DEMO_PROJECT_DESCRIPTION.city,
      projectPostalCode: DEMO_PROJECT_DESCRIPTION.postal_code,
      projectDescription: DEMO_PROJECT_DESCRIPTION.description,
      developerContext,
      totalUnits: DEMO_PROJECT_DESCRIPTION.total_units,
      totalParkingSpaces: DEMO_PROJECT_DESCRIPTION.total_parking_spaces,
      totalLivingArea: DEMO_PROJECT_DESCRIPTION.total_living_area,
      yearBuilt: DEMO_PROJECT_DESCRIPTION.year_built,
      renovationYear: DEMO_PROJECT_DESCRIPTION.renovation_year,
      heatingType: DEMO_PROJECT_DESCRIPTION.heating_type,
      energyClass: DEMO_PROJECT_DESCRIPTION.energy_class,
      investmentCosts,
      provisionRate,
      targetYield,
      units: reportUnits,
      imageDataUrls,
    };
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const params = await buildReportParams();
      const doc = await generateProjectReportPdf(params);
      const fileDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      doc.save(`Vertriebsstatusreport_${projectName.replace(/\s+/g, '_')}_${fileDateStr}.pdf`);
      toast.success('PDF heruntergeladen');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF-Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open send dialog (with validation)
  const handleSendReport = () => {
    if (recipients.length === 0) {
      toast.error('Bitte mindestens einen Empfänger hinzufügen');
      return;
    }
    setShowSendDialog(true);
  };

  // Actually send the email
  const handleConfirmSend = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('sot-system-mail-send', {
        body: {
          to: recipients,
          subject,
          html: coverLetterHtml,
          context: 'project-report',
        },
      });

      if (error) throw error;
      toast.success(`Report an ${recipients.length} Empfänger gesendet`);
      setShowSendDialog(false);
    } catch (err) {
      console.error('Send failed:', err);
      toast.error('Versand fehlgeschlagen');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Card className={cn(isDemo && 'opacity-60')}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Vertriebsstatusreport</CardTitle>
            {isDemo && <Badge variant="outline" className="text-[10px]">Demo</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* KPI Row 1 - Cumulative EUR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Projektvolumen', value: kpis.totalVolume },
              { label: 'Reserviert', value: kpis.reservedEur },
              { label: 'Verkauft', value: kpis.soldEur },
              { label: 'Frei', value: kpis.freeEur },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold tabular-nums">{formatCurrency(value)}</p>
              </div>
            ))}
          </div>

          {/* KPI Row 2 - Financial aggregates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Provision (kumuliert)</p>
              <p className="text-sm font-bold tabular-nums">{formatCurrency(kpis.totalProvision)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 text-center border border-primary/20">
              <p className="text-xs text-muted-foreground">Rohertrag Gesellschaft</p>
              <p className="text-sm font-bold tabular-nums text-primary">{formatCurrency(kpis.grossProfit)}</p>
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Empfänger</Label>
            <div className="flex gap-2">
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="email@beispiel.de"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
              />
              <Button variant="outline" size="icon" onClick={addRecipient}><Plus className="h-4 w-4" /></Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="text-xs gap-1 pr-1">
                    {email}
                    <button onClick={() => removeRecipient(email)} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownloadPdf} disabled={isGenerating} variant="outline" className="flex-1 gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF herunterladen
            </Button>
            <Button onClick={handleSendReport} disabled={isSending || recipients.length === 0} className="flex-1 gap-2">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Report senden
            </Button>
          </div>

          {/* Automation UI */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Automatisierung</p>
            <div className="flex items-center gap-3">
              <Label className="text-xs flex-1">Versandintervall</Label>
              <Select defaultValue="manual" onValueChange={() => toast.info('Wird in einer zukünftigen Version aktiviert')}>
                <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuell</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="biweekly">Alle 2 Wochen</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Highlighted reservation switch */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <Label htmlFor="auto-confirm" className="text-xs font-medium">Reservierungen automatisch bestätigen</Label>
              </div>
              <Switch id="auto-confirm" defaultChecked={false} onCheckedChange={() => toast.info('Wird in einer zukünftigen Version aktiviert')} />
            </div>

            {/* Other notification switches */}
            {[
              { id: 'notify-reservation', label: 'Benachrichtigung bei neuer Reservierung', defaultChecked: true },
              { id: 'notify-notary', label: 'Benachrichtigung bei Notar-Auftrag', defaultChecked: true },
            ].map(({ id, label, defaultChecked }) => (
              <div key={id} className="flex items-center justify-between">
                <Label htmlFor={id} className="text-xs">{label}</Label>
                <Switch id={id} defaultChecked={defaultChecked} onCheckedChange={() => toast.info('Wird in einer zukünftigen Version aktiviert')} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report versenden</DialogTitle>
            <DialogDescription>Überprüfen Sie die E-Mail vor dem Versand.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">An</p>
              <div className="flex flex-wrap gap-1.5">
                {recipients.map(email => (
                  <Badge key={email} variant="secondary" className="text-xs">{email}</Badge>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Betreff</p>
              <p className="text-sm font-medium">{subject}</p>
            </div>

            {/* Cover letter preview */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3 text-sm leading-relaxed">
              {coverLetterText.split('\n\n').map((paragraph, i) => (
                <p key={i} className="whitespace-pre-line">{paragraph}</p>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">Vertraulich — System of a Town GmbH</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Abbrechen</Button>
            <Button onClick={handleConfirmSend} disabled={isSending} className="gap-2">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Jetzt senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
