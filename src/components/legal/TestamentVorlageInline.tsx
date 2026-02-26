/**
 * TestamentVorlageInline — Zeigt den vollen juristischen Text einer Testament-Vorlage
 * inline auf der Seite an (zum Abschreiben per Hand).
 */
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Printer, Upload } from 'lucide-react';
import { sanitizeFileName, UPLOAD_BUCKET } from '@/config/storageManifest';
import { CARD, INFO_BANNER } from '@/config/designManifest';
import { generateTestamentVorlagenPdf } from '@/lib/generateLegalDocumentPdf';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import type { TestamentVorlage } from './testamentVorlagenTexte';

interface Props {
  vorlage: TestamentVorlage;
  tenantId: string;
  onCompleted: () => void;
}

export function TestamentVorlageInline({ vorlage, tenantId, onCompleted }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDownload = useCallback(() => {
    const doc = generateTestamentVorlagenPdf();
    doc.save('Testament_Schreibvorlagen.pdf');
  }, []);

  const handlePrint = useCallback(() => {
    const doc = generateTestamentVorlagenPdf();
    doc.autoPrint();
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob));
  }, []);

  const handleUploadScan = useCallback(async (files: File[]) => {
    if (!user?.id || !tenantId || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const filePath = `${tenantId}/legal/testament/${sanitizeFileName(file.name)}`;
      await supabase.storage.from(UPLOAD_BUCKET).upload(filePath, file).catch(() => {});

      const record = {
        tenant_id: tenantId,
        user_id: user.id,
        document_type: 'testament' as const,
        is_completed: true,
        completed_at: new Date().toISOString(),
        form_data: {} as any,
      };

      const { data: existing } = await supabase
        .from('legal_documents')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('document_type', 'testament')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('legal_documents').update(record).eq('id', existing.id);
      } else {
        await supabase.from('legal_documents').insert(record);
      }

      toast.success('Testament-Scan erfolgreich hinterlegt!');
      onCompleted();
    } catch {
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  }, [user?.id, tenantId, onCompleted]);

  return (
    <div className="space-y-6 mt-6">
      {/* Roter Warnhinweis */}
      <div className={`${INFO_BANNER.BASE} ${INFO_BANNER.WARNING}`}>
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold text-destructive">Wichtig: Eigenhändige Form erforderlich</p>
            <p className="text-muted-foreground">
              Ein eigenhändiges Testament ist <strong>nur wirksam</strong>, wenn der gesamte Text{' '}
              <strong>vollständig handschriftlich</strong> geschrieben und eigenhändig unterschrieben wird.
              Ein Ausdruck (auch mit Unterschrift) oder eine digitale Signatur macht ein Testament{' '}
              <strong>NICHT wirksam</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Vorlagetext */}
      <div className={`${CARD.BASE} p-6 space-y-4`}>
        <h3 className="text-lg font-semibold font-serif">
          VORLAGE {vorlage.id}/4 — {vorlage.title.toUpperCase()}
        </h3>
        <p className="text-sm text-muted-foreground italic">{vorlage.subtitle}</p>

        {/* Intro */}
        <div className="font-serif text-sm leading-relaxed space-y-1 mt-4">
          {vorlage.intro.map((line, i) => (
            <p key={i} className={line.startsWith('____') ? 'text-muted-foreground/60' : ''}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {/* Paragraphen */}
        {vorlage.paragraphs.map((p, i) => (
          <div key={i} className="mt-6">
            <h4 className="font-serif font-semibold text-sm mb-2">{p.title}</h4>
            <div className="font-serif text-sm leading-relaxed space-y-1">
              {p.lines.map((line, j) => (
                <p key={j} className={line.startsWith('____') || line.startsWith('(weitere') ? 'text-muted-foreground/60 italic' : ''}>
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* Unterschriftenblock */}
        <div className="mt-8 pt-4 border-t border-border/30">
          <div className="font-serif text-sm whitespace-pre-line text-muted-foreground">
            {vorlage.signatureNote}
          </div>
        </div>
      </div>

      {/* Aktionsbuttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          PDF herunterladen (alle 4 Vorlagen)
        </Button>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Drucken
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
            Ich bestätige, dass das handschriftliche Original sicher aufbewahrt ist.
          </span>
        </div>
        {uploading && <p className="text-sm text-muted-foreground animate-pulse">Wird hochgeladen...</p>}
      </div>
    </div>
  );
}
