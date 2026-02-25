/**
 * PatientenverfuegungInlineForm — Inline-Formular für Patientenverfügung + Vorsorgevollmacht
 * Extrahiert aus LegalDocumentDialog, zeigt alles direkt auf der Seite.
 */
import { useState, useCallback, useEffect } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { generatePatientenverfuegungPdf, getDefaultPvVvForm, type LegalDocumentFormData } from '@/lib/generateLegalDocumentPdf';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Printer, Upload, FileText, Download } from 'lucide-react';
import { sanitizeFileName } from '@/config/storageManifest';
import { CARD } from '@/config/designManifest';
import { useQuery } from '@tanstack/react-query';

interface Props {
  personId: string;
  personName: string;
  personBirthDate: string | null;
  personAddress: string;
  tenantId: string;
  onCompleted: () => void;
}

export function PatientenverfuegungInlineForm({
  personId, personName, personBirthDate, personAddress, tenantId, onCompleted,
}: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<LegalDocumentFormData>(getDefaultPvVvForm());
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Load existing form data for this person
  const { data: existingDoc } = useQuery({
    queryKey: ['legal-doc-pv', tenantId, personId],
    queryFn: async () => {
      const { data } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('document_type', 'patientenverfuegung')
        .eq('user_id', personId)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantId && !!personId,
  });

  // When person changes or existing data loads, update form
  useEffect(() => {
    if (existingDoc?.form_data) {
      setForm(existingDoc.form_data as unknown as LegalDocumentFormData);
    } else {
      const defaults = getDefaultPvVvForm();
      defaults.pv.name = personName;
      defaults.pv.geburtsdatum = personBirthDate || '';
      defaults.pv.adresse = personAddress;
      defaults.vv.name = personName;
      defaults.vv.geburtsdatum = personBirthDate || '';
      defaults.vv.adresse = personAddress;
      setForm(defaults);
    }
  }, [personId, existingDoc, personName, personBirthDate, personAddress]);

  const updatePv = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, pv: { ...prev.pv, [field]: value } }));
  }, []);

  const updateVv = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, vv: { ...prev.vv, [field]: value } }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!user?.id || !tenantId) return;
    try {
      const record = {
        tenant_id: tenantId,
        user_id: personId,
        document_type: 'patientenverfuegung' as const,
        form_data: JSON.parse(JSON.stringify(form)) as Json,
      };
      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('document_type', 'patientenverfuegung')
        .eq('user_id', personId)
        .maybeSingle();

      if (existing) {
        await supabase.from('legal_documents').update({ form_data: record.form_data }).eq('id', existing.id);
      } else {
        await supabase.from('legal_documents').insert(record);
      }
      toast.success('Formulardaten gespeichert');
    } catch {
      toast.error('Fehler beim Speichern');
    }
  }, [user?.id, tenantId, personId, form]);

  const handlePrint = useCallback(() => {
    handleSave();
    const doc = generatePatientenverfuegungPdf(form);
    doc.autoPrint();
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob));
  }, [form, handleSave]);

  const handleDownload = useCallback(() => {
    handleSave();
    const doc = generatePatientenverfuegungPdf(form);
    doc.save('Patientenverfuegung_Vorsorgevollmacht.pdf');
  }, [form, handleSave]);

  const handleUploadScan = useCallback(async (files: File[]) => {
    if (!user?.id || !tenantId || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const filePath = `${tenantId}/legal/patientenverfuegung/${sanitizeFileName(file.name)}`;
      await supabase.storage.from('documents').upload(filePath, file).catch(() => {});

      const record = {
        tenant_id: tenantId,
        user_id: personId,
        document_type: 'patientenverfuegung' as const,
        is_completed: true,
        completed_at: new Date().toISOString(),
        form_data: JSON.parse(JSON.stringify(form)) as Json,
      };

      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('document_type', 'patientenverfuegung')
        .eq('user_id', personId)
        .maybeSingle();

      if (existing) {
        await supabase.from('legal_documents').update(record).eq('id', existing.id);
      } else {
        await supabase.from('legal_documents').insert(record);
      }

      toast.success('Dokument erfolgreich hinterlegt!');
      onCompleted();
    } catch {
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  }, [user?.id, tenantId, personId, form, onCompleted]);

  return (
    <div className="space-y-6 mt-6">
      <div className={`${CARD.BASE} p-6 space-y-6`}>
        {/* TEIL A: Patientenverfügung */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold border-b border-border/30 pb-2">
            Teil A — Patientenverfügung
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Vollständiger Name</Label>
              <Input value={form.pv.name} onChange={e => updatePv('name', e.target.value)} placeholder="Vor- und Nachname" />
            </div>
            <div>
              <Label className="text-xs">Geburtsdatum</Label>
              <Input type="date" value={form.pv.geburtsdatum} onChange={e => updatePv('geburtsdatum', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Adresse</Label>
              <Input value={form.pv.adresse} onChange={e => updatePv('adresse', e.target.value)} placeholder="Straße, PLZ Ort" />
            </div>
            <div>
              <Label className="text-xs">Personalausweis-Nr. (optional)</Label>
              <Input value={form.pv.ausweisnr} onChange={e => updatePv('ausweisnr', e.target.value)} />
            </div>
          </div>

          {/* Situationen */}
          <div>
            <Label className="text-xs font-semibold">1) Geltungsbereich — Situationen</Label>
            <div className="space-y-2 mt-2">
              {[
                { key: 'sit_endstadium', label: 'Endstadium einer unheilbaren, tödlich verlaufenden Krankheit' },
                { key: 'sit_sterbeprozess', label: 'Unabwendbarer Sterbeprozess' },
                { key: 'sit_hirnschaedigung', label: 'Dauerhafter Ausfall höherer Hirnfunktionen' },
                { key: 'sit_koma', label: 'Dauerhafte Bewusstlosigkeit (Koma)' },
              ].map(s => (
                <div key={s.key} className="flex items-start gap-2">
                  <Checkbox
                    checked={form.pv[s.key as keyof typeof form.pv] as boolean}
                    onCheckedChange={v => updatePv(s.key, v)}
                  />
                  <span className="text-sm">{s.label}</span>
                </div>
              ))}
              <div>
                <Label className="text-xs">Sonstiges</Label>
                <Input value={form.pv.sit_sonstiges} onChange={e => updatePv('sit_sonstiges', e.target.value)} placeholder="Weitere Situationen..." />
              </div>
            </div>
          </div>

          {/* Grundentscheidung */}
          <div>
            <Label className="text-xs font-semibold">2) Lebensverlängernde Maßnahmen</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-start gap-2">
                <Checkbox checked={form.pv.grund_keine} onCheckedChange={v => updatePv('grund_keine', v)} />
                <span className="text-sm">KEINE lebensverlängernden Maßnahmen</span>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox checked={form.pv.grund_ja} onCheckedChange={v => updatePv('grund_ja', v)} />
                <span className="text-sm">JA, solange Aussicht auf erträglichen Zustand</span>
              </div>
              <div>
                <Label className="text-xs">Differenzierung (optional)</Label>
                <Textarea value={form.pv.grund_differenzierung} onChange={e => updatePv('grund_differenzierung', e.target.value)} className="min-h-[60px]" />
              </div>
            </div>
          </div>

          {/* Konkrete Maßnahmen */}
          <div>
            <Label className="text-xs font-semibold">3) Konkrete Maßnahmen</Label>
            <div className="space-y-3 mt-2">
              {[
                { title: '3.1 Wiederbelebung', nein: 'reanimation_nein', ja: 'reanimation_ja', details: null },
                { title: '3.2 Künstliche Beatmung', nein: 'beatmung_nein', ja: 'beatmung_ja', details: 'beatmung_details' },
                { title: '3.3 Künstliche Ernährung', nein: 'ernaehrung_nein', ja: 'ernaehrung_ja', details: 'ernaehrung_details' },
                { title: '3.4 Dialyse', nein: 'dialyse_nein', ja: 'dialyse_ja', details: 'dialyse_details' },
                { title: '3.5 Intensivmedizin', nein: 'intensiv_nein', ja: 'intensiv_ja', details: 'intensiv_details' },
              ].map(m => (
                <div key={m.title} className="space-y-1">
                  <span className="text-sm font-medium">{m.title}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Checkbox checked={form.pv[m.nein as keyof typeof form.pv] as boolean} onCheckedChange={v => updatePv(m.nein, v)} />
                      <span className="text-xs">Ablehnen</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox checked={form.pv[m.ja as keyof typeof form.pv] as boolean} onCheckedChange={v => updatePv(m.ja, v)} />
                      <span className="text-xs">Wünschen</span>
                    </div>
                  </div>
                  {m.details && (
                    <Input
                      value={form.pv[m.details as keyof typeof form.pv] as string}
                      onChange={e => updatePv(m.details!, e.target.value)}
                      placeholder="Details (optional)"
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              ))}
              <div>
                <Label className="text-xs">Flüssigkeit (optional)</Label>
                <Input value={form.pv.fluessigkeit} onChange={e => updatePv('fluessigkeit', e.target.value)} className="h-8" />
              </div>
            </div>
          </div>

          {/* Organspende */}
          <div>
            <Label className="text-xs font-semibold">5) Organspende</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2"><Checkbox checked={form.pv.organ_separat} onCheckedChange={v => updatePv('organ_separat', v)} /><span className="text-sm">Separate Erklärung vorhanden</span></div>
              <div className="flex items-center gap-2"><Checkbox checked={form.pv.organ_ja} onCheckedChange={v => updatePv('organ_ja', v)} /><span className="text-sm">Organspende gewünscht</span></div>
              <div className="flex items-center gap-2"><Checkbox checked={form.pv.organ_nein} onCheckedChange={v => updatePv('organ_nein', v)} /><span className="text-sm">Organspende abgelehnt</span></div>
              {form.pv.organ_ja && <Input value={form.pv.organ_details} onChange={e => updatePv('organ_details', e.target.value)} placeholder="Details zur Organspende" className="h-8" />}
            </div>
          </div>

          {/* Werte */}
          <div>
            <Label className="text-xs font-semibold">6) Persönliche Werte / Leitlinien</Label>
            <Textarea value={form.pv.werte} onChange={e => updatePv('werte', e.target.value)} placeholder="z.B. Würde, Schmerzfreiheit, religiöse Überzeugungen..." className="min-h-[80px] mt-1" />
          </div>

          {/* Datum */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Ort</Label><Input value={form.pv.ort} onChange={e => updatePv('ort', e.target.value)} /></div>
            <div><Label className="text-xs">Datum</Label><Input type="date" value={form.pv.datum} onChange={e => updatePv('datum', e.target.value)} /></div>
          </div>
        </div>

        {/* TEIL B: Vorsorgevollmacht */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold border-b border-border/30 pb-2">
            Teil B — Vorsorgevollmacht
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name Vollmachtgeber/in</Label>
              <Input value={form.vv.name} onChange={e => updateVv('name', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Geburtsdatum</Label>
              <Input type="date" value={form.vv.geburtsdatum} onChange={e => updateVv('geburtsdatum', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Adresse</Label>
              <Input value={form.vv.adresse} onChange={e => updateVv('adresse', e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold">Bevollmächtigte Person</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Name</Label><Input value={form.vv.bev_name} onChange={e => updateVv('bev_name', e.target.value)} /></div>
              <div><Label className="text-xs">Geburtsdatum</Label><Input type="date" value={form.vv.bev_geburtsdatum} onChange={e => updateVv('bev_geburtsdatum', e.target.value)} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Adresse</Label><Input value={form.vv.bev_adresse} onChange={e => updateVv('bev_adresse', e.target.value)} /></div>
              <div className="md:col-span-2"><Label className="text-xs">Telefon/E-Mail</Label><Input value={form.vv.bev_kontakt} onChange={e => updateVv('bev_kontakt', e.target.value)} /></div>
            </div>
          </div>

          {/* Umfang */}
          <div>
            <Label className="text-xs font-semibold">Umfang der Vollmacht</Label>
            <div className="space-y-2 mt-2">
              {[
                { key: 'umfang_gesundheit', label: 'Gesundheits- und Pflegeangelegenheiten' },
                { key: 'umfang_aufenthalt', label: 'Aufenthalts- und Wohnungsangelegenheiten' },
                { key: 'umfang_vermoegen', label: 'Vermögenssorge (Bank, Zahlungen, Verträge)' },
                { key: 'umfang_behoerden', label: 'Behörden- und Sozialleistungen' },
                { key: 'umfang_post', label: 'Post- und Fernmeldeverkehr' },
                { key: 'umfang_versicherungen', label: 'Vertretung gegenüber Versicherungen' },
                { key: 'umfang_vertraege', label: 'Abschluss/Kündigung Alltagsverträge' },
                { key: 'umfang_gericht', label: 'Vertretung vor Gericht' },
              ].map(u => (
                <div key={u.key} className="flex items-center gap-2">
                  <Checkbox checked={form.vv[u.key as keyof typeof form.vv] as boolean} onCheckedChange={v => updateVv(u.key, v)} />
                  <span className="text-sm">{u.label}</span>
                </div>
              ))}
              <Input value={form.vv.umfang_sonstiges} onChange={e => updateVv('umfang_sonstiges', e.target.value)} placeholder="Sonstiges..." className="h-8" />
            </div>
          </div>

          {/* Einschränkungen */}
          <div>
            <Label className="text-xs">Einschränkungen (optional)</Label>
            <Textarea value={form.vv.einschraenkungen} onChange={e => updateVv('einschraenkungen', e.target.value)} className="min-h-[60px]" />
          </div>

          {/* Untervollmacht */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><Checkbox checked={form.vv.untervollmacht_ja} onCheckedChange={v => updateVv('untervollmacht_ja', v)} /><span className="text-sm">Untervollmacht erlaubt</span></div>
            <div className="flex items-center gap-2"><Checkbox checked={form.vv.untervollmacht_nein} onCheckedChange={v => updateVv('untervollmacht_nein', v)} /><span className="text-sm">Keine Untervollmacht</span></div>
          </div>

          {/* Aufbewahrung */}
          <div>
            <Label className="text-xs">Aufbewahrungsort</Label>
            <Input value={form.vv.aufbewahrung} onChange={e => updateVv('aufbewahrung', e.target.value)} />
          </div>

          {/* Datum */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Ort</Label><Input value={form.vv.ort} onChange={e => updateVv('ort', e.target.value)} /></div>
            <div><Label className="text-xs">Datum</Label><Input type="date" value={form.vv.datum} onChange={e => updateVv('datum', e.target.value)} /></div>
          </div>
        </div>
      </div>

      {/* Aktionsbuttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" />
          PDF herunterladen
        </Button>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Drucken
        </Button>
        <Button onClick={handleSave} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Speichern
        </Button>
      </div>

      {/* Upload-Bereich */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Unterschriebenen Scan hochladen</h4>
        <FileDropZone onDrop={handleUploadScan} disabled={uploading}>
          <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/30 transition-colors cursor-pointer">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">PDF oder Bild hierher ziehen</p>
            <p className="text-xs text-muted-foreground mt-1">oder klicken zum Auswählen</p>
          </div>
        </FileDropZone>
        <div className="flex items-start gap-2">
          <Checkbox checked={confirmed} onCheckedChange={v => setConfirmed(!!v)} />
          <span className="text-sm text-muted-foreground">
            Ich bestätige, dass das Original sicher aufbewahrt ist und eine Ausfertigung der bevollmächtigten Person übergeben wurde.
          </span>
        </div>
        {uploading && <p className="text-sm text-muted-foreground animate-pulse">Wird hochgeladen...</p>}
      </div>
    </div>
  );
}
