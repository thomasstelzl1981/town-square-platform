# MOD-11 — FINANZIERUNGSMANAGER (Finance Manager Workbench)

**Version:** v2.0.0  
**Status:** ACTIVE  
**Datum:** 2026-02-07  
**Zone:** 2 (User Portal — Partner)  
**Typ:** ROLE-GATED (requires finance_manager)  
**Route-Prefix:** `/portal/finanzierungsmanager`  
**Abhängig von:** Zone 1 FutureRoom, MOD-07 (Finanzierung), Backbone (Audit)

---

## 1) MODULDEFINITION

### 1.1 Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/finanzierungsmanager` |
| **Icon** | `Landmark` |
| **Org-Types** | `partner` |
| **Requires Role** | `finance_manager` |
| **Display Order** | 11 |

### 1.2 Zweck

MOD-11 „Finanzierungsmanager" ist die **operative Workbench** für Benutzer mit der Rolle `finance_manager`. Es dient der Bearbeitung von Finanzierungsfällen, die über Zone 1 FutureRoom delegiert wurden.

**WICHTIG:** MOD-11 wird erst zum SoT (Source of Truth), nachdem der Manager das Mandat angenommen hat. Davor ist Zone 1 FutureRoom SoT.

### 1.3 Zielnutzer / Rollen

| Rolle | Zugang | Beschreibung |
|-------|--------|--------------|
| `finance_manager` | Full | Alle Funktionen |
| `org_admin` | None | Kein Zugang (Role-Gate) |
| `member` | None | Kein Zugang (Role-Gate) |

### 1.4 Scope IN

- Zugewiesene Mandate annehmen
- Kundendaten (Selbstauskunft) prüfen
- Dokumente sichten
- Status-Updates pflegen
- Rückfragen an Kunden stellen
- Bank-Einreichung vorbereiten

### 1.5 Scope OUT (Nicht-Ziele)

- ❌ Keine Selbstauskunft-Bearbeitung (nur Ansicht)
- ❌ Keine Mandate-Erstellung (kommt aus MOD-07 via Zone 1)
- ❌ Keine direkte Kommunikation (läuft über Backbone)

---

## 2) ARCHITEKTUR-POSITION

### 2.1 Finanzierungs-Triade (MOD-11 Position)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FINANZIERUNGS-TRIADE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   MOD-07 (Kunde)        Zone 1 (FutureRoom)     MOD-11 (Manager)       │
│   ═══════════════       ═══════════════════     ════════════════       │
│   Datenerfassung   ──►  Triage + Delegation ──► Bank-Übergabe          │
│   Dokumentenupload      Zuweisung an Manager    Europace API           │
│   Status-Ansicht        Monitoring              Kundenkommunikation    │
│                                                                         │
│   SoT: draft..ready     SoT: submitted..assigned    SoT: in_review+    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 SoT-Wechsel bei Annahme

```
Zone 1 (assigned) ──► Manager akzeptiert ──► MOD-11 wird SoT
                           │
                           ├─► future_room_cases erstellt
                           ├─► finance_mandates.status = 'accepted'
                           └─► Notification an Kunde (Edge Function)
```

---

## 3) ROUTE-STRUKTUR (4-Tile-Pattern)

### 3.1 Haupt-Tiles (AKTUELL IMPLEMENTIERT)

| Route | UI-Label | Komponente | Beschreibung |
|-------|----------|------------|--------------|
| `/portal/finanzierungsmanager/dashboard` | Dashboard | FMDashboard | KPIs + aktuelle Fälle |
| `/portal/finanzierungsmanager/faelle` | Fälle | FMFaelle | Alle zugewiesenen Fälle |
| `/portal/finanzierungsmanager/kommunikation` | Kommunikation | FMKommunikation | Outbound Log |
| `/portal/finanzierungsmanager/status` | Status | FMStatus | Audit Trail |

### 3.2 Dynamische Routes

| Route | Komponente | Beschreibung |
|-------|------------|--------------|
| `/portal/finanzierungsmanager/faelle/:requestId` | FMFallDetail | Fall-Detailansicht |

---

## 4) DATENMODELL

### 4.1 Kerntabellen

#### A) `future_room_cases` (MOD-11 SoT nach Annahme)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| manager_tenant_id | uuid FK | Tenant des Managers |
| finance_mandate_id | uuid FK | Referenz zum Mandat |
| status | text | `active`, `missing_docs`, `submitted`, `closed` |
| target_bank_id | uuid FK | Zielbank (Phase 2) |
| submitted_to_bank_at | timestamptz | Einreichungszeitpunkt |
| bank_response | text | Bankantwort |
| first_action_at | timestamptz | Erste Aktion des Managers |
| created_at | timestamptz | — |
| updated_at | timestamptz | — |

#### B) `finance_mandates` (gelesen via Zone 1)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | uuid PK | — |
| tenant_id | uuid FK | Kunde-Tenant |
| finance_request_id | uuid FK | → finance_requests |
| status | text | `new`, `assigned`, `accepted`, etc. |
| assigned_manager_id | uuid FK | → auth.users (Manager) |
| delegated_at | timestamptz | Zuweisungszeitpunkt |
| accepted_at | timestamptz | Annahmezeitpunkt |

