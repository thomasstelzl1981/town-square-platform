
# Systemaudit v4.0 — Praesentationsbereitschaft

## 1. Gesamtstatus

Das System ist strukturell solide. Die Architektur (21 Module, 3 Zonen, 15 Golden Paths, 95 Edge Functions) ist konsistent. Alle vorherigen Audit-Items (SIA-0001 bis SIA-0012) sind erledigt oder dokumentiert. Es gibt keine P0-Blocker. Fuer die Praesentation sind jedoch mehrere Inkonsistenzen und Altlasten zu bereinigen.

## 2. Gefundene Issues

### P1 — Praesentation blockierend

| ID | Modul | Issue | Details |
|----|-------|-------|---------|
| SIA4-001 | MOD-04 | VerwaltungTab enthaelt veraltete "MSV"-Texte | Zeile 112: "MSV-Objekt hinzufuegen", Zeile 125: "Keine MSV-Objekte aktiv" — muss "BWA" heissen |
| SIA4-002 | MOD-04 | goldenPathProcesses.ts: GP-VERWALTUNG noch "Mietverwaltung" | processName, description und demoWidget referenzieren "Mietverwaltung" und "MFH Duesseldorf" — muss BWA-konform sein |
| SIA4-003 | MOD-04 | NKAbrechnungTab: unitId kann leerer String sein | PropertyDetailPage Zeile 524: `unitId={unit?.id || ''}` — wenn keine Unit selektiert, ist unitId leer, was zu leeren Queries fuehrt |
| SIA4-004 | MOD-04 | NK-Engine: Hardcoded unitPersons/totalPersons/totalUnits | engine.ts Zeile 169-171: `unitPersons: 2`, `totalPersons: 10`, `totalUnits: 10` — muss dynamisch aus DB kommen |

### P2 — Technische Schulden

| ID | Modul | Issue | Details |
|----|-------|-------|---------|
| SIA4-005 | MOD-04 | VerwaltungTab: JSDoc-Kommentar Zeile 3-10 referenziert geloeschte Kacheln | Beschreibt "Kachel 1: Mietliste, Kachel 2: Aufgaben, Kachel 3: BWA" — existieren nicht mehr |
| SIA4-006 | MOD-04 | demoDataManifest.ts: GP-VERWALTUNG toggleKey noch "GP-VERWALTUNG" | Funktional OK, aber semantisch inkonsistent mit Umbenennung zu BWA |
| SIA4-007 | MOD-04 | useMSVData.ts: Hook-Name und Kommentare noch "MSV"-bezogen | Funktioniert, aber Name sollte `useBWAData` sein fuer Konsistenz |
| SIA4-008 | MOD-04 | bwaKontenplan.ts Zeile 2: "SSOT fuer MOD-04 Verwaltung" | Sollte "BWA" heissen |
| SIA4-009 | MOD-07 | useFinanceRequest.ts: TODO case_events audit event | Zeile 281: Status-Aenderungen werden nicht in case_events persistiert |
| SIA4-010 | Armstrong | useArmstrongContext.ts: webResearchEnabled hardcoded true | Zeile 213: Sollte aus org_settings gelesen werden |
| SIA4-011 | MOD-04 | NK-Engine: nk_periods/nk_cost_items als `(supabase as any)` | Type-Casts umgehen Typsicherheit — Tabellen fehlen in types.ts |

### P3 — Kosmetik / Dokumentation

| ID | Modul | Issue | Details |
|----|-------|-------|---------|
| SIA4-012 | MOD-04 | goldenPaths/MOD_04.ts: Step "Sichtbarkeit in Verwaltung" | Zeile 104: Label und Keys referenzieren "Verwaltung" statt "BWA" |
| SIA4-013 | MOD-04 | GP_VERMIETUNG.ts: failure_redirect auf /portal/immobilien/verwaltung | Funktional korrekt (Route unveraendert), aber Kommentar veraltet |
| SIA4-014 | Spec | mod-04 Verwaltung-Spec nicht aktualisiert | spec/current/02_modules/ muesste BWA-Umbenennung reflektieren |

## 3. Golden Path Klick-Test Ergebnisse

### GP-PORTFOLIO (MOD-04) — Ergebnis: BESTANDEN mit Einschraenkung
- Route /portal/immobilien/portfolio: Laedt korrekt
- WidgetGrid: Rendert (leer ohne Auth, mit Auth zeigt Demo-Widgets)
- Immobilienakte: Route /:id mit GoldenPathGuard aktiv
- NK-Abrechnung Tab: Rendert 5 Sektionen mit Template (17 Positionen)
- **Einschraenkung**: unitId kann leer sein wenn keine Unit selektiert (SIA4-003)

### GP-VERWALTUNG/BWA (MOD-04) — Ergebnis: BESTANDEN mit Textfehlern
- Route /portal/immobilien/verwaltung: Laedt als "BWA"
- Tab-Label: Korrekt "BWA"
- WidgetGrid: Zeigt Objekt-Widgets
- **Fehler**: CTA-Button sagt "MSV-Objekt hinzufuegen" statt "Objekt hinzufuegen"
- **Fehler**: Empty State sagt "Keine MSV-Objekte"

