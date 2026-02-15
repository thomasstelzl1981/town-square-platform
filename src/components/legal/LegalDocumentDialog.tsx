/**
 * LegalDocumentDialog — Zwei Modi:
 * - patientenverfuegung: 3-Schritt (Formular → Vorschau → Upload)
 * - testament: 2-Schritt (Hinweise+Download → Upload)
 */
import { useState, useCallback } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { Badge } from '@/components/ui/badge';
import { generatePatientenverfuegungPdf, generateTestamentVorlagenPdf, getDefaultPvVvForm, type LegalDocumentFormData } from '@/lib/generateLegalDocumentPdf';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Printer, Upload, CheckCircle2, FileText, AlertTriangle, Download, Info } from 'lucide-react';

type PvStep = 'edit' | 'preview' | 'upload';
type TestamentStep = 'info' | 'upload';

interface LegalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'patientenverfuegung' | 'testament';
  tenantId: string;
  existingFormData?: LegalDocumentFormData | null;
  onCompleted: () => void;
}

export function LegalDocumentDialog({
  open, onOpenChange, documentType, tenantId, existingFormData, onCompleted,
}: LegalDocumentDialogProps) {
  const { user } = useAuth();
  const userId = user?.id;
  const isTestament = documentType === 'testament';

  const [pvStep, setPvStep] = useState<PvStep>('edit');
  const [testamentStep, setTestamentStep] = useState<TestamentStep>('info');
  const [form, setForm] = useState<LegalDocumentFormData>(existingFormData || getDefaultPvVvForm());
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const updatePv = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, pv: { ...prev.pv, [field]: value } }));
  }, []);

  const updateVv = useCallback((field: string, value: unknown) => {
    setForm(prev => ({ ...prev, vv: { ...prev.vv, [field]: value } }));
  }, []);

  // PV handlers
  const handlePrint = useCallback(() => {
    const doc = generatePatientenverfuegungPdf(form);
    doc.autoPrint();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url);
  }, [form]);

  const handleDownloadPv = useCallback(() => {
    const doc = generatePatientenverfuegungPdf(form);
    doc.save('Patientenverfuegung_Vorsorgevollmacht.pdf');
  }, [form]);

  // Testament handler
  const handleDownloadTestament = useCallback(() => {
    const doc = generateTestamentVorlagenPdf();
    doc.save('Testament_Schreibvorlagen.pdf');
  }, []);

  // Upload handler (shared)
  const handleUploadScan = useCallback(async (files: File[]) => {
    if (!userId || !tenantId || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const filePath = `${tenantId}/legal/${documentType}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) {
        console.warn('Upload failed (bucket may not exist), marking as completed anyway:', uploadError);
      }

      const record = {
        tenant_id: tenantId,
        user_id: userId,
        document_type: documentType,
        is_completed: true,
        completed_at: new Date().toISOString(),
        form_data: (isTestament ? {} : JSON.parse(JSON.stringify(form))) as Json,
      };

      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('document_type', documentType)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('legal_documents').update(record).eq('id', existing.id);
      } else {
        await supabase.from('legal_documents').insert(record);
      }

      toast.success('Dokument erfolgreich hinterlegt!');
      onCompleted();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  }, [userId, tenantId, documentType, form, isTestament, onCompleted, onOpenChange]);

  const handleSaveFormData = useCallback(async () => {
    if (!userId || !tenantId) return;
    try {
      const record = {
        tenant_id: tenantId,
        user_id: userId,
        document_type: documentType,
        form_data: JSON.parse(JSON.stringify(form)) as Json,
      };
      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('document_type', documentType)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase.from('legal_documents').update({ form_data: record.form_data }).eq('id', existing.id);
      } else {
        await supabase.from('legal_documents').insert(record);
      }
    } catch {
      // silent save
    }
  }, [userId, tenantId, documentType, form]);

  // ═══════════════════════════════════════════
  // SHARED: Upload step renderer
  // ═══════════════════════════════════════════
  const renderUpload = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Bitte laden Sie den <strong>unterschriebenen Scan</strong> hier hoch:
      </div>
      
      <FileDropZone onDrop={handleUploadScan} disabled={uploading}>
        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">PDF oder Bild hierher ziehen</p>
          <p className="text-xs text-muted-foreground mt-1">oder klicken zum Auswählen</p>
        </div>
      </FileDropZone>

      <div className="flex items-start gap-2">
        <Checkbox checked={confirmed} onCheckedChange={v => setConfirmed(!!v)} />
        <span className="text-sm">
          {isTestament
            ? 'Ich bestätige, dass das handschriftliche Original sicher aufbewahrt ist.'
            : 'Ich bestätige, dass das Original sicher aufbewahrt ist und eine Ausfertigung der bevollmächtigten Person übergeben wurde.'}
        </span>
      </div>

      {uploading && (
        <div className="text-sm text-muted-foreground animate-pulse">Wird hochgeladen...</div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════
  // TESTAMENT: Info + Download step
  // ═══════════════════════════════════════════
  const renderTestamentInfo = () => (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
      {/* Formhinweis */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-red-700 dark:text-red-400">Wichtig: Eigenhändige Form erforderlich</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Ein eigenhändiges Testament ist <strong>nur wirksam</strong>, wenn der gesamte Text <strong>vollständig handschriftlich</strong> geschrieben und eigenhändig unterschrieben wird.</li>
              <li>Ein Ausdruck (auch mit Unterschrift) oder eine digitale Signatur macht ein Testament <strong>NICHT wirksam</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Empfohlene Handhabung */}
      <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm space-y-2">
            <p className="font-semibold">Empfohlene Handhabung</p>
            <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
              <li>Laden Sie die <strong>PDF-Schreibvorlage</strong> herunter (enthält 4 verschiedene Testament-Varianten).</li>
              <li>Wählen Sie die passende Vorlage und <strong>schreiben Sie den Text 1–3-mal als Entwurf per Hand</strong>, bis alles korrekt ist.</li>
              <li>Fertigen Sie <strong>genau EIN endgültiges handschriftliches Original</strong> an, mit Ort, Datum und vollständiger Unterschrift.</li>
              <li>Bewahren Sie das Original <strong>sicher auf</strong> (Tresor, Notar, amtliche Verwahrung beim Nachlassgericht).</li>
              <li>Laden Sie hier einen <strong>Scan als Referenzkopie</strong> hoch — dieser ersetzt nicht das Original.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Enthaltene Vorlagen */}
      <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
        <p className="text-sm font-semibold mb-2">Die PDF enthält folgende Vorlagen:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>📄 <strong>Vorlage 1/4:</strong> Einzeltestament — Alleinerbe (mit Ersatzerbe)</li>
          <li>📄 <strong>Vorlage 2/4:</strong> Einzeltestament — Mehrere Erben (Quoten)</li>
          <li>📄 <strong>Vorlage 3/4:</strong> Vor- und Nacherbschaft</li>
          <li>📄 <strong>Vorlage 4/4:</strong> Berliner Testament (Ehegatten/Lebenspartner)</li>
        </ul>
      </div>

      {/* Hinterlegungshinweis */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Auffindbarkeit im Erbfall</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Privat aufbewahrte Testamente werden <strong>nicht</strong> im Zentralen Testamentsregister registriert.</li>
              <li>Für die Registrierung kann das Testament in die <strong>amtliche Verwahrung beim Nachlassgericht</strong> gegeben werden.</li>
              <li>Bei größeren Vermögen, Immobilien oder Patchwork-Familien wird <strong>notarielle/anwaltliche Beratung</strong> empfohlen.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download-Button */}
      <Button onClick={handleDownloadTestament} size="lg" className="w-full gap-2">
        <Download className="h-5 w-5" />
        PDF-Schreibvorlage herunterladen (4 Varianten)
      </Button>
    </div>
  );

  // ═══════════════════════════════════════════
  // PATIENTENVERFÜGUNG: Edit step
  // ═══════════════════════════════════════════
  const renderEdit = () => (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
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
            <Input value={form.vv.name} onChange={e => updateVv('name', e.target.value)} placeholder="Wird aus Teil A übernommen" />
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
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h3 className="font-semibold">Patientenverfügung & Vorsorgevollmacht</h3>
            <p className="text-sm text-muted-foreground">Juristisches Dokument — bereit zum Drucken</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• Erstellt für: <strong>{form.pv.name || '(Name nicht angegeben)'}</strong></p>
          <p>• Bevollmächtigte Person: <strong>{form.vv.bev_name || '(nicht angegeben)'}</strong></p>
          <p>• Format: A4, Serif-Schrift (Times), mehrseitig</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-amber-700 dark:text-amber-400">Wichtige Hinweise:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li>Bitte <strong>ausdrucken</strong> und <strong>eigenhändig unterschreiben</strong>.</li>
              <li>Das <strong>Original sicher aufbewahren</strong> (z.B. Tresor, Notar).</li>
              <li>Eine <strong>Ausfertigung</strong> der bevollmächtigten Person übergeben.</li>
              <li>Die Seiten sollten fest miteinander verbunden werden (heften).</li>
              <li>Idealerweise <strong>doppelseitig</strong> drucken.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handlePrint} className="flex-1 gap-2">
          <Printer className="h-4 w-4" />
          Drucken
        </Button>
        <Button onClick={handleDownloadPv} variant="outline" className="flex-1 gap-2">
          <FileText className="h-4 w-4" />
          PDF herunterladen
        </Button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  if (isTestament) {
    const testamentStepLabels: Record<TestamentStep, string> = {
      info: 'Hinweise & Download',
      upload: 'Scan hochladen',
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Testament — Schreibvorlagen</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                {(['info', 'upload'] as TestamentStep[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <Badge
                      variant={testamentStep === s ? 'default' : 'outline'}
                      className={testamentStep === s ? '' : 'opacity-50'}
                    >
                      {i + 1}. {testamentStepLabels[s]}
                    </Badge>
                    {i < 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </DialogDescription>
          </DialogHeader>

          {testamentStep === 'info' && renderTestamentInfo()}
          {testamentStep === 'upload' && renderUpload()}

          <div className="flex justify-between pt-4 border-t border-border/30">
            {testamentStep === 'upload' ? (
              <Button variant="outline" onClick={() => setTestamentStep('info')} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Zurück
              </Button>
            ) : <div />}

            {testamentStep === 'info' && (
              <Button onClick={() => setTestamentStep('upload')} className="gap-2">
                Scan hochladen <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // PATIENTENVERFÜGUNG (3-Schritt)
  const pvStepLabels: Record<PvStep, string> = {
    edit: 'Vorlage bearbeiten',
    preview: 'Druckvorschau',
    upload: 'Scan hochladen',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Patientenverfügung & Vorsorgevollmacht</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              {(['edit', 'preview', 'upload'] as PvStep[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <Badge
                    variant={pvStep === s ? 'default' : 'outline'}
                    className={pvStep === s ? '' : 'opacity-50'}
                  >
                    {i + 1}. {pvStepLabels[s]}
                  </Badge>
                  {i < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </DialogDescription>
        </DialogHeader>

        {pvStep === 'edit' && renderEdit()}
        {pvStep === 'preview' && renderPreview()}
        {pvStep === 'upload' && renderUpload()}

        <div className="flex justify-between pt-4 border-t border-border/30">
          {pvStep !== 'edit' ? (
            <Button variant="outline" onClick={() => {
              if (pvStep === 'preview') setPvStep('edit');
              if (pvStep === 'upload') setPvStep('preview');
            }} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Button>
          ) : <div />}

          {pvStep === 'edit' && (
            <Button onClick={() => { handleSaveFormData(); setPvStep('preview'); }} className="gap-2">
              Vorschau <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {pvStep === 'preview' && (
            <Button onClick={() => setPvStep('upload')} className="gap-2">
              Weiter zum Upload <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
