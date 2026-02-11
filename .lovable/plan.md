

# Golden Path MOD-04 — SSOT-Verankerung im Code

## PHASE 0: Repo-Analyse

### Fundstellen-Tabelle

| Fundstelle | Typ | Beschreibung | SSOT-Charakter | Risiko |
|---|---|---|---|---|
| `docs/golden-paths/GOLDEN_PATH_LEAD.md` | Doku | Golden Path Lead-Generierung (FROZEN v1.0) | Nur Doku, kein Code | Neutral |
| `docs/golden-paths/GOLDEN_PATH_AKQUISE.md` | Doku | Golden Path Akquise | Nur Doku, kein Code | Neutral |
| `docs/golden-paths/GOLDEN_PATH_PROJEKTE.md` | Doku | Golden Path Projekte | Nur Doku, kein Code | Neutral |
| `docs/golden-paths/GOLDEN_PATH_VERMIETUNG.md` | Doku | Golden Path Vermietung | Nur Doku, kein Code | Neutral |
| `src/hooks/useGoldenPathSeeds.ts` | Code | Seed-Daten fuer Dev-Tenant (Properties, Units, Contacts etc.) | Nein — Testdaten-Generator, kein Pfad-Definition | Neutral |
| `src/components/admin/TestDataManager.tsx` | Code | UI fuer Seed-Ausloesung | Nein — Admin-Tool | Neutral |
| `supabase/migrations/*seed_golden_path*` | DB | RPC-Funktionen fuer Seed-Daten | Nein — DB-Seeds | Neutral |
| `src/manifests/routesManifest.ts` | Manifest | SSOT fuer alle Routen (MOD-04 enthalten) | Ja — Routen-SSOT | **Muss referenziert werden** |
| `src/components/portfolio/VerkaufsauftragTab.tsx` | Code | Aktivierungslogik mit `canActivateFeature`, Guards fuer Dependencies | Ja — Business-Logik SSOT fuer Aktivierung | **Muss integriert werden** |
| `spec/current/02_modules/mod-04_immobilien.md` | Spec | Frozen Spec v2.0.0 fuer MOD-04 | Nur Doku | Neutral |

### Ergebnis-Klassifikation: **(A) — Kein GoldenPath-Engine vorhanden**

Es gibt **keine** programmatische Golden-Path-Definition im Code. Was existiert:
- `docs/golden-paths/` — 4 Markdown-Dokus (Lead, Akquise, Projekte, Vermietung), aber **kein MOD-04**
- `useGoldenPathSeeds.ts` — Nur Testdaten-Seeding, keine Pfad-/Step-/Guard-Logik
- `VerkaufsauftragTab.tsx` — Eingebettete `canActivateFeature()`-Guards (Feature-Dependencies), aber keine generische Engine
- `ManifestRouter.tsx` — Kein Guard-Layer, nur Route-Rendering
- `src/manifests/goldenPaths/` — **Existiert nicht**

**Fazit:** Neuanlage nach Zielstruktur. Keine konkurrierenden SSOTs.

---

## PHASE 1: Zielstruktur

### A) SSOT-Dateien

```text
src/manifests/goldenPaths/
  types.ts          — TypeScript-Typen fuer GoldenPathDefinition
  MOD_04.ts         — Golden Path Definition fuer MOD-04 Immobilie
  index.ts          — Re-Exports

src/goldenpath/
  engine.ts         — getGoldenPath(), evaluateStep(), canEnterRoute(), canRunAction(), nextStep()
  useGoldenPath.ts  — React Hook: useGoldenPath(moduleCode, ctx)
  GoldenPathGuard.tsx — Route-Guard-Wrapper (Redirect + Hinweis-Card)
  devValidator.ts   — DEV-only: prueft routeIds gegen routesManifest
```

### B) Keine neuen DB-Tabellen/Spalten noetig

Alle benoetigten Zustandsdaten existieren bereits:
- `properties` (exists-Check fuer Phase 1)
- `units` (exists-Check fuer Phase 1)
- `storage_nodes` (exists-Check fuer Phase 1)
- `property_features` (verkaufsauftrag, kaufy_sichtbarkeit Status)
- `listings` (status, sales_mandate_consent_id)
- `listing_publications` (channel, status)
- `user_consents` (consent-Check)

---

## PHASE 2: MOD-04 Golden Path Definition

### Typen (`types.ts`)

```typescript
export type StepType = 'route' | 'action' | 'system';

export interface GoldenPathStep {
  id: string;
  phase: number;
  label: string;
  type: StepType;
  // Route-gebundene Steps
  routeId?: string;         // Referenz in routesManifest
  routePattern?: string;    // z.B. '/portal/immobilien/:propertyId'
  queryParams?: Record<string, string>;
  // Preconditions: DB-Queries als deklarative Checks
  preconditions?: StepPrecondition[];
  // Completion: Was muss wahr sein, damit Step als "done" gilt
  completion?: StepCompletion[];
  // Downstream-Steps (system): keine UI-Entry, nur Zustandsregeln
  downstreamModules?: string[];
}

export interface StepPrecondition {
  key: string;              // z.B. 'property_exists'
  source: string;           // Tabelle oder Kontext
  description: string;
}

export interface StepCompletion {
  key: string;
  source: string;
  check: 'exists' | 'equals' | 'not_null';
  value?: string;
  description: string;
}

export interface GoldenPathDefinition {
  moduleCode: string;       // 'MOD-04'
  version: string;
  label: string;
  description: string;
  steps: GoldenPathStep[];
}
```

