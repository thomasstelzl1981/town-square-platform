

# MODULE FREEZE — Machbarkeitsanalyse und realistischer Implementierungsplan

## Kernproblem: Lovable hat keinen PR-basierten Workflow

Die zentrale Annahme des Prompts — "PRs blockieren via GitHub Actions CI" — funktioniert in der Lovable-Umgebung **nicht**, weil:

1. **Kein `.github/` Verzeichnis existiert** — das Projekt hat keine GitHub Actions.
2. **Lovable pusht Aenderungen direkt** auf den Default-Branch (bidirektionaler Sync). Es gibt keinen PR-Review-Prozess fuer Lovable-generierte Aenderungen.
3. **Branch Protection mit Required Status Checks** wuerde Lovable selbst blockieren, da Lovable keinen PR erstellt, sondern direkt committet.

Das bedeutet: **Teil C (freeze-guard.yml) und Teil D (Freeze-PR Edge Function) sind in der aktuellen Lovable-Architektur nicht umsetzbar.**

---

## Was IST umsetzbar (und sinnvoll)

### Teil A + B: DB-Freeze-State + Zone-1 Admin UI -- VOLLSTAENDIG MACHBAR

Die Datenbank-Persistenz und das Admin-Panel funktionieren problemlos:

**Datenbankschema** (Erweiterung von `tile_catalog`, da alle 21 Module dort bereits existieren):

| Neues Feld | Typ | Beschreibung |
|---|---|---|
| `freeze_enabled` | BOOLEAN DEFAULT false | Freeze aktiv? |
| `frozen_at` | TIMESTAMPTZ NULL | Zeitpunkt des Freeze |
| `frozen_by` | UUID NULL | Wer hat gefreezed |
| `freeze_reason` | TEXT NULL | Begruendung |

**Warum `tile_catalog` statt neue Tabelle?** Alle 21 Module sind dort bereits mit `tile_code`, `title`, `main_tile_route` registriert. Eine zweite Tabelle wuerde Dual-SSOT Drift erzeugen (genau das Risiko R-001 aus dem Architektur-Audit).

**RLS:** Bestehende platform_admin Policies greifen bereits. SELECT/UPDATE nur fuer `is_platform_admin()`.

**Admin UI:** Neuer Tab "Module Freeze" in der bestehenden `TileCatalog.tsx` Seite (Zone 1). Toggle pro Modul, Bulk-Actions, Audit-Trail Anzeige.

**Ledger-Events:** `module.freeze.enabled` und `module.freeze.disabled` mit Payload `{ module_code, new_state, reason, actor_user_id }`.

---

## Alternativer Schutz-Mechanismus (statt GitHub Actions)

Da der CI-Guard nicht funktioniert, gibt es zwei realistische Alternativen:

### Alternative 1: Lovable-Kontext-Guard (Software-Governance)

Eine Datei `spec/current/00_frozen/modules_freeze.json` wird im Repo gepflegt. Lovable (der AI-Editor) wird angewiesen, diese Datei vor jeder Aenderung zu pruefen. Dies ist ein **Governance-Dokument**, kein technischer Blocker.

- Vorteil: Sofort umsetzbar, kein externer Tooling-Bedarf
- Nachteil: Kein harter technischer Block — verlaesst sich auf Prozessdisziplin

### Alternative 2: GitHub-seitiger Schutz (manuell, ausserhalb Lovable)

Falls das Repo mit GitHub verbunden ist, kann der Nutzer **manuell** einrichten:
- CODEOWNERS-Datei, die bestimmte Pfade schuetzt
- Branch Protection Rules mit Required Reviews
- Aber: Dies blockiert auch Lovable selbst und muesste bei jedem Freeze-Wechsel manuell angepasst werden

### Empfehlung: Alternative 1 umsetzen

Die `modules_freeze.json` dient als SSOT. Der Zone-1-Toggle aktualisiert die DB. Ein "Export"-Button generiert die JSON fuer das Repo. Dies ist der einzige Ansatz, der mit Lovables Architektur kompatibel ist.

---

## Konkreter Implementierungsplan

### Schritt 1: DB-Migration

Erweiterung `tile_catalog` um 4 Felder (`freeze_enabled`, `frozen_at`, `frozen_by`, `freeze_reason`). Keine neue Tabelle, keine neuen RLS-Policies noetig (bestehende platform_admin Policies decken dies ab).

### Schritt 2: Ledger-Whitelist erweitern

Neue Events `module.freeze.enabled` und `module.freeze.disabled` in die `log_data_event` RPC-Whitelist aufnehmen.

### Schritt 3: TileCatalog.tsx — Neuer Tab "Module Freeze"

Neuer Tab in der bestehenden Admin-Seite mit:
- Tabelle aller 21 Module mit Freeze-Toggle (Switch-Komponente)
- Spalten: Modul, Route, Freeze Status, Frozen At, Frozen By, Reason
- Beim Toggle: DB-Update + Ledger-Event
- "Freeze All" / "Unfreeze All" Bulk-Actions mit Confirm-Dialog
- "Export Freeze Config" Button: generiert `modules_freeze.json` Inhalt zum Download

### Schritt 4: Governance-Datei

Erstellung `spec/current/00_frozen/modules_freeze.json` mit initialem State (alle Module unfrozen). Diese Datei dient als Referenz fuer Entwickler und AI-Assistenten.

### Schritt 5: Pfad-Mapping Datei

Erstellung `spec/current/00_frozen/modules_freeze_paths.json` mit den geschuetzten Pfaden pro Modul. Beispiel:

```text
MOD-04: src/pages/portal/immobilien/**, src/components/immobilien/**
MOD-13: src/pages/portal/projekte/**, src/components/projekte/**
```

---

## Dateiaenderungen

| Datei | Aenderung |
|---|---|
| Migration | `tile_catalog` um 4 Freeze-Felder erweitern |
| Migration | `log_data_event` Whitelist um Freeze-Events erweitern |
| `src/pages/admin/TileCatalog.tsx` | Neuer Tab "Module Freeze" mit Toggle-UI |
| `spec/current/00_frozen/modules_freeze.json` | Neue Datei: initialer Freeze-State |
| `spec/current/00_frozen/modules_freeze_paths.json` | Neue Datei: Pfad-Scoping pro Modul |

## Was NICHT umgesetzt wird (und warum)

| Teil aus dem Prompt | Status | Grund |
|---|---|---|
| `.github/workflows/freeze-guard.yml` | Nicht moeglich | Lovable hat keinen PR-Workflow, kein GitHub Actions Support |
| Edge Function `sot-github-freeze-pr` | Nicht moeglich | Kein GitHub Token konfiguriert, Lovable pusht direkt |
| Branch Protection Required Checks | Nicht moeglich | Wuerde Lovable selbst blockieren |
| Auto-Commit auf main (Variante B) | Nicht moeglich | Gleicher Grund |

## Konsequenzen

**Was funktioniert nach Umsetzung:**
- Platform Admins koennen Module als "frozen" markieren (persistent in DB)
- Jeder Freeze-Wechsel wird im Audit-Ledger protokolliert
- Die Governance-Datei im Repo dokumentiert den aktuellen Freeze-State
- Entwickler und AI-Assistenten koennen den Freeze-State vor Aenderungen pruefen

**Was NICHT funktioniert:**
- Kein automatischer harter Block von Code-Aenderungen an gefrorenen Modulen
- Der Schutz ist organisatorisch/prozessual, nicht technisch erzwungen
- Erst wenn das Projekt auf einen echten Git-Workflow (mit PRs und CI) migriert wird, kann der freeze-guard als harter Block implementiert werden
