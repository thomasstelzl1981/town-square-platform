/**
 * MOD-07: Dokumente Tab
 * Manages credit-worthiness documents (persistent, linked to applicant_profile)
 * object_type='applicant_profile'
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, Upload, FileText, CheckCircle, 
  AlertCircle, Loader2, IdCard, Wallet, 
  PiggyBank, CreditCard 
} from 'lucide-react';
import { DocumentUploadSection } from '@/components/finanzierung/DocumentUploadSection';

interface DocumentCategory {
  key: string;
  title: string;
  icon: React.ElementType;
  description: string;
  requiredDocs: string[];
}

const documentCategories: DocumentCategory[] = [
  {
    key: 'identitaet',
    title: 'Identität',
    icon: IdCard,
    description: 'Personalausweis, Reisepass, Meldebescheinigung',
    requiredDocs: ['Ausweiskopie', 'Meldebescheinigung'],
  },
  {
    key: 'einkommen',
    title: 'Einkommen',
    icon: Wallet,
    description: 'Gehaltsnachweise, Steuerbescheide, BWA',
    requiredDocs: ['Gehaltsnachweis (3 Monate)', 'Steuerbescheid'],
  },
  {
    key: 'vermoegen',
    title: 'Vermögen',
    icon: PiggyBank,
    description: 'Kontoauszüge, Depotauszüge, Immobilienwerte',
    requiredDocs: ['Eigenkapitalnachweis'],
  },
  {
    key: 'verpflichtungen',
    title: 'Verpflichtungen',
    icon: CreditCard,
    description: 'Laufende Kredite, Unterhalt, sonstige Verpflichtungen',
    requiredDocs: [],
  },
];

export default function DokumenteTab() {
  const { activeOrganization } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch persistent profile for document linking
  const { data: profile } = useQuery({
    queryKey: ['persistent-applicant-profile', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return null;

      const { data } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('tenant_id', activeOrganization.id)
        .is('finance_request_id', null)
        .limit(1)
        .maybeSingle();

      return data;
    },
    enabled: !!activeOrganization?.id,
  });

  // Fetch documents linked to applicant profile
  const { data: documents, isLoading } = useQuery({
    queryKey: ['applicant-documents', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !activeOrganization?.id) return [];

      const { data } = await supabase
        .from('document_links')
        .select(`
          id,
          document:documents(id, name, doc_type, created_at, size_bytes)
        `)
        .eq('tenant_id', activeOrganization.id)
        .eq('object_type', 'applicant_profile')
        .eq('object_id', profile.id);

      return data || [];
    },
    enabled: !!profile?.id && !!activeOrganization?.id,
  });

  // Count documents per category (simplified - would need doc_type mapping)
  const getDocsInCategory = (categoryKey: string) => {
    // TODO: Map doc_type to categories properly
    return documents?.filter(d => 
      d.document?.doc_type?.toLowerCase().includes(categoryKey)
    ).length || 0;
  };

  const totalDocs = documents?.length || 0;
  const requiredTotal = documentCategories.reduce((sum, c) => sum + c.requiredDocs.length, 0);
  const completionPercent = Math.min(100, Math.round((totalDocs / Math.max(1, requiredTotal)) * 100));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Bonitätsunterlagen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Dokumentenstatus</span>
              <span className="text-sm text-muted-foreground">
                {totalDocs} von ~{requiredTotal} Dokumenten
              </span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground">
            Diese Dokumente werden dauerhaft gespeichert und für alle Ihre Finanzierungsanfragen verwendet.
            Laden Sie hier Ihre Bonitätsunterlagen hoch.
          </p>
        </CardContent>
      </Card>

      {/* Document Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentCategories.map(category => {
          const Icon = category.icon;
          const docsCount = getDocsInCategory(category.key);
          const hasRequired = docsCount >= category.requiredDocs.length || category.requiredDocs.length === 0;

          return (
            <Card 
              key={category.key}
              className={`cursor-pointer transition-colors hover:border-primary ${
                activeCategory === category.key ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setActiveCategory(
                activeCategory === category.key ? null : category.key
              )}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${hasRequired ? 'bg-green-100' : 'bg-muted'}`}>
                    <Icon className={`h-6 w-6 ${hasRequired ? 'text-green-600' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{category.title}</h3>
                      {hasRequired ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline">
                        {docsCount} Dokumente
                      </Badge>
                      {category.requiredDocs.length > 0 && !hasRequired && (
                        <Badge variant="secondary">
                          {category.requiredDocs.length - docsCount} fehlen
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Section (when category selected) */}
      {activeCategory && profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dokumente hochladen: {documentCategories.find(c => c.key === activeCategory)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Dokument-Upload wird in Phase 5 voll integriert</p>
              <p className="text-sm">Ziel: object_type='applicant_profile', object_id='{profile.id.slice(0,8)}...'</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Uploads */}
      {documents && documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hochgeladene Dokumente ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.slice(0, 10).map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{doc.document?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.document?.doc_type || 'Nicht klassifiziert'}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.document?.size_bytes 
                      ? `${Math.round(doc.document.size_bytes / 1024)} KB`
                      : '–'
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
