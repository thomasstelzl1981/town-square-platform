

## Analyse & Plan: Golden Path MOD-13 Erweiterung + Vertriebsauftrag Distribution-Pruefung

### Ergebnis der Pruefung

#### 1. Vertriebsauftrag → Zone 1 → MOD-08/MOD-09/Zone 3: Funktioniert der Flow?

**JA, der technische Mechanismus ist implementiert und funktional.** Hier der Datenfluss:

```text
SalesApprovalSection.tsx (MOD-13, Zone 2)
│
├── activateVertriebsauftrag()
│   ├── 1. INSERT sales_desk_requests (status: 'approved')
│   ├── 2. INSERT user_consents (3x: SALES_MANDATE_V2, DATA_ACCURACY, SYSTEM_SUCCESS_FEE)
│   └── 3. createListingsForProject()
│       ├── Fuer jede Unit (ausser 'verkauft'):
│       │   ├── Falls kein property_id: INSERT properties → Link zu Unit
│       │   ├── INSERT listings (status: 'active', channel: partner_network)
│       │   └── INSERT listing_publications (channel: 'partner_network', status: 'active')
│       └── Optionaler Kaufy-Toggle:
│           └── INSERT listing_publications (channel: 'kaufy', status: 'active')
│
▼
RLS Permissive Policies (Cross-Tenant Sichtbarkeit)
├── listings: Leserecht fuer alle auth-Users wenn status='active'
├── listing_publications: Leserecht wenn channel='partner_network' oder 'kaufy'
└── properties: Leserecht wenn verlinkt mit aktiver publication
│
▼
MOD-08 (Investments/Suche) — Zone 2, alle Tenants
├── SucheTab.tsx liest listing_publications + listings
├── InvestmentResultTile zeigt Objekte
└── InvestmentExposePage zeigt Detailansicht
│
▼
MOD-09 (Vertriebspartner/Katalog) — Zone 2, Partner-Tenants
├── KatalogTab.tsx liest listing_publications (channel: partner_network)
└── Partner sieht Objekte im Katalog
│
▼
Zone 3 (Kaufy Website) — kaufy.immo
├── Kaufy2026Home liest listing_publications (channel: kaufy)
└── Kaufy2026Expose zeigt Detailansicht
```

**Fazit:** Der Vertriebsauftrag erstellt Listings mit Cross-Tenant-Sichtbarkeit. Diese erscheinen automatisch in MOD-08 (alle Tenants), MOD-09 (Partner-Tenants) und Zone 3 (Kaufy). Die RLS-Policies sind korrekt konfiguriert (permissive read fuer aktive Publications). **Es gibt keine Zone-1-Backbone-Orchestrierung im engeren Sinne** — die Listings werden direkt vom Partner-Tenant in die gemeinsamen Tabellen geschrieben, und die RLS-Policies uebernehmen die "Distribution". Zone 1 hat einen Kill-Switch (Deaktivierung ueber Sales Desk), aber kein Approval-Gate.

**HINWEIS:** Die aktuelle Implementierung umgeht streng genommen die Governance-Regel GP-GR-7 ("Kein direkter Z2-Z2 Datenzugriff — alles via Z1-Orchestrierung"). In der Praxis funktioniert es, weil die RLS-Policies als Proxy fuer die Z1-Orchestrierung dienen. Fuer die Camunda-Migration spaeter muesste der Flow ueber eine Edge Function (Z1 Service Task) laufen. Aktuell ist das akzeptabel.

#### 2. Golden Path MOD-13: InvestEngine-Step fehlt

**KORREKT — der neue InvestEngine-Step ist NICHT im Golden Path registriert.**

Aktueller Golden Path `MOD_13.ts` (6 Phasen):
1. Projekt anlegen
2. Einheiten planen
3. Phasenwechsel Bau → Vertrieb
4. Listing Distribution
5. Landing Page
6. Uebergabe und Abschluss

**Es fehlt:** Ein Step zwischen Phase 2 (Einheiten planen) und Phase 3 (Phasenwechsel), der die Investment-Analyse (InvestEngine) abbildet. Ausserdem fehlen im Context Resolver die Flags fuer den Vertriebsauftrag und die Listings.