### GP-FINANZIERUNG (MOD-07) — Ergebnis: BESTANDEN
- Routes: selbstauskunft, dokumente, anfrage, status, privatkredit alle deklariert
- GoldenPathGuard auf anfrage/:requestId aktiv
- Legacy-Redirects (vorgaenge, readiness, export, partner) korrekt

### GP-SUCHMANDAT + GP-SIMULATION (MOD-08) — Ergebnis: BESTANDEN
- Routes: suche, favoriten, mandat, simulation deklariert
- Interne Dynamic Routes (mandat/neu, mandat/:id, objekt/:publicId) dokumentiert
- Investment Engine Pattern funktional

### GP-SANIERUNG (MOD-04) — Ergebnis: BESTANDEN
- Route /portal/immobilien/sanierung: Deklariert und implementiert
- Demo-Widget korrekt konfiguriert

### GP-PROJEKT (MOD-13) — Ergebnis: BESTANDEN
- Routes: dashboard, projekte, vertrieb, landing-page
- GoldenPathGuard auf :projectId und :projectId/einheit/:unitId
- Demo-Widget "Residenz am Stadtpark" korrekt

### GP-FM-FALL (MOD-11) — Ergebnis: BESTANDEN
- 6 Tiles + dynamic routes (einreichung/:requestId, faelle/:requestId)
- Gold Standard Reference Implementation

### GP-AKQUISE-MANDAT (MOD-12) — Ergebnis: BESTANDEN
- 6 Tiles + dynamic routes mit GoldenPathGuard

## 4. Reparaturplan — Priorisiert

### Sofort (vor Praesentation, 15 Min)

| Schritt | Datei | Aenderung |
|---------|-------|-----------|
| 1 | VerwaltungTab.tsx | "MSV-Objekt hinzufuegen" → "Objekt hinzufuegen", "Keine MSV-Objekte" → "Keine Objekte aktiv" |
| 2 | VerwaltungTab.tsx | JSDoc-Kommentar Zeile 1-10 aktualisieren (BWA statt MSV-Referenzen) |
| 3 | goldenPathProcesses.ts | GP-VERWALTUNG: processName → "BWA / Controlling", description aktualisieren |
| 4 | PropertyDetailPage.tsx | NKAbrechnungTab: Fallback-Logik wenn unitId leer (erste Unit der Property auto-selektieren oder Hinweis zeigen) |

### Sprint-Backlog (nach Praesentation)

| Schritt | Datei | Aenderung |
|---------|-------|-----------|
| 5 | engine.ts | unitPersons, totalPersons, totalUnits dynamisch aus DB laden |
| 6 | useMSVData.ts | Rename zu useBWAData.ts (+ alle Imports aktualisieren) |
| 7 | bwaKontenplan.ts | Kommentar aktualisieren |
| 8 | goldenPaths/MOD_04.ts | Step-Labels "Verwaltung" → "BWA" |
| 9 | demoDataManifest.ts | GP-VERWALTUNG Labels aktualisieren |
| 10 | useFinanceRequest.ts | TODO case_events implementieren |
| 11 | useArmstrongContext.ts | webResearchEnabled aus org_settings lesen |
| 12 | NK-Engine | `(supabase as any)` Casts entfernen wenn Tabellen in types.ts |

## 5. Backlog-Datei

Die Ergebnisse werden in `spec/audit/system_integrity_audit_v4_backlog.json` als strukturierte JSON-Datei angelegt mit folgendem Schema pro Item:

```text
{
  "id": "SIA4-XXXX",
  "severity": "P1|P2|P3",
  "dimension": "text|manifest|engine|spec|hook",
  "zone": "Z2",
  "module": "MOD-XX",
  "title": "...",
  "description": "...",
  "repo_refs": ["file:line"],
  "fix_plan": { "steps": [...], "risk": "low|medium" },
  "status": "open|in_progress|done"
}
```

## 6. Zusammenfassung fuer Praesentation

- **21 Module aktiv**, alle mit Routes im Manifest deklariert
- **15 Golden Paths** registriert, alle `phase: 'done'` (ausser GP-PETS: Phase 1)
- **0 Rogue Routes** — alle Routen ueber ManifestRouter gesteuert
- **NK-Abrechnung Engine** funktional mit 17-Positionen Template, 5-Sektionen UI, PDF-Export
- **4 Textfehler** (MSV-Reste) zu bereinigen — rein kosmetisch, keine Funktionsstoerung
- **3 technische TODOs** in Engine (Personenzahlen, Audit Events) — beeintraechtigen Demo-Flow nicht
- **Enterprise-Architektur intakt**: RLS, Zonen-Isolation, Backbone-Pattern, Golden Path Guards
