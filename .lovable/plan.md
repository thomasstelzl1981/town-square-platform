
# FINANCE TRIAD — IMPLEMENTIERUNGSPLAN v3.0 FINAL

**Datum:** 2026-01-28  
**Modus:** NUR Analyse + Plan (keine Implementierung ohne Freigabe)  
**Scope:** MOD-07 + Zone-1 FutureRoom + MOD-11 (NO-TOUCH für alle anderen Module)

---

## EXECUTIVE SUMMARY

### IST-Zustand (Analyse-Ergebnis)

| Bereich | IST | SOLL | Delta |
|---------|-----|------|-------|
| **MOD-07 Sub-Tiles** | Dashboard, Fälle, Dokumente, Einstellungen | Selbstauskunft, Neue Finanzierung, Kalkulation & Objekt, Status | **KOMPLETT NEU** |
| **MOD-07 Datenmodell** | `finance_requests` + `applicant_profiles` | Weiterhin nutzen (keine neuen Tabellen) | OK |
| **MOD-11 Sub-Tiles** | So funktioniert's, Selbstauskunft, Einreichen, Status | Mandate, Bearbeitung, Einreichen, Status | **UMBAU Screen 1** |
| **MOD-11 tile_catalog** | Falsches Flowchart (Zone 3 Marktplatz) | Korrektes Finance-Flowchart | **FIX ERFORDERLICH** |
| **Zone-1 FutureRoom** | Vorhanden, aber kein Manager-Picker | Manager-Picker + Statusmaschine + Audit | **ERGÄNZUNG** |
| **owner_context_id** | **FEHLT** in DB | Pflicht in applicant_profiles + finance_requests | **MIGRATION** |
| **MOD-11 Spec-Datei** | **FEHLT** | docs/modules/MOD-11_FINANZIERUNGSMANAGER.md | **ERSTELLEN** |

---

## TEIL 1: ÜBERSICHT JE MODUL (FINAL)

### 1.1 MOD-07 Finanzierung (FROZEN FINAL)

**Base Route:** `/portal/finanzierung`

| # | Route | Label | Beschreibung |
|---|-------|-------|--------------|
| 1 | `/portal/finanzierung` | Selbstauskunft | Permanente Datenbasis (applicant_profiles) + Dokumente-Abschnitt. Owner-Kontext aus MOD-04 Pflicht. |
| 2 | `/portal/finanzierung/neu` | Neue Finanzierung | Wizard: Owner-Kontext bestätigen → finance_request anlegen → Grunddaten |
| 3 | `/portal/finanzierung/kalkulation` | Kalkulation & Objekt | Objekt wählen (MOD-04/MOD-08/custom) + Investment-Rechner + Konditionen (read-only) |
| 4 | `/portal/finanzierung/status` | Status | Übersicht finance_requests + Mandat-Spiegel + Case-Spiegel (read-only nach Einreichung) |

**Legacy Redirects (PFLICHT):**
```
/portal/finanzierung/faelle        → /portal/finanzierung/status
/portal/finanzierung/faelle/:id    → /portal/finanzierung/status/:id
/portal/finanzierung/dokumente     → /portal/finanzierung
/portal/finanzierung/einstellungen → /portal/finanzierung
```

**ID-Mapping:** `:id` referenziert immer `finance_requests.id`

---

### 1.2 Zone-1 FutureRoom (FROZEN FINAL)

**Base Route:** `/admin/futureroom`

| Tab | Beschreibung |
|-----|--------------|
| **Mandate Inbox** | Liste aller `finance_mandates` + Filter + Statusanzeige |
| **Bankkontakte** | `finance_bank_contacts` Verzeichnis (nur Banken/Finanzierungspartner) |

**Statusmaschine (FROZEN):**
```
new → triage → delegated → accepted → closed
```

**Ergänzungen erforderlich:**
1. **Manager-Picker Dialog** bei "Zuweisen" (Quelle: Users mit Rolle `finance_manager`)
2. **Audit Event** bei Delegation + Acceptance
3. **System-Mail** bei Acceptance an Kunde + ggf. Partner

---

### 1.3 MOD-11 Finanzierungsmanager (FROZEN FINAL)

**Base Route:** `/portal/finanzierungsmanager`

