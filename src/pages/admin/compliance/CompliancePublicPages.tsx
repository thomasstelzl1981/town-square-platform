/**
 * Tab 3: Public Pages — Website Legaltexte pro Brand, inline Cards
 * Editor ist standardmäßig eingeklappt — nur per Button aufklappbar.
 * Vorschau zeigt gerenderten Text mit Platzhalter-Ersetzung + Warnung bei offenen Platzhaltern.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, Pencil, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import ReactMarkdown from 'react-markdown';
import { useComplianceDocuments, useDocumentVersions, type ComplianceDocument } from './useComplianceDocuments';
import { useComplianceCompany } from './useComplianceCompany';
import { renderComplianceMarkdown, findUnresolvedPlaceholders } from '@/lib/complianceHelpers';

const BRANDS = ['kaufy', 'futureroom', 'sot', 'acquiary', 'tierservice'];
const BRAND_LABELS: Record<string, string> = {
  kaufy: 'Kaufy', futureroom: 'Future Room', sot: 'System of a Town',
  acquiary: 'Acquiary', tierservice: 'Lennox & Friends',
};
const DOC_TYPE_LABELS: Record<string, string> = { website_imprint: 'Impressum', website_privacy: 'Datenschutz' };

/** Brand → company profile slug mapping (mirrors Zone3LegalPage) */
const BRAND_PROFILE_MAP: Record<string, string> = {
  kaufy: 'futureroom',
  futureroom: 'futureroom',
  acquiary: 'futureroom',
  sot: 'sot',
  tierservice: 'lennox',
};

function PublicPageCard({ doc, getProfileBySlug }: { doc: ComplianceDocument; getProfileBySlug: (slug: string) => any }) {
  const { createVersion, activateVersion } = useComplianceDocuments('website');
  const { data: versions } = useDocumentVersions(doc.id);
  const [newContent, setNewContent] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeVersion = versions?.find(v => v.status === 'active');
  const latestDraft = versions?.find(v => v.status === 'draft');

  useEffect(() => {
    if (activeVersion?.content_md && !prefilled) {
      setNewContent(activeVersion.content_md);
      setPrefilled(true);
    }
  }, [activeVersion, prefilled]);

  const hasChanges = newContent !== (activeVersion?.content_md || '');

  const docKey = doc.doc_key || '';
  const brand = BRANDS.find(b => docKey.endsWith(`_${b}`)) || '';
  const typeKey = docKey.replace(`_${brand}`, '');
  const typeLabel = DOC_TYPE_LABELS[typeKey] || typeKey;

  // Get company profile for this brand and render with placeholder replacement
  const profileSlug = BRAND_PROFILE_MAP[brand] || 'sot';
  const profile = getProfileBySlug(profileSlug);
  const renderedContent = activeVersion?.content_md
    ? renderComplianceMarkdown(activeVersion.content_md, profile)
    : '';
  const unresolvedPlaceholders = renderedContent ? findUnresolvedPlaceholders(renderedContent) : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            {doc.title}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
            <Badge variant={doc.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {doc.status === 'active' ? `v${doc.current_version} aktiv` : doc.status}
            </Badge>
            {unresolvedPlaceholders.length > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {unresolvedPlaceholders.length} offen
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Unresolved placeholder warning */}
        {unresolvedPlaceholders.length > 0 && (
          <div className="p-2 rounded border border-destructive/30 bg-destructive/5 text-xs text-destructive">
            <strong>Offene Platzhalter:</strong> {unresolvedPlaceholders.join(', ')}
          </div>
        )}

        {/* Kompakte Vorschau — aufklappbar, jetzt mit Platzhalter-Ersetzung */}
        {activeVersion && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground px-0 h-auto py-1"
              onClick={() => setPreviewOpen(!previewOpen)}
            >
              {previewOpen ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {previewOpen ? 'Vorschau ausblenden' : 'Vorschau anzeigen (wie auf der Website)'}
            </Button>
            {previewOpen && (
              <div className="p-4 rounded-lg border bg-muted/30 prose prose-sm max-w-none dark:prose-invert text-sm mt-1 max-h-[400px] overflow-y-auto">
                <ReactMarkdown>{renderedContent}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Editor — standardmäßig eingeklappt */}
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="text-xs">
            <Pencil className="h-3 w-3 mr-1" />
            {activeVersion ? 'Neue Version erstellen' : 'Erste Version erstellen'}
          </Button>
        ) : (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/10">
            <Textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Markdown-Inhalt des Rechtstexts…"
              className="min-h-[300px] font-mono text-xs"
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
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Abbrechen</Button>
              <Button
                size="sm"
                disabled={!newContent.trim() || createVersion.isPending}
                onClick={() => {
                  createVersion.mutate(
                    { documentId: doc.id, contentMd: newContent, changeNote: changeNote || undefined },
                    { onSuccess: () => { setChangeNote(''); setPrefilled(false); setEditing(false); } }
                  );
                }}
              >
                <Save className="h-3 w-3 mr-1" /> Draft speichern
              </Button>
            </div>
          </div>
        )}

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
  const { getProfileBySlug, isLoading: profilesLoading } = useComplianceCompany();

  if (isLoading || profilesLoading) return <LoadingState />;

  const grouped = BRANDS.reduce<Record<string, ComplianceDocument[]>>((acc, brand) => {
    const docs = documents.filter(d => (d.doc_key || '').endsWith(`_${brand}`));
    if (docs.length > 0) acc[brand] = docs;
    return acc;
  }, {});

  const ungrouped = documents.filter(d => !BRANDS.some(b => (d.doc_key || '').endsWith(`_${b}`)));

  return (
    <div className="space-y-6 mt-4">
      {Object.entries(grouped).map(([brand, docs]) => (
        <div key={brand} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{BRAND_LABELS[brand] || brand}</h3>
          {docs.map(doc => (
            <PublicPageCard key={doc.id} doc={doc} getProfileBySlug={getProfileBySlug} />
          ))}
        </div>
      ))}
      {ungrouped.map(doc => (
        <PublicPageCard key={doc.id} doc={doc} getProfileBySlug={getProfileBySlug} />
      ))}
      {documents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Keine Website-Legaltexte vorhanden.</p>
      )}
    </div>
  );
}
