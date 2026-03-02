

## Überarbeiteter GitHub Codex Prompt

Der Prompt weist Codex an, die Ergebnisse als `spec/audit/codex-deep-audit-2026-03-02.md` im Repo abzuspeichern. Da GitHub-Änderungen automatisch zu Lovable synchronisiert werden, kann ich die Datei danach direkt mit `read_file` lesen und auswerten.

---

```text
# ANALYSIS ONLY — Deep System Audit

## OUTPUT INSTRUCTIONS (CRITICAL)

- Do NOT fix any code. Do NOT create pull requests with code fixes.
- Your ONLY deliverable is a single NEW file committed to the repo:
  
  spec/audit/codex-deep-audit-2026-03-02.md

- The file MUST contain ALL findings as markdown tables grouped by 
  the 10 categories below.
- For EVERY category: run the actual searches described. If zero 
  findings, write "0 findings" with the exact search commands you ran.
- Minimum effort per category: at least 3 different grep/search patterns.
- Expected runtime: 10-15 minutes. If you finish in under 5 minutes, 
  you skipped sections.

---

## 1. DEAD CODE DETECTION

Search for all exported functions, types, interfaces, and constants 
that are NEVER imported or referenced anywhere else in the codebase.

Search commands to run:
  grep -r "export function" src/ --include="*.ts" --include="*.tsx" -h | sort
  grep -r "export const" src/ --include="*.ts" --include="*.tsx" -h | sort
  grep -r "export interface" src/ --include="*.ts" --include="*.tsx" -h | sort
  grep -r "export type" src/ --include="*.ts" --include="*.tsx" -h | sort

For EACH export found, search if it's imported anywhere:
  grep -r "<export_name>" src/ --include="*.ts" --include="*.tsx" -l

Focus directories:
- src/engines/** (all 15 engines)
- src/hooks/**
- src/manifests/**
- src/goldenpath/**
- src/config/**
- src/components/shared/**

Output table: | File | Export Name | Type (fn/const/type/interface) | Import Count |

Only list exports with Import Count = 0.

---

## 2. TYPE SAFETY VIOLATIONS

Search for ALL occurrences of:
  grep -rn "as any" src/ --include="*.ts" --include="*.tsx"
  grep -rn "as never" src/ --include="*.ts" --include="*.tsx"
  grep -rn "@ts-ignore" src/ --include="*.ts" --include="*.tsx"
  grep -rn "@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
  grep -rn "eslint-disable" src/ --include="*.ts" --include="*.tsx"

Output table: | File | Line | Pattern | Context (surrounding code) | Severity |

Severity: P0 if in src/engines/** or supabase/functions/**. P1 otherwise.

---

## 3. ENGINE ↔ CRON CONSISTENCY

Compare each Edge Function cron against its client-side engine:

| Edge Function | Client Engine |
|---------------|---------------|
| supabase/functions/sot-slc-lifecycle/index.ts | src/engines/slc/ |
| supabase/functions/sot-tenancy-lifecycle/index.ts | src/engines/tenancyLifecycle/ |
| supabase/functions/sot-rent-arrears-check/index.ts | src/engines/tenancyLifecycle/ |
| supabase/functions/sot-msv-reminder-check/index.ts | (find counterpart) |
| supabase/functions/sot-rent-match/index.ts | src/engines/kontoMatch/ |

For each pair, check:
- Threshold values (grep for numbers like 0.5, 0.8, 0.9, 0.95)
- Duplicated formulas (same calculation in both files)
- Error handling differences
- Version strings in comments/headers

Output table: | Edge Function | Engine File | Finding | Severity |

---

## 4. QUERY PERFORMANCE (N+1 PATTERNS)

Find Supabase queries inside loops:
  grep -rn "supabase\.from\|\.select(\|\.insert(\|\.update(\|\.delete(" src/ --include="*.ts" --include="*.tsx" -B5 | grep -B5 "\.map(\|\.forEach(\|for \|for(\|while("

Also search in edge functions:
  grep -rn "supabase\.from\|\.select(\|\.insert(\|\.update(\|\.delete(" supabase/functions/ --include="*.ts" -B5 | grep -B5 "\.map(\|\.forEach(\|for \|for(\|while("

Search for queries in render functions (outside useEffect/useQuery):
  grep -rn "supabase\.from" src/components/ --include="*.tsx" src/pages/ --include="*.tsx"

Output table: | File | Line | Query | Loop Type | Severity |

---

## 5. UNUSED DEPENDENCIES

Cross-reference package.json dependencies with imports:
  For each dependency in package.json "dependencies":
    grep -r "<package-name>" src/ --include="*.ts" --include="*.tsx" -l
    grep -r "<package-name>" supabase/ --include="*.ts" -l

List any package with 0 import hits.

Output table: | Package | Version | Import Count | Verdict |

---

## 6. MANIFEST ↔ ROUTING CONSISTENCY

Read and cross-reference:
- src/manifests/routesManifest.ts (all TileDefinitions)
- src/router/Zone1Router.tsx
- src/router/Zone2Router.tsx
- src/router/Zone3Router.tsx
- src/manifests/areaConfig.ts

Check:
- Every moduleCode in routesManifest has a route in Zone2Router
- Every zone3Website has a route in Zone3Router
- No orphan routes (routes without manifest entries)
- Tile counts: manifest tiles[] length vs actual sub-routes

Output table: | Module/Site | Manifest Tiles | Router Routes | Match? | Issue |

---

## 7. GOLDEN PATH COMPLETENESS

Read src/manifests/goldenPathProcesses.ts and for each process check:
- Has on_timeout, on_rejected, on_error in fail states?
- Has all 6 compliance fields?
- Has matching context resolver in src/goldenpath/?

  grep -rn "on_timeout\|on_rejected\|on_error" src/manifests/goldenPathProcesses.ts
  ls src/goldenpath/registry/

Output table: | GP-ID | Module | Fail States | Compliance Complete | Resolver Exists |

---

## 8. CROSS-ZONE IMPORT VIOLATIONS

Check strict zone separation:
  # Zone 1 components importing Zone 2
  grep -rn "from.*components/stammdaten\|from.*components/office\|from.*components/dms\|from.*components/immobilien\|from.*components/msv\|from.*components/verkauf\|from.*components/finanzierung\|from.*components/investments\|from.*components/vertriebspartner\|from.*components/leads\|from.*components/finanzierungsmanager\|from.*components/akquise\|from.*components/projekte\|from.*components/communication\|from.*components/fortbildung\|from.*components/services\|from.*components/cars\|from.*components/finanzanalyse\|from.*components/photovoltaik\|from.*components/miety\|from.*components/petmanager" src/components/armstrong/ src/pages/admin/ --include="*.ts" --include="*.tsx"

  # Zone 3 importing Zone 2
  grep -rn "from.*components/stammdaten\|from.*components/armstrong" src/pages/zone3/ src/components/zone3/ src/components/listings/ --include="*.ts" --include="*.tsx"

  # Zone 2 importing Zone 1
  grep -rn "from.*components/armstrong" src/pages/portal/ --include="*.ts" --include="*.tsx"

Output table: | Source File | Imported From | Zone Violation | Severity |

---

## 9. DEMO DATA GOVERNANCE

Search for hardcoded mock data:
  grep -rn "const MOCK_\|const DEMO_\|const FAKE_\|const SAMPLE_\|const PLACEHOLDER_" src/components/ src/pages/ --include="*.ts" --include="*.tsx"
  grep -rn "mockData\|dummyData\|fakeData\|sampleData" src/components/ src/pages/ --include="*.ts" --include="*.tsx"

Exclude: src/components/ui/, src/engines/demoData/, src/config/demoDataRegistry.ts

Output table: | File | Line | Variable Name | Severity |

---

## 10. SECURITY — SUPABASE CLIENT USAGE

  grep -rn "execute_sql\|raw_sql" src/ --include="*.ts" --include="*.tsx"
  grep -rn "SUPABASE_SERVICE_ROLE_KEY" src/ --include="*.ts" --include="*.tsx"
  grep -rn "localStorage.*role\|sessionStorage.*role\|localStorage.*admin\|sessionStorage.*admin" src/ --include="*.ts" --include="*.tsx"
  grep -rn "auth\.users" src/ --include="*.ts" --include="*.tsx"

Also check edge functions:
  grep -rn "string concatenation in .eq\|.filter\|.or" supabase/functions/ --include="*.ts"

Output table: | File | Line | Finding | Severity |

---

## SUMMARY SECTION (at end of file)

| Category | Findings Count | P0 | P1 | P2 | P3 |
|----------|---------------|----|----|----|----|
| 1. Dead Code | ? | ? | ? | ? | ? |
| ... | | | | | |
| 10. Security | ? | ? | ? | ? | ? |
| **TOTAL** | | | | | |

---

## COMMIT INSTRUCTIONS

1. Create the file spec/audit/codex-deep-audit-2026-03-02.md with all findings
2. Commit message: "audit: deep system audit report 2026-03-02"
3. Push to main branch
4. Do NOT modify any other files
```

---

**Warum `spec/audit/`?** Dort liegen bereits andere Audit-Dateien (`github_cleanup_2026-02-21.json`, `todo_audit_2026-02-21.json`). Die Datei synchronisiert sich automatisch über die GitHub-Integration zurück zu Lovable — ich kann sie dann direkt lesen und die Findings priorisieren.

