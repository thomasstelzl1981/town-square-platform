# MOD-07 Anfrage-Tab: Widget-Leiste + Finanzierungsauftrag

## Status: Bereit zur Umsetzung

## Kontext

Der Golden Path GP-02 (MOD_07_11) definiert 7 Phasen. Phase 3 ("Finanzierungsanfrage einreichen") hat bereits Backend-Logik (`useSubmitFinanceRequest`), aber kein vollständiges UI. Es fehlen:
1. Eine Widget-Leiste für Multi-Anfragen (analog Manager-Module)
2. Ein formaler Einreichungs-Block (Finanzierungsauftrag) am Seitenende

## Architektur-Entscheidungen

- **Multi-Anfrage**: Widget-Kacheln oben, Klick navigiert zu `/portal/finanzierung/anfrage/:requestId`
- **Einreichung**: Inline-Block am Seitenende (kein Modal), mit Consent-Checkboxen
- **Datenfluss**: Neue Anfrage → `finance_requests` Insert (status=draft) → Formular ausfüllen → Einreichen → `useSubmitFinanceRequest` (Snapshot + Mandate)

## Umsetzungsplan

### 1. Widget-Leiste für Anfragen (`FinanceRequestWidgets.tsx`)

**Neue Komponente**: `src/components/finanzierung/FinanceRequestWidgets.tsx`

- Query: `finance_requests` WHERE `tenant_id` = active, ORDER BY `created_at` DESC
- Darstellung: Horizontale Widget-Kacheln im `WidgetGrid` (variant `widget`)
  - Jede Kachel zeigt: Public-ID, Status-Badge, Objekt-Adresse (falls vorhanden), Erstelldatum
  - Klick → `navigate('/portal/finanzierung/anfrage/${request.id}')`
  - Aktive Kachel (current requestId) ist visuell hervorgehoben (Ring)
- **Letzte Kachel**: CTA "Neue Anfrage" → Erstellt Draft-Eintrag in `finance_requests`, navigiert zur neuen ID
- CTA-Logik:
  ```
  INSERT INTO finance_requests (tenant_id, status, source)
  VALUES (activeTenantId, 'draft', 'portal')
  RETURNING id → navigate to /anfrage/:id
  ```

### 2. AnfrageTab Umbau

**Datei**: `src/pages/portal/finanzierung/AnfrageTab.tsx`

- Oben: `<FinanceRequestWidgets />` (persistent, immer sichtbar)
- Darunter: Bestehender Formular-Flow (Magic Intake, Kaufy, Eckdaten, Kalkulator, etc.)
- Am Ende: Neuer `<FinanzierungsauftragBlock />` (Einreichung)
- Der AnfrageTab ohne `:requestId` zeigt die Widget-Leiste + den letzten Draft oder eine leere Ansicht
- Der AnfrageTab MIT `:requestId` (AnfrageDetailPage) lädt den spezifischen Request

### 3. Finanzierungsauftrag-Block (`FinanzierungsauftragBlock.tsx`)

**Neue Komponente**: `src/components/finanzierung/FinanzierungsauftragBlock.tsx`

Analog zum `SalesMandateDialog`, aber als Inline-Block:

```
┌──────────────────────────────────────────────────┐
│ FINANZIERUNGSAUFTRAG                             │
│                                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Zusammenfassung                              │ │
│ │ Objekt: [Adresse]   Kaufpreis: [xxx.xxx €]   │ │
│ │ Kreditbedarf: [xxx.xxx €]                    │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Vereinbarung                                     │
│                                                  │
│ ☐ Ich bestätige die Richtigkeit aller Angaben    │
│   in meiner Selbstauskunft und den Objektdaten.  │
│                                                  │
│ ☐ Ich beauftrage die System of a Town GmbH mit   │
│   der Einholung von Finanzierungsangeboten und   │
│   der Vermittlung einer Finanzierung.            │
│                                                  │
│ ☐ Ich bin einverstanden, dass meine Daten und    │
│   Unterlagen an Banken und bei uns unter Vertrag │
│   stehende Finanzierungsmanager weitergegeben    │
│   werden.                                        │
│                                                  │
│         [🔒 Finanzierungsauftrag erteilen]       │
│                                                  │
└──────────────────────────────────────────────────┘
```

- Button disabled solange nicht alle 3 Checkboxen aktiv
- Bei Klick: `useSubmitFinanceRequest.mutate({ requestId })`
- Nach Erfolg: Toast + Navigate zu `/portal/finanzierung/status`
- Consent wird in `user_consents` geloggt (via bestehenden Hook)
- Nur sichtbar wenn `request.status === 'draft'` oder `'collecting'`

### 4. Dateien-Übersicht

| Nr | Datei | Aktion |
|----|-------|--------|
| 1 | `src/components/finanzierung/FinanceRequestWidgets.tsx` | NEU — Widget-Leiste |
| 2 | `src/components/finanzierung/FinanzierungsauftragBlock.tsx` | NEU — Einreichungs-Block |
| 3 | `src/pages/portal/finanzierung/AnfrageTab.tsx` | EDIT — Widget-Leiste + Auftrag-Block einfügen |

### 5. Keine DB-Änderungen nötig

- `finance_requests` Tabelle existiert bereits mit `status`, `submitted_at`, `applicant_snapshot`
- `finance_mandates` Tabelle existiert bereits
- `useSubmitFinanceRequest` Hook ist vollständig implementiert
- `user_consents` und `audit_events` Tabellen existieren

### 6. Nicht im Scope

- MOD-11 Änderungen (separates Arbeitspaket)
- AnfrageDetailPage Umbau (nutzt bereits `AnfrageFormV2`)
- Agreement-Template Anlage (kann nachgelagert in DB eingefügt werden)
