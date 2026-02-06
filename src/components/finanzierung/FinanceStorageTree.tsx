/**
 * MOD-07: Finance Storage Tree
 * Displays folder structure for creditworthiness + request documents
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, ChevronDown, Folder, FolderOpen, 
  FileText, User, Building, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinanceStorageTreeProps {
  profileId?: string | null;
  requestId?: string | null;
  requestLabel?: string | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

interface TreeNode {
  id: string;
  name: string;
  node_type: 'folder' | 'file';
  parent_id: string | null;
  doc_count?: number;
  children?: TreeNode[];
}

// Static folder structure for creditworthiness documents
const BONITÄT_FOLDERS = [
  { id: 'bon-identity', name: '01_Identität', category: 'identity' },
  { id: 'bon-income', name: '02_Einkommen', category: 'income' },
  { id: 'bon-assets', name: '03_Vermögen', category: 'assets' },
  { id: 'bon-liabilities', name: '04_Verpflichtungen', category: 'liabilities' },
  { id: 'bon-retirement', name: '05_Altersvorsorge', category: 'retirement' },
];

// Static folder structure for request documents
const REQUEST_FOLDERS = [
  { id: 'req-expose', name: '01_Exposé', category: 'property' },
  { id: 'req-legal', name: '02_Rechtliches', category: 'property' },
  { id: 'req-plans', name: '03_Pläne', category: 'property' },
  { id: 'req-photos', name: '04_Fotos', category: 'property' },
];

export function FinanceStorageTree({
  profileId,
  requestId,
  requestLabel,
  selectedNodeId,
  onSelectNode,
}: FinanceStorageTreeProps) {
  const { activeTenantId } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bonität', 'request']));

  // Fetch document counts per category for profile
  const { data: profileDocCounts } = useQuery({
    queryKey: ['profile-doc-counts', profileId],
    queryFn: async () => {
      if (!profileId || !activeTenantId) return {};
      
      const { data } = await supabase
        .from('document_links')
        .select('document:documents(doc_type)')
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'applicant_profile')
        .eq('object_id', profileId);

      const counts: Record<string, number> = {};
      (data || []).forEach(d => {
        const docType = d.document?.doc_type;
        if (docType) {
          // Map doc_type to category
          const category = getDocTypeCategory(docType);
          counts[category] = (counts[category] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!profileId && !!activeTenantId,
  });

  // Fetch document counts for request
  const { data: requestDocCounts } = useQuery({
    queryKey: ['request-doc-counts', requestId],
    queryFn: async () => {
      if (!requestId || !activeTenantId) return {};
      
      const { data } = await supabase
        .from('document_links')
        .select('document:documents(doc_type)')
        .eq('tenant_id', activeTenantId)
        .eq('object_type', 'finance_request')
        .eq('object_id', requestId);

      let total = 0;
      (data || []).forEach(() => total++);
      return { property: total };
    },
    enabled: !!requestId && !!activeTenantId,
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const isExpanded = (section: string) => expandedSections.has(section);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Dokumentenstruktur
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {/* Bonitätsunterlagen Section */}
        <div>
          <button
            onClick={() => toggleSection('bonität')}
            className="flex items-center gap-2 w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            {isExpanded('bonität') ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Bonitätsunterlagen</span>
            <Badge variant="outline" className="ml-auto text-xs">
              permanent
            </Badge>
          </button>

          {isExpanded('bonität') && (
            <div className="ml-6 mt-1 space-y-0.5">
              {BONITÄT_FOLDERS.map(folder => {
                const count = profileDocCounts?.[folder.category] || 0;
                const nodeId = `profile:${folder.id}`;
                const isSelected = selectedNodeId === nodeId;

                return (
                  <button
                    key={folder.id}
                    onClick={() => onSelectNode(isSelected ? null : nodeId)}
                    className={cn(
                      "flex items-center gap-2 w-full py-1 px-2 rounded-md transition-colors",
                      isSelected 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    {isSelected ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-left">{folder.name}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Objektunterlagen Section (if request exists) */}
        {requestId && (
          <div>
            <button
              onClick={() => toggleSection('request')}
              className="flex items-center gap-2 w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              {isExpanded('request') ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Building className="h-4 w-4 text-primary" />
              <span className="font-medium truncate flex-1 text-left">
                {requestLabel || 'Objektunterlagen'}
              </span>
              <Badge variant="outline" className="text-xs ml-1">
                Anfrage
              </Badge>
            </button>

            {isExpanded('request') && (
              <div className="ml-6 mt-1 space-y-0.5">
                {REQUEST_FOLDERS.map(folder => {
                  const nodeId = `request:${requestId}:${folder.id}`;
                  const isSelected = selectedNodeId === nodeId;
                  const count = folder.id === 'req-expose' ? (requestDocCounts?.property || 0) : 0;

                  return (
                    <button
                      key={folder.id}
                      onClick={() => onSelectNode(isSelected ? null : nodeId)}
                      className={cn(
                        "flex items-center gap-2 w-full py-1 px-2 rounded-md transition-colors",
                        isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      {isSelected ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-left">{folder.name}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!requestId && (
          <p className="text-xs text-muted-foreground pl-2 py-2">
            Erstellen Sie eine Anfrage, um Objektunterlagen hochzuladen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to map doc_type to category
function getDocTypeCategory(docType: string): string {
  if (docType.includes('ID_CARD') || docType.includes('PASSPORT')) return 'identity';
  if (docType.includes('PAYSLIP') || docType.includes('TAX') || docType.includes('BWA') || docType.includes('ANNUAL')) return 'income';
  if (docType.includes('BANK') || docType.includes('INSURANCE') || docType.includes('BUILDING_SOCIETY') || docType.includes('GIFT')) return 'assets';
  if (docType.includes('LOAN') || docType.includes('CREDIT') || docType.includes('GUARANTEE') || docType.includes('ALIMONY')) return 'liabilities';
  if (docType.includes('PENSION')) return 'retirement';
  return 'property';
}

export default FinanceStorageTree;
