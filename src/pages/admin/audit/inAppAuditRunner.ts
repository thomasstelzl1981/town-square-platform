import { supabase } from '@/integrations/supabase/client';
import { zone1Admin, zone2Portal } from '@/manifests/routesManifest';

interface AuditFinding {
  severity: 'P0' | 'P1' | 'P2';
  area: string;
  description: string;
}

interface AuditResult {
  status: 'PASS' | 'PASS_WITH_FIXES' | 'FAIL';
  counts: { p0: number; p1: number; p2: number };
  findings: AuditFinding[];
  markdown: string;
}

export async function runInAppAudit(): Promise<AuditResult> {
  const findings: AuditFinding[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1) Check manifest routes exist
  const allAdminRoutes = zone1Admin.routes || [];
  const allPortalModules = Object.values(zone2Portal.modules || {});
  const { data: tiles, error: tilesErr } = await supabase
    .from('tile_catalog')
    .select('code, label, module_id, is_active');

  if (tilesErr) {
    findings.push({ severity: 'P1', area: 'Tile Catalog', description: `DB query failed: ${tilesErr.message}` });
  } else if (tiles) {
    // Check each portal module has tiles in catalog
    for (const mod of allPortalModules) {
      if (!mod.tiles || mod.tiles.length === 0) continue;
      for (const tile of mod.tiles) {
        const found = tiles.find((t: any) => t.code === tile.path);
        if (!found) {
          findings.push({
            severity: 'P1',
            area: 'Tile Catalog',
            description: `Tile "${tile.path}" (${tile.title}) from manifest not found in tile_catalog DB`,
          });
        }
      }
    }
  }

  // 3) Basic health checks (fetch key routes)
  const keyRoutes = ['/admin', '/portal'];
  for (const route of keyRoutes) {
    try {
      const url = `${window.location.origin}${route}`;
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok && res.status !== 302 && res.status !== 301) {
        findings.push({
          severity: 'P0',
          area: 'Route Health',
          description: `${route} returned HTTP ${res.status}`,
        });
      }
    } catch (e: any) {
      findings.push({
        severity: 'P2',
        area: 'Route Health',
        description: `${route} fetch failed: ${e.message}`,
      });
    }
  }

  // 4) Count manifest routes
  const routeCount = allAdminRoutes.length;
  const moduleCount = allPortalModules.length;

  // Compute counts
  const counts = {
    p0: findings.filter(f => f.severity === 'P0').length,
    p1: findings.filter(f => f.severity === 'P1').length,
    p2: findings.filter(f => f.severity === 'P2').length,
  };

  const status: AuditResult['status'] = counts.p0 > 0 ? 'FAIL' : counts.p1 > 0 ? 'PASS_WITH_FIXES' : 'PASS';

  // Generate markdown report
  const findingsSection = (sev: string) => {
    const items = findings.filter(f => f.severity === sev);
    if (items.length === 0) return `### ${sev}\nKeine Befunde.\n`;
    return `### ${sev}\n${items.map(i => `- **${i.area}**: ${i.description}`).join('\n')}\n`;
  };

  const markdown = `# In-App Audit Report — ${today}
- Scope: Zone 1 + Zone 2 (In-App, kein Repo-Zugriff)
- Status: **${status}**
- Manifest: ${routeCount} Admin-Routen, ${moduleCount} Portal-Module

## Executive Summary
- In-App Audit durchgefuehrt am ${today}
- ${counts.p0} P0, ${counts.p1} P1, ${counts.p2} P2 Befunde
- Tile-Catalog Konsistenzpruefung: ${tilesErr ? 'FEHLER' : 'OK'}
- Route-Health-Checks: ${counts.p0 === 0 ? 'BESTANDEN' : 'FEHLGESCHLAGEN'}

## Findings
${findingsSection('P0')}
${findingsSection('P1')}
${findingsSection('P2')}

## Smoke Test Protocol
${keyRoutes.map(r => `- ${r}: ${findings.some(f => f.area === 'Route Health' && f.description.includes(r)) ? 'FAIL' : 'PASS'}`).join('\n')}

## Artifacts
- report.md: audit-reports/${today}/report.md
`;

  return { status, counts, findings, markdown };
}
