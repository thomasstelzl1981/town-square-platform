

# Golden Path Registry + Zone-1-Dokumentation

## Ausgangslage

Es gibt aktuell **zwei getrennte Golden-Path-Systeme** ohne konsolidierte Dokumentation:

1. **UI-Prozesse** (`goldenPathProcesses.ts`): 17 Prozesse fuer das Portal-UX (Demo-Widgets, Compliance, Inline-Flow)
2. **Workflow-Definitionen** (`goldenPaths/index.ts`): 8 Engine-registrierte Workflows mit Steps, Fail-States, Ledger-Events

Es fehlt:
- Eine konsolidierte Spec-Datei (analog `ENGINE_REGISTRY.md`)
- Eine Zone-1-Seite zur Visualisierung aller Golden Paths (analog `/admin/armstrong/engines`)

---

## Was wird erstellt

### 1. Spec-Datei: `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md`

Konsolidierte SSOT-Dokumentation aller Golden Paths mit:

**Menschenlesbare Uebersicht (oben)**
- Tabelle mit: Name, Modul, Was passiert?, Wo im Portal?, Zonen-Fluss
- Beispiel: "Finanzierungsanfrage | MOD-07 | Kunde reicht Finanzierung ein | Portal > Finanzierung | Z2 -> Z1 -> Z2"

**Technische Registry (unten)**

Zwei Abschnitte:

A) **17 Portal-Prozesse** (aus `goldenPathProcesses.ts`):

| ID | Modul | Prozess | Phase | Compliance |
|----|-------|---------|-------|------------|
| GP-PORTFOLIO | MOD-04 | Immobilien-Portfolio | done | 6/6 |
| GP-VERWALTUNG | MOD-04 | BWA / Controlling | done | 6/6 |
| GP-SANIERUNG | MOD-04 | Sanierungsauftrag | done | 6/6 |
| GP-FINANZIERUNG | MOD-07 | Finanzierungsanfrage | done | 6/6 |
| GP-SUCHMANDAT | MOD-08 | Investment-Suchmandat | done | 6/6 |
| GP-SIMULATION | MOD-08 | Investment-Simulation | done | 4/6 |
| GP-FM-FALL | MOD-11 | Finanzierungsfall | done | 6/6 |
| GP-AKQUISE-MANDAT | MOD-12 | Akquisemandat | done | 6/6 |
| GP-PROJEKT | MOD-13 | Projektanlage | done | 6/6 |
| GP-SERIEN-EMAIL | MOD-14 | Serien-E-Mail-Kampagne | done | 6/6 |
| GP-RECHERCHE | MOD-14 | Rechercheauftrag | done | 6/6 |
| GP-FAHRZEUG | MOD-17 | Fahrzeugverwaltung | done | 6/6 |
| GP-KONTEN | MOD-18 | Kontoverwaltung | done | 6/6 |
| GP-PV-ANLAGE | MOD-19 | PV-Anlagenanlage | done | 6/6 |
| GP-ZUHAUSE | MOD-20 | Zuhause-Verwaltung | done | 6/6 |
| GP-PETS | MOD-05 | Tierverwaltung | Phase 1 | 6/6 |
| GP-PET | MOD-22 | Pet Manager Demo | Phase 1 | 3/6 |

B) **8 Engine-Workflows** (aus `goldenPaths/*.ts`):

| Key | Workflow | Schritte | Zonen | Fail-States | Camunda-ready |
|-----|----------|----------|-------|-------------|---------------|
| MOD-04 | Immobilien-Zyklus | 10 | Z2->Z1->Z2 | Ja | Ja |
| MOD-07 | Finanzierung | 5 | Z2->Z1->Z2 | Ja | Ja |
| MOD-08 | Investment/Akquise | 7 | Z2->Z1->Z2 | Ja | Ja |
| MOD-13 | Projekte | 5 | Z2->Z1 | Ja | Ja |
| GP-VERMIETUNG | Vermietungszyklus | 5 | Z1->Z3 | Ja | Ja |
| GP-LEAD | Lead-Generierung | 4 | Z3->Z1->Z2 | Ja | Ja |
| GP-FINANCE-Z3 | Zone-3-Finanzierung | 7 | Z3->Z1->Z2 | Ja | Ja |
| GP-PET | Pet Manager Lifecycle | 7 | Z3->Z1->Z2 | Ja | Ja |

**Governance-Regeln**
- GP-GR-1: Jeder Workflow MUSS Fail-States fuer Cross-Zone-Steps definieren
- GP-GR-2: Alle Events MUESSEN in der LEDGER_EVENT_WHITELIST registriert sein
- GP-GR-3: Demo-Widgets an Position 0 in jedem Portal-Prozess
- GP-GR-4: Compliance 6/6 fuer Done-Status

### 2. Zone-1-Seite: `ArmstrongGoldenPaths.tsx`

Neue Admin-Seite unter `/admin/armstrong/golden-paths` (analog zu `/admin/armstrong/engines`):

**Aufbau:**
- Seitentitel: "Golden Path Registry"
- Beschreibung: "Alle registrierten Geschaeftsprozesse und Workflow-Definitionen"
- Filter-Tabs: Alle | Portal-Prozesse (17) | Engine-Workflows (8)
- Pro Eintrag eine Karte mit:
  - Name, Modul-Badge, Status-Badge (Done/Phase 1/Teilweise)
  - Beschreibung
  - Compliance-Score (z.B. "6/6")
  - Zonen-Flow (farbige Badges: Z1/Z2/Z3)
  - Route-Link zum Prozess

**Datenquelle:** Liest direkt aus `goldenPathProcesses.ts` (Portal) und `goldenPaths/index.ts` (Engine) — kein Duplizieren von Daten.

### 3. Navigation

Neuen Menuepunkt "Golden Paths" unter Armstrong im Admin-Menue einfuegen (neben "Engines", "Logs", etc.).

---

## Technische Details

### Neue Dateien
- `spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md` — SSOT-Dokumentation
- `src/pages/admin/armstrong/ArmstrongGoldenPaths.tsx` — Zone-1-UI-Seite

### Geaenderte Dateien
- Armstrong-Navigation/Routing: Neuen Menuepunkt + Route hinzufuegen
- Keine Aenderungen an den bestehenden Manifest-Dateien

### Umfang
- 1 Markdown-Datei (~250 Zeilen)
- 1 React-Komponente (~200 Zeilen, Muster von `ArmstrongEngines.tsx`)
- 1 Navigations-Update