| # | Route | Label | Beschreibung |
|---|-------|-------|--------------|
| 1 | `/portal/finanzierungsmanager` | Mandate | Collapsible "How it works" + **Mandate Inbox** (delegated an mich) + Annehmen → Provisionsvereinbarung (Consent) → Case erzeugen |
| 2 | `/portal/finanzierungsmanager/bearbeitung` | Bearbeitung | Case-Liste + Detail: Selbstauskunft nachpflegen + Objekt (read-only) + Datenraum-Links + Notizen |
| 3 | `/portal/finanzierungsmanager/einreichen` | Einreichen | Bank auswählen (Zone-1 Kontakte) + Plattform/E-Mail Optionen + PDF + Datenraum-Link |
| 4 | `/portal/finanzierungsmanager/status` | Status | Timeline + Bank-Rückmeldungen + Spiegelung an Zone-1 + MOD-07 |

---

## TEIL 2: END-TO-END WORKFLOW (FROZEN)

### Phase 1 — Kunde (MOD-07 ist SoT)

```
1. Owner-Kontext wählen (aus MOD-04 Kontexte)
   └── Wenn 0 Kontexte: Blocker
   └── Wenn 1 Kontext: auto-select
   └── Wenn >1 Kontexte: Context Picker Modal

2. Selbstauskunft pflegen (applicant_profiles)
   └── Dokumente hochladen (DMS + JSON paired + Mapping)

3. Neue Finanzierung anlegen (finance_requests.status=draft)

4. Objekt wählen + kalkulieren
   └── MOD-04 property_id / unit_id
   └── MOD-08 listing_id
   └── custom_object_data

5. Einreichen
   └── finance_requests.status=submitted
   └── INSERT finance_mandates (status=new)
   └── MOD-07 wird read-only für diesen Request
```

### Phase 2 — Admin (Zone-1 FutureRoom ist SoT)

```
6. Mandat kommt rein: status=new

7. Triage: status=triage

8. Delegation:
   └── Manager-Picker öffnen
   └── Manager auswählen
   └── status=delegated
   └── assigned_manager_id + delegated_at + delegated_by
   └── INSERT audit_event
```

### Phase 3 — Finance Manager (MOD-11 ist SoT)

```
9. Manager sieht delegated Mandate (WHERE assigned_manager_id = auth.uid())

10. Annehmen:
    └── Provisionsvereinbarung (Consent Modal)
    └── status=accepted + accepted_at
    └── INSERT future_room_cases (status=processing)
    └── System-Mail an Kunde + Partner

11. Bearbeitung:
    └── Selbstauskunft nachpflegen
    └── Datenraum prüfen
    └── Interne Notizen

12. Einreichen:
    └── Bank auswählen
    └── Methode: Plattform ODER E-Mail
    └── PDF generieren + Datenraum-Link
    └── future_room_cases.status=submitted_to_bank

13. Status führen:
    └── Bank-Rückmeldungen dokumentieren
    └── Spiegelung: MOD-11 → Zone-1 → MOD-07 (read-only)
```

---

## TEIL 3: DATENMODELL-REUSE MAP

### 3.1 Bestehende Tabellen (WIEDERVERWENDEN)

| Tabelle | Owner | Genutzt von | Status |
|---------|-------|-------------|--------|
| `finance_requests` | MOD-07 | MOD-07, Zone-1, MOD-11 | ✅ Aktiv |
| `applicant_profiles` | MOD-07 | MOD-07, MOD-11 | ✅ Aktiv |
| `finance_mandates` | Zone-1 | Zone-1, MOD-11, MOD-07 (read) | ✅ Aktiv |
| `future_room_cases` | MOD-11 | MOD-11, Zone-1 (read), MOD-07 (read) | ✅ Aktiv |
| `finance_bank_contacts` | Zone-1 | Zone-1, MOD-11 | ✅ Aktiv |
| `documents` | MOD-03 | Alle | ✅ Aktiv |
| `document_links` | MOD-03 | Alle | ✅ Aktiv |
| `storage_nodes` | MOD-03 | Alle | ✅ Aktiv |

### 3.2 Fehlende Spalten (MIGRATION ERFORDERLICH)

