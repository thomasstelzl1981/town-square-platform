/**
 * ComplianceDeskRouter — Zone 1 Compliance Desk
 * Legal Engine SSOT with 10-tab internal navigation.
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Scale, Building2, Globe, FileText, Layers, FileCheck, ShieldCheck, UserSearch, Trash2, Shield } from 'lucide-react';
import { ComplianceOverview } from './ComplianceOverview';
import { ComplianceCompanyProfile } from './ComplianceCompanyProfile';
import { CompliancePublicPages } from './CompliancePublicPages';
import { CompliancePortalTerms } from './CompliancePortalTerms';
import { ComplianceBundles } from './ComplianceBundles';
import { ComplianceAgreements } from './ComplianceAgreements';
import { ComplianceConsents } from './ComplianceConsents';
import { ComplianceDSAR } from './ComplianceDSAR';
import { ComplianceDeletion } from './ComplianceDeletion';
import { ComplianceAuditSecurity } from './ComplianceAuditSecurity';

const TABS = [
  { value: 'overview', label: 'Overview', icon: Scale },
  { value: 'company', label: 'Company Profile', icon: Building2 },
  { value: 'public-pages', label: 'Public Pages', icon: Globe },
  { value: 'portal-terms', label: 'Portal Terms', icon: FileText },
  { value: 'bundles', label: 'Bundles', icon: Layers },
  { value: 'agreements', label: 'Agreements', icon: FileCheck },
  { value: 'consents', label: 'Consents', icon: ShieldCheck },
  { value: 'dsar', label: 'DSAR', icon: UserSearch },
  { value: 'deletion', label: 'Deletion', icon: Trash2 },
  { value: 'audit', label: 'Audit & Security', icon: Shield },
] as const;

export default function ComplianceDeskRouter() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <PageShell fullWidth>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Desk</h1>
          <p className="text-sm text-muted-foreground">Legal Engine — Source of Truth für Rechtstexte, Consent & DSGVO</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><ComplianceOverview onNavigate={setActiveTab} /></TabsContent>
        <TabsContent value="company"><ComplianceCompanyProfile /></TabsContent>
        <TabsContent value="public-pages"><CompliancePublicPages /></TabsContent>
        <TabsContent value="portal-terms"><CompliancePortalTerms /></TabsContent>
        <TabsContent value="bundles"><ComplianceBundles /></TabsContent>
        <TabsContent value="agreements"><ComplianceAgreements /></TabsContent>
        <TabsContent value="consents"><ComplianceConsents /></TabsContent>
        <TabsContent value="dsar"><ComplianceDSAR /></TabsContent>
        <TabsContent value="deletion"><ComplianceDeletion /></TabsContent>
        <TabsContent value="audit"><ComplianceAuditSecurity /></TabsContent>
      </Tabs>
    </PageShell>
  );
}
