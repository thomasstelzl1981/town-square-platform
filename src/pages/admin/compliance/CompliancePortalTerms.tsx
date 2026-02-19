/**
 * Tab 4: Portal Terms — Portal AGB/Privacy/Security Notice
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { useComplianceDocuments, useDocumentVersions } from './useComplianceDocuments';

export function CompliancePortalTerms() {
  const { documents, isLoading, createVersion, activateVersion } = useComplianceDocuments('portal');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const { data: versions } = useDocumentVersions(selectedDoc);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Portal-Rechtstexte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-muted-foreground">{doc.description} · v{doc.current_version}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>{doc.status}</Badge>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedDoc(doc.id); setNewContent(''); setChangeNote(''); }}>
                      <Plus className="h-3 w-3 mr-1" /> Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{doc.title} — Neue Version</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="Markdown-Inhalt..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <Input
                      value={changeNote}
                      onChange={e => setChangeNote(e.target.value)}
                      placeholder="Änderungsnotiz (optional)"
                      className="text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => {
                        createVersion.mutate({ documentId: doc.id, contentMd: newContent, changeNote: changeNote || undefined });
                        setNewContent('');
                        setChangeNote('');
                      }}>
                        Draft speichern
                      </Button>
                    </div>
                    {versions && versions.length > 0 && (
                      <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                        <p className="text-sm font-medium">Versionen:</p>
                        {versions.map(v => (
                          <div key={v.id} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                            <div>
                              <span>v{v.version} — {v.status}</span>
                              {v.change_note && <span className="ml-2 text-muted-foreground">({v.change_note})</span>}
                            </div>
                            {v.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => activateVersion.mutate({ documentId: doc.id, versionId: v.id, version: v.version })}>
                                Aktivieren
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
          {documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Keine Portal-Rechtstexte vorhanden.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
