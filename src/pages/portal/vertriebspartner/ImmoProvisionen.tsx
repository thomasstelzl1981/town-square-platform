/**
 * ImmoProvisionen — Provisionsvereinbarung für Immomanager (MOD-09)
 */

import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ManagerProvisionen } from '@/components/shared/ManagerProvisionen';
import { MANAGER_COMMISSION_CONFIGS } from '@/engines/provision/spec';

export default function ImmoProvisionen() {
  return (
    <PageShell>
      <ModulePageHeader
        title="Provisionen"
        description="Ihre Provisionsvereinbarung mit System of a Town"
      />
      <ManagerProvisionen config={MANAGER_COMMISSION_CONFIGS.immo} />
    </PageShell>
  );
}
