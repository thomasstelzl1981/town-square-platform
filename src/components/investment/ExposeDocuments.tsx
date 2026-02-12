/**
 * ExposeDocuments — Dokumenten-Download im Investment-Exposé
 * 
 * Zeigt freigegebene Dokumente basierend auf expose_visibility:
 * - public: Sichtbar für alle (KAUFY)
 * - partner: Sichtbar für Partner-Netzwerk
 * - internal: Nur intern (nicht angezeigt)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getCachedSignedUrl } from '@/lib/imageCache';

interface ExposeDocument {
  id: string;
  name: string;
  document_type: string;
  file_path: string;
  expose_visibility: string;
}

interface ExposeDocumentsProps {
  propertyId: string;
  viewerType: 'public' | 'partner' | 'internal';
  className?: string;
}

export function ExposeDocuments({ 
  propertyId, 
  viewerType,
  className 
}: ExposeDocumentsProps) {
  // Fetch documents based on viewer type
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['expose-documents', propertyId, viewerType],
    queryFn: async (): Promise<ExposeDocument[]> => {
      // Build visibility filter based on viewer type
      const visibilityFilter = viewerType === 'internal' 
        ? ['internal', 'partner', 'public']
        : viewerType === 'partner'
          ? ['partner', 'public']
          : ['public'];

      const { data, error } = await supabase
        .from('document_links')
        .select(`
          id,
          expose_visibility,
          documents (
            id,
            name,
            doc_type,
            detected_type,
            file_path,
            mime_type
          )
        `)
        .eq('object_type', 'property')
        .eq('object_id', propertyId);

      if (error) {
        console.error('Documents query error:', error);
        return [];
      }

      // Filter results client-side to avoid complex Supabase query issues
      const filtered = (data || [])
        .filter((link: any) => {
          // Must have documents
          if (!link.documents) return false;
          // Must match visibility filter
          if (!visibilityFilter.includes(link.expose_visibility || 'internal')) return false;
          // Exclude images
          if (link.documents.mime_type?.startsWith('image/')) return false;
          return true;
        })
        .map((link: any) => ({
          id: link.documents.id,
          name: link.documents.name,
          document_type: link.documents.doc_type || link.documents.detected_type || 'other',
          file_path: link.documents.file_path,
          expose_visibility: link.expose_visibility || 'internal',
        }));

      return filtered;
    },
    enabled: !!propertyId,
  });

  const handleDownload = async (doc: ExposeDocument) => {
    try {
      const url = await getCachedSignedUrl(doc.file_path, 'tenant-documents', 60);
      if (!url) throw new Error('Keine Download-URL erhalten');

      window.open(url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download fehlgeschlagen');
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'energy_certificate': 'Energieausweis',
      'land_registry': 'Grundbuchauszug',
      'floor_plan': 'Grundriss',
      'division_declaration': 'Teilungserklärung',
      'building_insurance': 'Gebäudeversicherung',
      'rent_roll': 'Mieterliste',
      'property_tax': 'Grundsteuerbescheid',
      'other': 'Sonstiges',
    };
    return labels[type] || type;
  };

  const getVisibilityBadge = (visibility: string) => {
    if (visibility === 'public') {
      return <Badge variant="outline" className="text-xs">Öffentlich</Badge>;
    }
    if (visibility === 'partner') {
      return <Badge variant="secondary" className="text-xs">Partner</Badge>;
    }
    return null;
  };

  // Group documents by category
  const groupedDocs = documents.reduce((acc, doc) => {
    const category = ['energy_certificate'].includes(doc.document_type) 
      ? 'Energie'
      : ['land_registry', 'division_declaration'].includes(doc.document_type)
        ? 'Rechtliches'
        : 'Sonstiges';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, ExposeDocument[]>);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Keine freigegebenen Dokumente vorhanden.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedDocs).map(([category, docs]) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {docs.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDocTypeLabel(doc.document_type)}
                      </p>
                    </div>
                    {viewerType === 'internal' && getVisibilityBadge(doc.expose_visibility)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