| Tabelle | Spalte | Typ | Beschreibung | Task |
|---------|--------|-----|--------------|------|
| `applicant_profiles` | `owner_context_id` | uuid FK | Referenz zu MOD-04 Kontext | MIGRATE-FIN-001 |
| `finance_requests` | `owner_context_id` | uuid FK | Referenz zu MOD-04 Kontext | MIGRATE-FIN-001 |

### 3.3 Status-Schema (FROZEN)

```
finance_requests.status:
  draft | submitted

finance_mandates.status:
  new | triage | delegated | accepted | closed

future_room_cases.status:
  processing | submitted_to_bank | pending_docs | approved | rejected
```

---

## TEIL 4: FIX-PLAN IN PHASEN

### P0 — KRITISCH (Blocking)

| # | Task | Bereich | Acceptance Criteria |
|---|------|---------|---------------------|
| P0-1 | **MOD-11 Spec-Datei erstellen** | Docs | `docs/modules/MOD-11_FINANZIERUNGSMANAGER.md` existiert mit vollständiger Spec |
| P0-2 | **tile_catalog MOD-11 korrigieren** | DB | `flowchart_mermaid` zeigt Finance-Flow, nicht Marktplatz |
| P0-3 | **tile_api_internal MOD-11 korrigieren** | DB | Einträge für `/future_room_cases`, `/finance_mandates`, `/applicant_profiles` (keine Marktplatz-APIs) |
| P0-4 | **tile_changelog MOD-11 korrigieren** | DB | Keine "Zone 3 Marktplatz" Einträge |
| P0-5 | **MOD-07 Sub-Tiles umstellen** | Code + DB | 4 neue Tabs: Selbstauskunft, Neue Finanzierung, Kalkulation & Objekt, Status |
| P0-6 | **MOD-07 Legacy Redirects** | Code | `/faelle` → `/status`, `/dokumente` → `/`, `/einstellungen` → `/` |
| P0-7 | **owner_context_id Migration planen** | DB | Migration-SQL vorbereiten (nicht ausführen ohne Freigabe) |

### P1 — WICHTIG (Core Functionality)

| # | Task | Bereich | Acceptance Criteria |
|---|------|---------|---------------------|
| P1-1 | **MOD-07 Owner-Kontext Picker** | Code | Vor Selbstauskunft wird Kontext aus MOD-04 gewählt |
| P1-2 | **Zone-1 Manager-Picker Dialog** | Code | Bei "Zuweisen" öffnet sich Dialog mit User-Liste (Rolle `finance_manager`) |
| P1-3 | **Zone-1 Delegation Audit** | Code | Bei Delegation wird `audit_events` Eintrag erstellt |
| P1-4 | **MOD-11 Screen 1 Umbau** | Code | Collapsible Intro + Mandate Inbox + Provisionsvereinbarung (Consent) |
| P1-5 | **MOD-11 Screen 2 "Bearbeitung"** | Code | Route `/bearbeitung` statt `/selbstauskunft` |
| P1-6 | **Status-Spiegel MOD-07** | Code | Nach Einreichung ist Request in MOD-07 read-only, zeigt Mandat-/Case-Status |
| P1-7 | **System-Mail bei Acceptance** | Code | Edge Function sendet Mail an Kunde + Partner |

### P2 — NICE-TO-HAVE (Enhancements)

| # | Task | Bereich | Acceptance Criteria |
|---|------|---------|---------------------|
| P2-1 | **DMS/JSON Paired Pipeline** | Code | Upload → Worker → JSON → Feld-Mapping (kein neue Tabellen) |
| P2-2 | **Readiness Gate** | Code | Checkliste prüft Pflichtdokumente vor Einreichung |
| P2-3 | **PDF Export für Bank-Einreichung** | Code | PDF mit Selbstauskunft + Kalkulation + Objektübersicht |
| P2-4 | **E-Mail Editor in MOD-11** | Code | KI-Draft + Empfänger-Auswahl + Anhänge |

---

## TEIL 5: DETAILLIERTE ÄNDERUNGEN

### 5.1 Code-Änderungen MOD-07

