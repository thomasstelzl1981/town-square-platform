/**
 * MOD-07: Document Checklist Panel
 * Displays category-grouped checklist with status indicators
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Circle, Upload, Download, 
  IdCard, Wallet, PiggyBank, CreditCard, 
  Building, Heart 
} from 'lucide-react';
import type { ChecklistItem, UploadedDoc } from './FinanceDocumentsManager';

interface DocumentChecklistPanelProps {
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
  uploadedDocs: UploadedDoc[];
  onUploadClick: (docType: string) => void;
  employmentType?: string;
  showMOD04Import?: boolean;
  onMOD04Import?: () => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  identity: IdCard,
  income: Wallet,
  assets: PiggyBank,
  liabilities: CreditCard,
  retirement: Heart,
  property: Building,
};

const categoryLabels: Record<string, string> = {
  identity: 'Identität',
  income: 'Einkommen',
  assets: 'Vermögen',
  liabilities: 'Verpflichtungen',
  retirement: 'Altersvorsorge',
  property: 'Objektunterlagen',
};

export function DocumentChecklistPanel({
  title,
  subtitle,
  items,
  uploadedDocs,
  onUploadClick,
  employmentType,
  showMOD04Import,
  onMOD04Import,
}: DocumentChecklistPanelProps) {
  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  // Check if doc_type is uploaded
  const isUploaded = (docType: string) => {
    return uploadedDocs.some(d => d.doc_type === docType);
  };

  // Get uploaded doc name for a type
  const getUploadedDocName = (docType: string) => {
    const doc = uploadedDocs.find(d => d.doc_type === docType);
    return doc?.name;
  };

  const categories = Object.keys(groupedItems);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {showMOD04Import && onMOD04Import && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMOD04Import}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Aus Portfolio
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map(category => {
          const Icon = categoryIcons[category] || Building;
          const categoryItems = groupedItems[category];
          const uploadedCount = categoryItems.filter(i => isUploaded(i.doc_type)).length;
          const requiredCount = categoryItems.filter(i => i.is_required).length;
          const allRequiredUploaded = categoryItems
            .filter(i => i.is_required)
            .every(i => isUploaded(i.doc_type));

          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{categoryLabels[category]}</span>
                <Badge 
                  variant={allRequiredUploaded ? 'default' : 'secondary'} 
                  className="ml-auto text-xs"
                >
                  {uploadedCount}/{categoryItems.length}
                </Badge>
              </div>

              {/* Category Items */}
              <div className="space-y-1.5 pl-6">
                {categoryItems.map(item => {
                  const uploaded = isUploaded(item.doc_type);
                  const docName = getUploadedDocName(item.doc_type);

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-sm ${
                        uploaded 
                          ? 'bg-green-500/10 text-foreground' 
                          : item.is_required 
                            ? 'bg-amber-500/10' 
                            : 'bg-muted/30'
                      }`}
                    >
                      {uploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className={`h-4 w-4 flex-shrink-0 ${
                          item.is_required ? 'text-amber-500' : 'text-muted-foreground'
                        }`} />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={uploaded ? 'text-foreground' : 'text-muted-foreground'}>
                            {item.label}
                          </span>
                          {item.is_required && !uploaded && (
                            <Badge variant="outline" className="text-xs py-0 h-4 text-amber-600 border-amber-300">
                              Pflicht
                            </Badge>
                          )}
                        </div>
                        {uploaded && docName && (
                          <p className="text-xs text-muted-foreground truncate">
                            {docName}
                          </p>
                        )}
                      </div>

                      {!uploaded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() => onUploadClick(item.doc_type)}
                        >
                          <Upload className="h-3 w-3" />
                          Hochladen
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Checklisten-Einträge vorhanden
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentChecklistPanel;