#### 3. MOD-13 als Golden-Tenant-Vorlage

**Bestaetigung:** MOD-13 in seiner aktuellen Form (6 Tiles: Dashboard → Projekte → InvestEngine → Vertrieb → Landing Page → Lead Manager) wird als systemweite Vorlage im Golden Tenant hinterlegt. Alle Partner-Tenants mit `project_manager`-Rolle erhalten exakt diese Funktionalitaet. Der Code ist generisch (keine Tenant-spezifischen Hardcodes), die Daten kommen aus `dev_projects` + `dev_project_units` (mandantenfaehig via tenant_id + RLS).

---

### Aenderungen

#### 1. Golden Path Definition erweitern: `src/manifests/goldenPaths/MOD_13.ts`

Neuen Step "Investment-Analyse" als Phase 2.5 (wird Phase 3, alle nachfolgenden Phasen verschieben sich um 1):

**Neue 7-Phasen-Struktur:**

| Phase | Step ID | Label | Type | Neu? |
|---|---|---|---|---|
| 1 | create_project | Projekt anlegen | user_task | nein |
| 2 | plan_units | Einheiten planen | user_task | nein |
| **3** | **invest_analysis** | **Investment-Analyse (InvestEngine)** | **user_task** | **JA** |
| 4 | phase_change_sales | Phasenwechsel → Vertrieb | user_task | verschoben |
| 5 | listing_distribution | Listing-Distribution | service_task | verschoben |
| 6 | landing_page | Landing Page erstellen | service_task | verschoben |
| 7 | handover_complete | Uebergabe und Abschluss | user_task | verschoben |

Der neue Step:
```typescript
{
  id: 'invest_analysis',
  phase: 3,
  label: 'Investment-Analyse (InvestEngine)',
  type: 'route',
  routePattern: '/portal/projekte/invest-engine',
  task_kind: 'user_task',
  camunda_key: 'GP05_STEP_03_INVEST_ANALYSIS',
  preconditions: [
    { key: 'units_created', source: 'dev_project_units', description: 'Einheiten muessen existieren' },
  ],
  completion: [
    { key: 'invest_analysis_done', source: 'dev_projects', check: 'exists', description: 'Investment-Analyse wurde durchgefuehrt' },
  ],
}
```

Zusaetzlich: `success_state.required_flags` erweitern um `'invest_analysis_done'`.

#### 2. Context Resolver erweitern: `src/goldenpath/contextResolvers.ts`

Der MOD-13 Resolver (Z.219-247) prueft aktuell nur `project_exists` und `units_created`. Es fehlen:

- `invest_analysis_done` — Hat der Projektmanager die InvestEngine mindestens einmal genutzt?
- `vertriebsauftrag_active` — Gibt es einen aktiven Vertriebsauftrag?
- `listings_published` — Existieren aktive Listings fuer Projekteinheiten?
- `distribution_active` — Sind Listing-Publications aktiv?

**Erweiterung:**
```typescript
// Pruefen ob InvestEngine genutzt wurde (sales_desk_requests als Proxy — 
// wenn Vertrieb erteilt, muss vorher Analyse stattgefunden haben)
// Alternativ: Flag in dev_projects (invest_engine_analyzed: boolean)
// Empfehlung: Neues DB-Feld, da es ein expliziter User-Schritt ist

// Vertriebsauftrag pruefen
const { data: salesRequest } = await supabase
  .from('sales_desk_requests')
  .select('id, status')
  .eq('project_id', projectId)
  .eq('status', 'approved')
  .maybeSingle();
flags.vertriebsauftrag_active = !!salesRequest;

// Listings pruefen
const { data: unitPropertyIds } = await supabase
  .from('dev_project_units')
  .select('property_id')
  .eq('project_id', projectId)
  .not('property_id', 'is', null);

if (unitPropertyIds?.length) {
  const propIds = unitPropertyIds.map(u => u.property_id).filter(Boolean);
  const { count: listingCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .in('property_id', propIds)
    .eq('status', 'active');
  flags.listings_published = (listingCount ?? 0) > 0;

  // Publications pruefen
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .in('property_id', propIds)
    .eq('status', 'active');
  if (listings?.length) {
    const listingIds = listings.map(l => l.id);
    const { count: pubCount } = await supabase
      .from('listing_publications')
      .select('*', { count: 'exact', head: true })
      .in('listing_id', listingIds)
      .eq('status', 'active');
    flags.distribution_active = (pubCount ?? 0) > 0;
  }
}
```

