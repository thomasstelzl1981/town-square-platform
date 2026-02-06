import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Folder, FileText, Image, Eye, Paperclip, ChevronRight, ChevronDown,
  Upload, FolderOpen
} from 'lucide-react';
import { formatFileSize } from '@/lib/formatters';
import { useAuth } from '@/contexts/AuthContext';

export interface SelectedDocument {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  category?: string;
}

interface DMSDocumentSelectorProps {
  propertyId: string;
  selectedDocuments: SelectedDocument[];
  onSelectionChange: (documents: SelectedDocument[]) => void;
}

interface DMSDocument {
  id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  file_path: string | null;
  doc_type: string | null;
}

// Relevant folder categories for renovation
const RELEVANT_CATEGORIES = [
  { key: 'grundriss', label: 'Grundrisse', icon: FileText, docTypes: ['grundriss', 'floorplan'] },
  { key: 'foto', label: 'Fotos', icon: Image, docTypes: ['foto', 'photo', 'bild'] },
  { key: 'flaeche', label: 'Wohnfläche', icon: FileText, docTypes: ['wohnflaeche', 'flaeche'] },
];

export function DMSDocumentSelector({
  propertyId,
  selectedDocuments,
  onSelectionChange,
}: DMSDocumentSelectorProps) {
  const { activeTenantId } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['grundriss', 'foto']));
  
  // Fetch documents linked to property via document_links
  const { data: documents, isLoading } = useQuery({
    queryKey: ['property_documents_for_scope', propertyId, activeTenantId],
    queryFn: async () => {
      if (!activeTenantId || !propertyId) return [];
      
      // Get documents linked to this property
      const { data, error } = await supabase
        .from('document_links')
        .select(`
          document:documents(
            id,
            name,
            mime_type,
            size_bytes,
            file_path,
            doc_type
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'property')
        .eq('object_id', propertyId);
      
      if (error) throw error;
      
      // Flatten and filter valid documents
      const docs: DMSDocument[] = [];
      for (const link of data || []) {
        const doc = link.document as unknown as DMSDocument;
        if (doc && doc.id) {
          docs.push(doc);
        }
      }
      
      return docs;
    },
    enabled: !!propertyId && !!activeTenantId,
  });
  
  // Group documents by category
  const groupedDocs = RELEVANT_CATEGORIES.map(category => {
    const categoryDocs = (documents || []).filter(doc => {
      const mimeType = doc.mime_type?.toLowerCase() || '';
      const docType = doc.doc_type?.toLowerCase() || '';
      const name = doc.name.toLowerCase();
      
      // Check if document matches this category
      if (category.key === 'foto') {
        return mimeType.startsWith('image/') || 
               category.docTypes.some(t => docType.includes(t) || name.includes(t));
      }
      return category.docTypes.some(t => docType.includes(t) || name.includes(t));
    });
    
    return {
      ...category,
      documents: categoryDocs,
      count: categoryDocs.length,
    };
  });
  
  // Also show "other" documents not matching any category
  const matchedIds = new Set(groupedDocs.flatMap(g => g.documents.map(d => d.id)));
  const otherDocs = (documents || []).filter(d => !matchedIds.has(d.id));
  
  // Toggle category expansion
  const toggleCategory = (key: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Toggle document selection
  const toggleDocument = (doc: DMSDocument) => {
    const isSelected = selectedDocuments.some(d => d.id === doc.id);
    
    if (isSelected) {
      onSelectionChange(selectedDocuments.filter(d => d.id !== doc.id));
    } else {
      onSelectionChange([
        ...selectedDocuments,
        {
          id: doc.id,
          name: doc.name,
          path: doc.file_path || '',
          mimeType: doc.mime_type || 'application/octet-stream',
          size: doc.size_bytes || 0,
          category: doc.doc_type || undefined,
        },
      ]);
    }
  };
  
  // Get file icon
  const getFileIcon = (mimeType?: string | null) => {
    if (mimeType?.startsWith('image/')) return Image;
    return FileText;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verfügbare Unterlagen aus DMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Verfügbare Unterlagen aus DMS</CardTitle>
          {selectedDocuments.length > 0 && (
            <Badge variant="secondary">
              {selectedDocuments.length} ausgewählt
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {groupedDocs.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.has(category.key);
          
          return (
            <div key={category.key} className="border rounded-lg">
              {/* Category Header */}
              <button
                className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                onClick={() => toggleCategory(category.key)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">{category.label}</span>
                <Badge variant="outline" className="ml-auto">
                  {category.count}
                </Badge>
              </button>
              
              {/* Category Contents */}
              {isExpanded && (
                <div className="border-t px-3 py-2 space-y-1 bg-muted/30">
                  {category.documents.length === 0 ? (
                    <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
                      <span>Keine Dokumente vorhanden</span>
                      <Button variant="ghost" size="sm">
                        <Upload className="h-3 w-3 mr-1" />
                        Hochladen
                      </Button>
                    </div>
                  ) : (
                    category.documents.map((doc) => {
                      const FileIcon = getFileIcon(doc.mime_type);
                      const isSelected = selectedDocuments.some(d => d.id === doc.id);
                      
                      return (
                        <div 
                          key={doc.id}
                          className={`
                            flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
                            ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}
                          `}
                          onClick={() => toggleDocument(doc)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleDocument(doc)}
                          />
                          <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size_bytes || 0)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Open preview
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) toggleDocument(doc);
                          }}>
                            <Paperclip className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Other documents */}
        {otherDocs.length > 0 && (
          <div className="border rounded-lg">
            <button
              className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory('other')}
            >
              {expandedCategories.has('other') ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Sonstige Dokumente</span>
              <Badge variant="outline" className="ml-auto">
                {otherDocs.length}
              </Badge>
            </button>
            {expandedCategories.has('other') && (
              <div className="border-t px-3 py-2 space-y-1 bg-muted/30">
                {otherDocs.map((doc) => {
                  const FileIcon = getFileIcon(doc.mime_type);
                  const isSelected = selectedDocuments.some(d => d.id === doc.id);
                  
                  return (
                    <div 
                      key={doc.id}
                      className={`
                        flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
                        ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}
                      `}
                      onClick={() => toggleDocument(doc)}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleDocument(doc)} />
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(doc.size_bytes || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Empty state */}
        {(!documents || documents.length === 0) && (
          <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
            <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Dokumente für dieses Objekt gefunden</p>
            <Button variant="outline" size="sm" className="mt-3">
              <Upload className="h-3 w-3 mr-1" />
              Dokumente hochladen
            </Button>
          </div>
        )}
        
        {/* Selected Documents Summary */}
        {selectedDocuments.length > 0 && (
          <div className="pt-3 border-t mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              💡 Diese Dokumente werden als Links in der Ausschreibung angeboten:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedDocuments.map((doc) => (
                <Badge key={doc.id} variant="secondary" className="text-xs">
                  {doc.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