**Datei: `src/pages/portal/FinanzierungPage.tsx`**
```typescript
// VORHER (IST)
const tabs = [
  { value: '', label: 'Dashboard', ... },
  { value: 'faelle', label: 'Fälle', ... },
  { value: 'dokumente', label: 'Dokumente', ... },
  { value: 'einstellungen', label: 'Einstellungen', ... },
];

// NACHHER (SOLL)
const tabs = [
  { value: '', label: 'Selbstauskunft', icon: User, path: '/portal/finanzierung' },
  { value: 'neu', label: 'Neue Finanzierung', icon: Plus, path: '/portal/finanzierung/neu' },
  { value: 'kalkulation', label: 'Kalkulation & Objekt', icon: Calculator, path: '/portal/finanzierung/kalkulation' },
  { value: 'status', label: 'Status', icon: Clock, path: '/portal/finanzierung/status' },
];
```

**Neue Dateien:**
- `src/pages/portal/finanzierung/SelbstauskunftTab.tsx` — Ersetzt DashboardTab
- `src/pages/portal/finanzierung/NeuTab.tsx` — Wizard für neue Finanzierung
- `src/pages/portal/finanzierung/KalkulationTab.tsx` — Objektwahl + Rechner
- `src/pages/portal/finanzierung/StatusTab.tsx` — Liste + Detail-Ansicht

**Legacy Redirects (in Routes):**
```typescript
<Route path="faelle" element={<Navigate to="/portal/finanzierung/status" replace />} />
<Route path="faelle/:id" element={<LegacyFaelleRedirect />} />
<Route path="dokumente" element={<Navigate to="/portal/finanzierung" replace />} />
<Route path="einstellungen" element={<Navigate to="/portal/finanzierung" replace />} />
```

### 5.2 Code-Änderungen Zone-1 FutureRoom

**Datei: `src/components/admin/futureroom/MandateInbox.tsx`**
```typescript
// ERGÄNZEN: Manager-Picker bei "Zuweisen"
{mandate.status === 'triage' && (
  <DelegateManagerDialog 
    mandateId={mandate.id}
    onDelegated={() => refetch()}
  />
)}
```

**Neue Komponente: `src/components/admin/futureroom/DelegateManagerDialog.tsx`**
- Lädt User mit Rolle `finance_manager`
- Setzt `assigned_manager_id`, `delegated_at`, `delegated_by`
- Erstellt Audit-Event

### 5.3 Code-Änderungen MOD-11

**Datei: `src/pages/portal/FinanzierungsmanagerPage.tsx`**
```typescript
// VORHER (IST)
const tabs = [
  { value: 'how-it-works', ... },
  { value: 'selbstauskunft', ... },
  { value: 'einreichen', ... },
  { value: 'status', ... },
];

// NACHHER (SOLL)
const tabs = [
  { value: '', label: 'Mandate', icon: Inbox, path: '/portal/finanzierungsmanager' },
  { value: 'bearbeitung', label: 'Bearbeitung', icon: FileText, path: '/portal/finanzierungsmanager/bearbeitung' },
  { value: 'einreichen', label: 'Einreichen', icon: Send, path: '/portal/finanzierungsmanager/einreichen' },
  { value: 'status', label: 'Status', icon: Clock, path: '/portal/finanzierungsmanager/status' },
];
```

**Screen 1 Struktur (Mandate Tab):**
```typescript
export default function MandateTab() {
  return (
    <div className="space-y-6">
      {/* Collapsible How It Works */}
      <Collapsible>
        <CollapsibleTrigger>
          <Lightbulb /> So funktioniert's
        </CollapsibleTrigger>
        <CollapsibleContent>
          {/* Kurze Erklärung */}
        </CollapsibleContent>
      </Collapsible>

      {/* Mandate Inbox */}
      <ManagerMandateInbox />

      {/* Bei Klick auf Annehmen: */}
      <AcceptMandateDialog 
        onAccept={() => {
          // 1. Consent einholen (Provisionsvereinbarung)
          // 2. status = accepted
          // 3. future_room_cases INSERT
          // 4. System-Mail
        }}
      />
    </div>
  );
}
```

### 5.4 Datenbank-Änderungen