### MOD-04 Definition (`MOD_04.ts`) — Kurzform

11 Phasen wie im TXT-Diagramm:

| Phase | Step-ID | Typ | Route/Aktion | Preconditions | Completion |
|---|---|---|---|---|---|
| 1 | `create_property` | action | CreatePropertyDialog (Modal in Portfolio) | User eingeloggt, Tenant vorhanden | `properties` Row existiert, `units` MAIN existiert, `storage_nodes` Ordnerstruktur existiert |
| 2 | `edit_dossier` | route | `/portal/immobilien/:propertyId` | Property existiert | — (manueller Datenpflege-Schritt) |
| 3 | `mod05_visibility` | system | Kein UI-Entry | Property + Unit existiert | `units` in MOD-05 ObjekteTab sichtbar (kein Filter) |
| 4 | `activate_sales_mandate` | action | `/portal/immobilien/:id?tab=verkaufsauftrag` | Property existiert, Dossier-Daten vorhanden | `property_features.verkaufsauftrag = active`, `listings.status = active`, `listing_publications.partner_network = active`, `listings.sales_mandate_consent_id IS NOT NULL` |
| 5 | `stammdaten_contract` | system | `/portal/stammdaten/vertraege` | `listings.sales_mandate_consent_id IS NOT NULL` | Vertrag in VertraegeTab sichtbar |
| 6 | `sales_desk_visibility` | system | `/admin/sales-desk` | `listings.sales_mandate_consent_id IS NOT NULL`, `listings.status = active` | Eintrag in ImmobilienVertriebsauftraegeCard |
| 7 | `mod09_katalog` | system | Kein UI-Entry | `listing_publications.partner_network = active` | Objekt in KatalogTab sichtbar |
| 8 | `mod08_suche` | system | Kein UI-Entry | `listings.status = active` | Objekt in SucheTab sichtbar |
| 9 | `activate_kaufy` | action | `/portal/immobilien/:id?tab=verkaufsauftrag` (Toggle) | `property_features.verkaufsauftrag = active` | `property_features.kaufy_sichtbarkeit = active`, `listing_publications.kaufy = active` |
| 10 | `kaufy_website` | system | Kaufy-Website Zone 3 | `listing_publications.kaufy = active` | Objekt auf Kaufy sichtbar |
| 11 | `deactivate_mandate` | action | `/portal/immobilien/:id?tab=verkaufsauftrag` (Toggle off) | `property_features.verkaufsauftrag = active` | `listings.status = withdrawn`, alle `listing_publications = paused`, alle Features `inactive` |

---

## PHASE 3: UI-Integration

### 1. Route-Guard (`GoldenPathGuard.tsx`)

- Wrapper-Komponente, die in `ManifestRouter.tsx` fuer MOD-04 Dynamic Routes eingebunden wird
- Prueft: Hat der User eine Property fuer die angeforderte `:propertyId`?
- Wenn nicht: Redirect auf `/portal/immobilien/portfolio` + Toast-Hinweis
- **Kein** generisches Gating aller Routen — nur die MOD-04-spezifischen Dynamic Routes

### 2. CTA-Guards (bestehende Logik erweitern)

Die Guards in `VerkaufsauftragTab.tsx` (`canActivateFeature`) bleiben erhalten und werden **nicht** ersetzt, sondern die Engine referenziert sie. Konkret:

- "Neue Immobilie anlegen" (CreatePropertyDialog): Bereits offen, kein Guard noetig
- "Vermarktung aktivieren" Toggle: Bestehende `canActivateFeature('verkaufsauftrag')` + Agreement-Panel bleibt
- "Kaufy-Marktplatz" Toggle: Bestehende Dependency `dependsOn: 'verkaufsauftrag'` bleibt

Die Engine stellt lediglich eine **deklarative Quelle** bereit, aus der diese Guards ihre Regeln lesen koennten (optional, Phase 2 der Integration).

### 3. DEV-Validierung (`devValidator.ts`)

- Beim App-Start im DEV-Modus: Alle `routePattern` in der Golden-Path-Definition gegen `routesManifest.ts` pruefen
- Bei Mismatch: `console.error` mit klarer Fehlermeldung
- Kein Produktions-Impact

---

## Implementierungsplan (8 Schritte)

1. Erstelle `src/manifests/goldenPaths/types.ts` mit Typen
2. Erstelle `src/manifests/goldenPaths/MOD_04.ts` mit der vollstaendigen Definition (11 Phasen)
3. Erstelle `src/manifests/goldenPaths/index.ts` (Re-Export)
4. Erstelle `src/goldenpath/engine.ts` mit `getGoldenPath()`, `evaluateStep()`, `canEnterRoute()`, `canRunAction()`, `nextStep()`
5. Erstelle `src/goldenpath/useGoldenPath.ts` (React Hook)
6. Erstelle `src/goldenpath/devValidator.ts` (DEV-only Route-Validierung)
7. Erstelle `src/goldenpath/GoldenPathGuard.tsx` (Route-Guard-Wrapper)
8. Ergaenze `docs/golden-paths/GOLDEN_PATH_IMMOBILIE.md` als Doku-Pendant (synchron mit Code-Definition)

### Nicht im Scope
- Kein Modul-Freeze
- Keine Approval-Flows
- Keine neuen DB-Tabellen
- Keine Aenderung an bestehender VerkaufsauftragTab-Logik (wird nur referenziert)
- Keine Aenderungen an ManifestRouter (Guard wird als optionaler Wrapper eingebaut, kein Breaking Change)

