/**
 * Tab 3: Public Pages — Website Legaltexte pro Brand, inline Cards
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import ReactMarkdown from 'react-markdown';
import { useComplianceDocuments, useDocumentVersions, type ComplianceDocument } from './useComplianceDocuments';

const BRANDS = ['kaufy', 'futureroom', 'sot', 'acquiary', 'tierservice'];
const DOC_TYPE_LABELS: Record<string, string> = { website_imprint: 'Impressum', website_privacy: 'Datenschutz' };

function PublicPageCard({ doc }: { doc: ComplianceDocument }) {
  const { createVersion, activateVersion } = useComplianceDocuments('website');
  const { data: versions } = useDocumentVersions(doc.id);
  const [newContent, setNewContent] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  const activeVersion = versions?.find(v => v.status === 'active');
  const latestDraft = versions?.find(v => v.status === 'draft');

  useEffect(() => {
    if (activeVersion?.content_md && !prefilled) {
      setNewContent(activeVersion.content_md);
      setPrefilled(true);
    }
  }, [activeVersion, prefilled]);

  const hasChanges = newContent !== (activeVersion?.content_md || '');

  // Extract brand and type from doc_key
  const docKey = doc.doc_key || '';
  const brand = BRANDS.find(b => docKey.endsWith(`_${b}`)) || '';
  const typeKey = docKey.replace(`_${brand}`, '');
  const typeLabel = DOC_TYPE_LABELS[typeKey] || typeKey;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            {doc.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{brand}</Badge>
            <Badge variant="outline">{typeLabel}</Badge>
            <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>{doc.status}</Badge>
            <Badge variant="outline">v{doc.current_version}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aktive Version immer sichtbar */}
        {activeVersion && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Aktuelle Version (v{activeVersion.version})</p>
            <div className="p-4 rounded-lg border bg-muted/30 prose prose-sm max-w-none dark:prose-invert text-sm">
              <ReactMarkdown>{activeVersion.content_md}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Inline-Editor */}
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {activeVersion ? 'Neue Version erstellen:' : 'Erste Version erstellen:'}
          </p>
          <Textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Markdown-Inhalt des Rechtstexts…"
            className="min-h-[400px] font-mono text-xs"
          />
          <Input
            value={changeNote}
            onChange={e => setChangeNote(e.target.value)}
            placeholder="Änderungsnotiz (optional)"
            className="text-sm"
          />
          <div className="flex items-center gap-2 justify-end">
            {hasChanges && (
              <span className="text-xs text-muted-foreground">Ungespeicherte Änderungen</span>
            )}
            <Button
              size="sm"
              disabled={!newContent.trim() || createVersion.isPending}
              onClick={() => {
                createVersion.mutate(
                  { documentId: doc.id, contentMd: newContent, changeNote: changeNote || undefined },
                  { onSuccess: () => { setChangeNote(''); setPrefilled(false); } }
                );
              }}
            >
              <Save className="h-3 w-3 mr-1" /> Draft speichern
            </Button>
          </div>
        </div>

        {/* Draft aktivieren */}
        {latestDraft && (
          <div className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs border">
            <div>
              <span>v{latestDraft.version} — {latestDraft.status}</span>
              {latestDraft.change_note && <span className="ml-2 text-muted-foreground">({latestDraft.change_note})</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => activateVersion.mutate({ documentId: doc.id, versionId: latestDraft.id, version: latestDraft.version })}
            >
              Aktivieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompliancePublicPages() {
  const { documents, isLoading } = useComplianceDocuments('website');

  if (isLoading) return <LoadingState />;

  // Group documents by brand
  const grouped = BRANDS.reduce<Record<string, ComplianceDocument[]>>((acc, brand) => {
    const docs = documents.filter(d => (d.doc_key || '').endsWith(`_${brand}`));
    if (docs.length > 0) acc[brand] = docs;
    return acc;
  }, {});

  const ungrouped = documents.filter(d => !BRANDS.some(b => (d.doc_key || '').endsWith(`_${b}`)));

  return (
    <div className="space-y-6 mt-4">
      {Object.entries(grouped).map(([brand, docs]) => (
        <div key={brand} className="space-y-4">
          <h3 className="text-sm font-semibold capitalize text-muted-foreground">{brand}</h3>
          {docs.map(doc => (
            <PublicPageCard key={doc.id} doc={doc} />
          ))}
        </div>
      ))}
      {ungrouped.map(doc => (
        <PublicPageCard key={doc.id} doc={doc} />
      ))}
      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Keine Website-Legaltexte vorhanden.</p>
      )}
    </div>
  );
}
