/**
 * ImmoSystemgebuehr — Systemgebühr-Vereinbarung für Immomanager (MOD-09)
 */

import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ManagerSystemgebuehr } from '@/components/shared/ManagerSystemgebuehr';
import { SYSTEM_FEE_CONFIGS } from '@/engines/provision/spec';

export default function ImmoSystemgebuehr() {
  return (
    <PageShell>
      <ModulePageHeader
        title="Systemgebühr"
        description="Ihre erfolgsabhängige Systemgebühr-Vereinbarung mit System of a Town"
      />
      <ManagerSystemgebuehr config={SYSTEM_FEE_CONFIGS.immo} />
    </PageShell>
  );
}
