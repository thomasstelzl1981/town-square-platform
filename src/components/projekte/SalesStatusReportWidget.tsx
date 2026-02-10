/**
 * SalesStatusReportWidget
 * KPI aggregation, PDF download, email dispatch for project reports.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Send, X, Plus, FileText, Loader2 } from 'lucide-react';
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
  provisionRate: number;
  targetYield: number;
  developerContext: DeveloperContext;
  isDemo: boolean;
}

export function SalesStatusReportWidget({
  units, projectName, investmentCosts, provisionRate, targetYield, developerContext, isDemo,
}: SalesStatusReportWidgetProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // KPIs
  const kpis = useMemo(() => {
    const totalVolume = units.reduce((s, u) => s + u.effective_price, 0);
    const reservedEur = units.filter(u => u.status === 'reserved').reduce((s, u) => s + u.effective_price, 0);
    const soldEur = units.filter(u => u.status === 'sold' || u.status === 'notary').reduce((s, u) => s + u.effective_price, 0);
    const freeEur = units.filter(u => u.status === 'available').reduce((s, u) => s + u.effective_price, 0);
    const totalProvision = units.reduce((s, u) => s + u.effective_provision, 0);
    const grossProfit = totalVolume - investmentCosts - totalProvision;
    return { totalVolume, reservedEur, soldEur, freeEur, totalProvision, grossProfit };
  }, [units, investmentCosts]);

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
    setRecipients(prev => [...prev, email]);
    setNewRecipient('');
  };

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r !== email));
  };

  const buildReportParams = async (): Promise<ReportParams> => {
    // Load images as base64
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
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      doc.save(`Vertriebsstatusreport_${projectName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
      toast.success('PDF heruntergeladen');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF-Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReport = async () => {
    if (recipients.length === 0) {
      toast.error('Bitte mindestens einen Empfänger hinzufügen');
      return;
    }
    setIsSending(true);
    try {
      const dateStr = new Date().toLocaleDateString('de-DE');
      const coverLetter = `
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

      const { data, error } = await supabase.functions.invoke('sot-system-mail-send', {
        body: {
          to: recipients,
          subject: `Vertriebsstatusreport — ${projectName} — ${dateStr}`,
          html: coverLetter,
          context: 'project-report',
        },
      });

      if (error) throw error;
      toast.success(`Report an ${recipients.length} Empfänger gesendet`);
    } catch (err) {
      console.error('Send failed:', err);
      toast.error('Versand fehlgeschlagen');
    } finally {
      setIsSending(false);
    }
  };

  return (
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
          {[
            { id: 'auto-confirm', label: 'Reservierungen automatisch bestätigen', defaultChecked: false },
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
  );
}