**tile_catalog UPDATE (MOD-11):**
```sql
UPDATE tile_catalog SET
  flowchart_mermaid = 'graph TD
    A[Mandat delegiert] --> B[Manager-Inbox]
    B --> C{Annehmen?}
    C -->|Ja| D[Provisions-Consent]
    D --> E[Case erzeugen]
    E --> F[Selbstauskunft prüfen]
    F --> G[Datenraum prüfen]
    G --> H{Bereit?}
    H -->|Ja| I[Bank wählen]
    I --> J[Einreichen]
    J --> K[Status tracken]
    H -->|Nein| L[Nachfordern]
    L --> F
    C -->|Nein| M[Ablehnen]',
  sub_tiles = '[
    {"route": "/portal/finanzierungsmanager", "title": "Mandate"},
    {"route": "/portal/finanzierungsmanager/bearbeitung", "title": "Bearbeitung"},
    {"route": "/portal/finanzierungsmanager/einreichen", "title": "Einreichen"},
    {"route": "/portal/finanzierungsmanager/status", "title": "Status"}
  ]'::jsonb
WHERE tile_code = 'MOD-11';
```

**tile_catalog UPDATE (MOD-07):**
```sql
UPDATE tile_catalog SET
  sub_tiles = '[
    {"route": "/portal/finanzierung", "title": "Selbstauskunft"},
    {"route": "/portal/finanzierung/neu", "title": "Neue Finanzierung"},
    {"route": "/portal/finanzierung/kalkulation", "title": "Kalkulation & Objekt"},
    {"route": "/portal/finanzierung/status", "title": "Status"}
  ]'::jsonb
WHERE tile_code = 'MOD-07';
```

**tile_api_internal PURGE + INSERT (MOD-11):**
```sql
DELETE FROM tile_api_internal WHERE tile_code = 'MOD-11';

INSERT INTO tile_api_internal (tile_code, api_id, endpoint, method, auth_roles, description) VALUES
('MOD-11', 'API-1101', '/future_room_cases', 'GET', ARRAY['finance_manager'], 'Liste der angenommenen Cases'),
('MOD-11', 'API-1102', '/future_room_cases', 'POST', ARRAY['finance_manager'], 'Case erstellen bei Acceptance'),
('MOD-11', 'API-1103', '/future_room_cases/:id', 'PATCH', ARRAY['finance_manager'], 'Case-Status aktualisieren'),
('MOD-11', 'API-1104', '/finance_mandates', 'GET', ARRAY['finance_manager'], 'Delegierte Mandate abrufen'),
('MOD-11', 'API-1105', '/finance_mandates/:id', 'PATCH', ARRAY['finance_manager'], 'Mandat annehmen'),
('MOD-11', 'API-1106', '/applicant_profiles/:id', 'GET', ARRAY['finance_manager'], 'Selbstauskunft lesen'),
('MOD-11', 'API-1107', '/applicant_profiles/:id', 'PATCH', ARRAY['finance_manager'], 'Selbstauskunft nachpflegen'),
('MOD-11', 'API-1108', '/finance_bank_contacts', 'GET', ARRAY['finance_manager'], 'Bankkontakte abrufen'),
('MOD-11', 'API-1109', '/finance_requests/:id', 'GET', ARRAY['finance_manager'], 'Request-Daten lesen');
```

**tile_changelog PURGE + INSERT (MOD-11):**
```sql
DELETE FROM tile_changelog WHERE tile_code = 'MOD-11';

INSERT INTO tile_changelog (tile_code, version, release_date, summary, changes) VALUES
('MOD-11', '1.0.0', '2026-01-28', 'Initial Release: Finanzierungsmanager', 
  '["Mandate Inbox für delegierte Anfragen", "Provisions-Consent bei Annahme", "Selbstauskunft-Bearbeitung", "Bank-Einreichung per E-Mail/Plattform", "Status-Spiegelung"]'::jsonb);
```

**Migration MIGRATE-FIN-001 (VORBEREITEN, NICHT AUSFÜHREN):**
```sql
-- owner_context_id zu applicant_profiles hinzufügen
ALTER TABLE applicant_profiles 
ADD COLUMN owner_context_id uuid REFERENCES owner_contexts(id);

-- owner_context_id zu finance_requests hinzufügen
ALTER TABLE finance_requests 
ADD COLUMN owner_context_id uuid REFERENCES owner_contexts(id);

-- Index für Performance
CREATE INDEX idx_applicant_profiles_owner_context 
ON applicant_profiles(owner_context_id);

CREATE INDEX idx_finance_requests_owner_context 
ON finance_requests(owner_context_id);
```

---

