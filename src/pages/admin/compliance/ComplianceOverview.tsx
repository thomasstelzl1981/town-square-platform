/**
 * Tab 1: Overview — Dashboard + Go-Live Checklist
 */
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, FileText, UserSearch, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared';
import { useComplianceDocuments } from './useComplianceDocuments';
import { useComplianceCompany } from './useComplianceCompany';
import { useDSARRequests, useDeletionRequests } from './useComplianceCases';


interface Props { onNavigate: (tab: string) => void; }

export function ComplianceOverview({ onNavigate }: Props) {
  const { profiles, getProfileBySlug } = useComplianceCompany();
  const profile = getProfileBySlug('sot');
  const { documents } = useComplianceDocuments();
  const { requests: dsarRequests } = useDSARRequests();
  const { requests: deletionRequests } = useDeletionRequests();

  const activeDocs = documents.filter(d => d.status === 'active').length;
  const draftDocs = documents.filter(d => d.status === 'draft').length;
  const openDSAR = dsarRequests.filter(r => r.status !== 'closed').length;
  const openDeletion = deletionRequests.filter(r => r.status !== 'closed' && r.status !== 'executed').length;

  const companyComplete = !!(profile?.company_name && profile?.address_line1 && profile?.city && profile?.email);
  const portalAgbActive = documents.some(d => d.doc_key === 'portal_agb' && d.status === 'active');
  const portalPrivacyActive = documents.some(d => d.doc_key === 'portal_privacy' && d.status === 'active');
  const allBrandsImprint = ['kaufy', 'futureroom', 'sot', 'acquiary', 'tierservice'].every(brand =>
    documents.some(d => d.doc_key === `website_imprint_${brand}` && d.status === 'active')
  );
  const checklist = [
    { label: 'Company Profile vollständig', done: companyComplete, tab: 'company' },
    { label: 'Portal AGB aktiv', done: portalAgbActive, tab: 'portal-terms' },
    { label: 'Portal Datenschutz aktiv', done: portalPrivacyActive, tab: 'portal-terms' },
    { label: 'Impressum für alle Brands', done: allBrandsImprint, tab: 'public-pages' },
  ];
  const score = checklist.filter(c => c.done).length;

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Aktive Dokumente" value={activeDocs} icon={FileText} subtitle={`${draftDocs} Entwürfe`} />
        <KPICard label="Offene DSAR" value={openDSAR} icon={UserSearch} subtitle="Auskunftsanfragen" />
        <KPICard label="Offene Löschanträge" value={openDeletion} icon={Trash2} subtitle="Art. 17 DSGVO" />
        <KPICard label="Go-Live Score" value={`${score}/${checklist.length}`} icon={Shield} subtitle={score === checklist.length ? '✅ Bereit' : '⚠️ Offen'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Go-Live Legal Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  {item.done
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <XCircle className="h-5 w-5 text-destructive" />
                  }
                  <span className={item.done ? 'text-muted-foreground' : 'font-medium'}>{item.label}</span>
                </div>
                {!item.done && (
                  <Button variant="ghost" size="sm" onClick={() => onNavigate(item.tab)}>
                    Beheben <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