### 4.2 Status-Maschine (MOD-11 Scope)

```
accepted (entry) → in_processing → needs_customer_action → bank_submitted → completed
                                                                          ↘ rejected
```

| Status | Beschreibung |
|--------|--------------|
| `in_processing` | Manager prüft Unterlagen |
| `needs_customer_action` | Rückfrage an Kunde |
| `bank_submitted` | Bei Bank eingereicht |
| `completed` | Erfolgreich abgeschlossen |
| `rejected` | Abgelehnt |

---

## 5) HOOKS & APIs

### 5.1 Hooks

| Hook | Datei | Beschreibung |
|------|-------|--------------|
| `useFutureRoomCases` | useFinanceMandate.ts | Alle Cases für Manager |
| `useAcceptMandate` | useFinanceMandate.ts | Mandat annehmen + Case erstellen |
| `useUpdateRequestStatus` | useFinanceRequest.ts | Status-Updates in finance_requests |

### 5.2 Edge Functions

| Function | Status | Beschreibung |
|----------|--------|--------------|
| `sot-finance-manager-notify` | ✅ Implementiert | Notification bei Annahme |
| `sot-europace-submit` | 🔜 Phase 2 | Bank-Einreichung (Europace API) |

---

## 6) UI-KOMPONENTEN

### 6.1 FMDashboard

- 4 KPI-Cards: Neu zugewiesen, In Bearbeitung, Warte auf Kunde, Abgeschlossen
- Aktuelle Fälle Liste (Top 5)
- Quick Navigation zu Fälle-Tab

### 6.2 FMFaelle

- Tabelle aller Fälle
- Suche nach Name/ID
- Status-Badges mit zentralisierten Labels
- "Öffnen" Button → FMFallDetail

### 6.3 FMFallDetail

- **Linke Spalte (2/3):**
  - Antragsteller-Card (read-only Selbstauskunft-Summary)
  - Objekt-Card (Property oder Custom Object)
  - Finanzierungsdaten-Card
- **Rechte Spalte (1/3):**
  - Aktionen (Status ändern, Rückfrage)
  - Interne Notizen

### 6.4 FMKommunikation

- Outbound Message Log (Placeholder)
- Verknüpfung zu Backbone Messaging (Phase 2)

### 6.5 FMStatus

- Audit Trail für Manager-Aktionen
- Case-Lifecycle Übersicht

---

## 7) ROLE-GATE IMPLEMENTIERUNG

```typescript
// FinanzierungsmanagerPage.tsx Line 38-54
const isFinanceManager = memberships.some(m => m.role === 'finance_manager');

if (!isFinanceManager) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h3>Kein Zugriff</h3>
        <p>Dieses Modul ist nur für verifizierte Finanzierungsmanager zugänglich.</p>
      </CardContent>
    </Card>
  );
}
```

---

## 8) DATEIEN IM REPOSITORY

### 8.1 Pages

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | Haupt-Router + Role-Gate |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | Dashboard |
| `src/pages/portal/finanzierungsmanager/FMFaelle.tsx` | Fälle-Liste |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | Fall-Detail |
| `src/pages/portal/finanzierungsmanager/FMKommunikation.tsx` | Kommunikation |
| `src/pages/portal/finanzierungsmanager/FMStatus.tsx` | Status/Audit |
| `src/pages/portal/finanzierungsmanager/index.ts` | Exporte |

### 8.2 Hooks

| Datei | Beschreibung |
|-------|--------------|
| `src/hooks/useFinanceMandate.ts` | Mandate + Cases Hooks |
| `src/hooks/useFinanceRequest.ts` | Request Updates |

---

## 9) INTEGRATION

### 9.1 Abhängigkeiten

| Modul | Art | Beschreibung |
|-------|-----|--------------|
| MOD-07 (Finanzierung) | Read | Liefert initiale Anfragen |
| Zone 1 FutureRoom | Read/Write | Mandats-Delegation, Bank-Directory |
| MOD-04 (Immobilien) | Read | Objektdaten für Finanzierung |

### 9.2 Datenfluss

```
MOD-07 → Zone 1 FutureRoom → MOD-11 → Bank
   │           │                │
   │           │                └── Status-Mirror zurück
   │           └── Mandate erstellen + delegieren
   └── Selbstauskunft + Dokumente + Anfrage
```

---

## 10) CHANGELOG

| Version | Datum | Änderung |
|---------|-------|----------|
| v1.0.0 | 2026-01-26 | Initial Spec |
| **v2.0.0** | **2026-02-07** | **Komplette Überarbeitung:** 4-Tile-Pattern (Dashboard/Fälle/Kommunikation/Status), Role-Gate dokumentiert, FutureRoomCase Integration, Hooks-Inventar |

---

*Dieses Dokument ist der verbindliche Spezifikationsstand für MOD-11.*
