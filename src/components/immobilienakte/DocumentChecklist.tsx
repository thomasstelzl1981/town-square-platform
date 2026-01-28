import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentStatus {
  docType: string;
  label: string;
  status: 'complete' | 'missing' | 'review';
  path?: string;
}

interface DocumentChecklistProps {
  documents: DocumentStatus[];
  completionPercent?: number;
}

const defaultDocuments: DocumentStatus[] = [
  { docType: 'DOC_LEASE_CONTRACT', label: 'Mietvertrag', status: 'missing' },
  { docType: 'DOC_ENERGY_CERT', label: 'Energieausweis', status: 'missing' },
  { docType: 'DOC_FLOORPLAN', label: 'Grundriss', status: 'missing' },
  { docType: 'DOC_PURCHASE_CONTRACT', label: 'Kaufvertrag', status: 'missing' },
  { docType: 'DOC_LAND_REGISTER', label: 'Grundbuchauszug', status: 'missing' },
  { docType: 'DOC_DIVISION_DECLARATION', label: 'Teilungserklärung', status: 'missing' },
  { docType: 'DOC_WEG_BUDGET_PLAN', label: 'Wirtschaftsplan', status: 'missing' },
  { docType: 'DOC_WEG_ANNUAL_STATEMENT', label: 'WEG-Abrechnung', status: 'missing' },
  { docType: 'DOC_INSURANCE_BUILDING', label: 'Gebäudeversicherung', status: 'missing' },
  { docType: 'DOC_NK_STATEMENT', label: 'NK-Abrechnung', status: 'missing' },
  { docType: 'DOC_LOAN_BUCKET', label: 'Darlehensunterlagen', status: 'missing' },
];

export function DocumentChecklist({
  documents = defaultDocuments,
  completionPercent,
}: DocumentChecklistProps) {
  const complete = documents.filter(d => d.status === 'complete').length;
  const review = documents.filter(d => d.status === 'review').length;
  const percent = completionPercent ?? Math.round((complete / documents.length) * 100);

  const getIcon = (status: DocumentStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'review':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dokumente
          </span>
          <span className={cn(
            "text-sm font-normal",
            percent >= 80 ? "text-green-600" : percent >= 50 ? "text-amber-500" : "text-muted-foreground"
          )}>
            {percent}% vollständig
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {documents.map((doc) => (
            <div
              key={doc.docType}
              className={cn(
                "flex items-center gap-2 py-1 px-2 rounded text-sm",
                doc.status === 'complete' && "bg-green-50 dark:bg-green-950/20",
                doc.status === 'review' && "bg-amber-50 dark:bg-amber-950/20"
              )}
            >
              {getIcon(doc.status)}
              <span className={cn(
                doc.status === 'missing' && "text-muted-foreground"
              )}>
                {doc.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{complete} vorhanden</span>
          {review > 0 && <span className="text-amber-500">{review} zu prüfen</span>}
          <span>{documents.length - complete - review} fehlen</span>
        </div>
      </CardContent>
    </Card>
  );
}