## TEIL 6: DOKUMENTATION

### 6.1 Neue Spec-Datei: `docs/modules/MOD-11_FINANZIERUNGSMANAGER.md`

```markdown
# MOD-11 — FINANZIERUNGSMANAGER

**Version:** v1.0.0  
**Status:** COMPLETE SPEC  
**Datum:** 2026-01-28  
**Zone:** 2 (User Portal)  
**Typ:** SPEZIALISTENMODUL (für Rolle finance_manager)  
**Route-Prefix:** `/portal/finanzierungsmanager`  
**API-Range:** API-1100 bis API-1199  

## 1) MODULDEFINITION

### 1.1 Zweck
MOD-11 ist das Arbeitsmodul für Finanzierungsmanager. Nach Delegation eines 
Mandats durch Zone-1 Admin übernimmt der Manager die Bearbeitung, prüft 
Unterlagen, und reicht bei Banken ein.

### 1.2 Zielnutzer / Rollen
| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| `finance_manager` | Full | Bearbeitet delegierte Mandate |

### 1.3 Inputs
- `finance_mandates` mit status=delegated + assigned_manager_id=auth.uid()
- `finance_requests` (read)
- `applicant_profiles` (read/write)
- `finance_bank_contacts` (read)

### 1.4 Outputs
- `future_room_cases` (create/update)
- Bank-Einreichung (E-Mail/Plattform)
- Status-Updates → Spiegelung an Zone-1 + MOD-07

## 2) SOURCE OF TRUTH
- **Phase 1-2 (draft → delegated):** Zone-1 ist SoT
- **Phase 3 (accepted → closed):** MOD-11 ist SoT

## 3) SUB-TILES (4 Menüpunkte)
1. Mandate — Inbox + Annahme + Consent
2. Bearbeitung — Case-Detail + Selbstauskunft + Datenraum
3. Einreichen — Bank-Auswahl + E-Mail/Plattform
4. Status — Timeline + Rückmeldungen
```

### 6.2 A3_Zone2_ModuleStructure.md Update

Ergänzen:
```markdown
## Module 11: Finanzierungsmanager (Spezialistenmodul)

**Typ:** Addon für Rolle `finance_manager`
**Base Route:** `/portal/finanzierungsmanager`
**Sub-Tiles:** Mandate, Bearbeitung, Einreichen, Status
**Abhängig von:** Zone-1 FutureRoom (Mandate-Delegation), MOD-07 (Quelldaten)
```

---

## TEIL 7: NO-TOUCH BESTÄTIGUNG

Die folgenden Bereiche werden **NICHT** angefasst:

- ❌ MOD-01 Stammdaten
- ❌ MOD-02 KI Office
- ❌ MOD-03 DMS (nur Nutzung bestehender APIs)
- ❌ MOD-04 Immobilien (nur Lesen von Kontexten)
- ❌ MOD-05 MSV
- ❌ MOD-06 Verkauf
- ❌ MOD-08 Investments (nur Lesen von Favoriten)
- ❌ MOD-09 Vertriebspartner
- ❌ MOD-10 Leads
- ❌ Zone-3 Websites (Kaufy, Miety, SoT, FutureRoom.io)
- ❌ Zone-1 Admin (außer /admin/futureroom)

---

## ZUSAMMENFASSUNG

### Sofort umsetzbar (P0):
1. MOD-11 Spec-Datei erstellen
2. tile_catalog/api_internal/changelog für MOD-11 korrigieren
3. MOD-07 Sub-Tiles umstellen + Legacy Redirects
4. owner_context_id Migration vorbereiten

### Nach Freigabe (P1):
1. Owner-Kontext Picker in MOD-07
2. Manager-Picker in Zone-1
3. MOD-11 Screen 1 Umbau (Mandate Inbox + Consent)
4. Status-Spiegel in MOD-07

### E2E Testflow nach Implementierung:
1. MOD-04: Eigentümer-Kontext anlegen
2. MOD-07: Selbstauskunft ausfüllen → Neue Finanzierung → Objekt wählen → Einreichen
3. Zone-1: Mandat prüfen → Manager zuweisen
4. MOD-11: Mandat annehmen → Bearbeiten → Bei Bank einreichen
5. Prüfen: Status-Spiegel in MOD-07 + Zone-1