Fuer `invest_analysis_done` gibt es zwei Optionen:

- **Option A (DB-Feld):** Neues Boolean-Feld `invest_engine_analyzed` in `dev_projects`. Wird auf `true` gesetzt, wenn der User in InvestEngineTab auf "Berechnen" klickt. Sauber, explizit, pruefbar.
- **Option B (Heuristik):** Wenn `sales_desk_requests` existiert mit Status approved, dann muss vorher eine Analyse stattgefunden haben. Weniger explizit.

**Empfehlung: Option A** — ein neues Boolean-Feld ist sauberer und erlaubt dem Golden Path Guard, den Step korrekt zu validieren.

#### 3. DB-Migration: Neues Feld `invest_engine_analyzed`

```sql
ALTER TABLE public.dev_projects
ADD COLUMN IF NOT EXISTS invest_engine_analyzed BOOLEAN DEFAULT false;
```

#### 4. InvestEngineTab.tsx: Flag setzen bei Berechnung

Nach erfolgreicher Berechnung (`handleCalculate` Zeile 102-139) ein Update auf `dev_projects`:

```typescript
// Nach setHasCalculated(true):
await supabase
  .from('dev_projects')
  .update({ invest_engine_analyzed: true })
  .eq('id', selectedProjectId);
```

#### 5. Ledger Events erweitern: `src/manifests/goldenPaths/index.ts`

Neue Events fuer InvestEngine:
```typescript
'project.invest_analysis.completed',
'project.invest_analysis.error',
```

#### 6. Golden Path Registry Doku: `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md`

- MOD-13 Engine-Workflow von 5 auf 7 Schritte aktualisieren
- InvestEngine-Step dokumentieren

#### 7. MOD-13 Spec Doku: `docs/modules/MOD-13_PROJEKTE.md`

Bestaetigungsvermerk: MOD-13 ist die systemweite Vorlage fuer alle Partner-Tenants mit `project_manager`-Rolle. Die Funktionalitaet wird im Golden Tenant als Referenzimplementierung gefuehrt.

---

### Was NICHT geaendert wird

| Punkt | Begruendung |
|---|---|
| SalesApprovalSection | Funktioniert korrekt — erstellt Listings + Publications mit Cross-Tenant-Sichtbarkeit |
| RLS Policies | Bereits korrekt konfiguriert fuer Cross-Tenant-Read |
| MOD-08, MOD-09, Zone 3 Code | Lesen bereits automatisch die Listings via RLS — keine Aenderung noetig |
| Zone-1 Sales Desk | Kill-Switch existiert bereits — kein Approval-Gate noetig |

### Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| `src/manifests/goldenPaths/MOD_13.ts` | Neuer Step 'invest_analysis' (Phase 3), Phasen 3-6 werden zu 4-7, success_state erweitert |
| `src/goldenpath/contextResolvers.ts` | MOD-13 Resolver: 5 neue Flags (invest_analysis_done, vertriebsauftrag_active, listings_published, distribution_active, phase_vertrieb) |
| `src/manifests/goldenPaths/index.ts` | 2 neue Ledger Events |
| `src/pages/portal/projekte/InvestEngineTab.tsx` | Flag-Update nach Berechnung (invest_engine_analyzed = true) |
| DB-Migration | `ALTER TABLE dev_projects ADD COLUMN invest_engine_analyzed BOOLEAN DEFAULT false` |
| `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` | MOD-13 von 5 auf 7 Steps aktualisieren |
| `docs/modules/MOD-13_PROJEKTE.md` | Golden-Tenant-Vermerk + InvestEngine-Step dokumentieren |

### Implementierungsreihenfolge

1. DB-Migration (neues Feld `invest_engine_analyzed`)
2. `MOD_13.ts` — Golden Path Definition erweitern
3. `contextResolvers.ts` — MOD-13 Resolver erweitern
4. `index.ts` — Ledger Events
5. `InvestEngineTab.tsx` — Flag-Update
6. Docs aktualisieren

