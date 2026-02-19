/**
 * Tab 3: Public Pages — Website Legaltexte pro Brand
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText } from 'lucide-react';
import { StatusBadge, LoadingState } from '@/components/shared';
import { useComplianceDocuments, useDocumentVersions } from './useComplianceDocuments';

const BRANDS = ['kaufy', 'futureroom', 'sot', 'acquiary', 'tierservice'];
const DOC_TYPES = ['website_imprint', 'website_privacy'];
const DOC_TYPE_LABELS: Record<string, string> = { website_imprint: 'Impressum', website_privacy: 'Datenschutz' };

export function CompliancePublicPages() {
  const { documents, isLoading, createVersion, activateVersion } = useComplianceDocuments('website');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const { data: versions } = useDocumentVersions(selectedDoc);

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Website-Legaltexte nach Brand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Brand</th>
                  {DOC_TYPES.map(t => <th key={t} className="text-left p-2 font-medium">{DOC_TYPE_LABELS[t]}</th>)}
                </tr>
              </thead>
              <tbody>
                {BRANDS.map(brand => (
                  <tr key={brand} className="border-b hover:bg-muted/20">
                    <td className="p-2 font-medium capitalize">{brand}</td>
                    {DOC_TYPES.map(docType => {
                      const doc = documents.find(d => d.doc_key === `${docType}_${brand}`);
                      return (
                        <td key={docType} className="p-2">
                          {doc ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.status === 'active' ? 'default' : 'secondary'} className="text-xs">{doc.status}</Badge>
                              <span className="text-xs text-muted-foreground">v{doc.current_version}</span>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(doc.id)}>
                                    <Plus className="h-3 w-3" />
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
                                  <div className="flex gap-2 justify-end">
                                    <Button onClick={() => {
                                      createVersion.mutate({ documentId: doc.id, contentMd: newContent });
                                      setNewContent('');
                                    }}>
                                      Draft speichern
                                    </Button>
                                  </div>
                                  {versions && versions.length > 0 && (
                                    <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                                      <p className="text-sm font-medium">Versionen:</p>
                                      {versions.map(v => (
                                        <div key={v.id} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                                          <span>v{v.version} — {v.status}</span>
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
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
