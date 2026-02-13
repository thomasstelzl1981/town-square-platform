
# Widget-Loeschfunktion + Archiv-Strategie

## Ueberblick

Es wird eine einheitliche Loesch-Interaktion fuer alle Widget-Karten (WidgetCell) eingefuehrt. Per Mouse-Over erscheint ein kleiner Papierkorb-Button. Beim Klick oeffnet sich ein AlertDialog zur Bestaetigung. Die Loeschung folgt dem bestehenden Architektur-Muster des Projekts.

## Bestehende Loesch-/Archiv-Architektur (Analyse)

Das Projekt nutzt **zwei verschiedene Strategien**, je nach Entitaetstyp:

| Strategie | Tabellen | Mechanismus |
|-----------|----------|-------------|
| **Soft-Delete (DSGVO)** | `contacts`, `profiles`, `applicant_profiles`, `self_disclosures`, `leads`, `renter_invites`, `partner_deals`, `finance_bank_contacts`, `dms_documents`, `dms_nodes` | `deleted_at TIMESTAMPTZ` Spalte |
| **Status-Transition** | `service_cases`, `finance_requests`, `acq_mandates`, `task_widgets` | Status wird auf `cancelled`/`archived` gesetzt |

Fuer die Business-Entitaeten (Finanzierung, Sanierung, Akquise) gibt es **kein Hard-Delete**. Sie nutzen Status-basierte State-Machines mit DB-seitigem Trigger-Schutz. Das bedeutet: Loeschen = Status auf `cancelled` setzen. Die Daten bleiben fuer Audit/Archiv erhalten.

**Empfehlung:** Wir folgen dem bestehenden Muster — `cancelled` fuer Geschaeftsvorgaenge, `deleted_at` nur fuer PII-Tabellen.

---

## Aenderung 1: Wiederverwendbare Delete-Overlay-Komponente (NEUE DATEI)

**Datei:** `src/components/shared/WidgetDeleteOverlay.tsx`

Eine kleine Overlay-Komponente, die in jede Widget-Karte eingebettet werden kann:

```text
+---------------------------+
| [Karten-Inhalt]           |
|                           |
|              [Papierkorb] |  <-- nur bei Hover sichtbar (oben rechts)
+---------------------------+
```

- Papierkorb-Icon (`Trash2`, 16px) oben rechts, `absolute` positioniert
- Nur bei Mouse-Over der gesamten Karte sichtbar (`opacity-0 group-hover:opacity-100`)
- Klick stoppt Event-Propagation (verhindert Karten-Klick)
- Oeffnet einen `AlertDialog` mit:
  - Titel: "Widget loeschen?"
  - Beschreibung: "Moechten Sie dieses Widget wirklich loeschen? Der Vorgang wird archiviert."
  - Buttons: "Abbrechen" / "Loeschen" (destructive)
- `onConfirmDelete` Callback fuer die uebergeordnete Komponente

### Props
- `title: string` — Name des Widgets fuer die Bestaetigung
- `onConfirmDelete: () => void` — Wird nach Bestaetigung aufgerufen
- `isDeleting?: boolean` — Zeigt Spinner waehrend der Ausfuehrung
- `disabled?: boolean` — Deaktiviert den Button (z.B. bei geschuetzten Status)

---

## Aenderung 2: ServiceCaseCard (Sanierung) — Delete-Overlay integrieren

**Datei:** `src/components/sanierung/ServiceCaseCard.tsx`

- `WidgetDeleteOverlay` als Overlay in die Card einbauen
- Neue Props: `onDelete?: (id: string) => void`, `isDeleting?: boolean`
- Delete nur anzeigen wenn Status `draft` oder `cancelled` ist (Memory: Sanierung erlaubt Loeschung nur bei diesen Status)
- Die Card benoetigt `group` Klasse (bereits vorhanden) und `relative` fuer die Positionierung

---

## Aenderung 3: FinanceCaseCard (Finanzierung) — Delete-Overlay integrieren

**Datei:** `src/components/finanzierungsmanager/FinanceCaseCard.tsx`

- Gleiche Integration wie ServiceCaseCard
- Neue Props: `onDelete?: (requestId: string) => void`, `isDeleting?: boolean`
- Delete nur bei Status `draft` anzeigen (eingereichte Antraege koennen nicht geloescht werden)

---

## Aenderung 4: MandateCaseCard (Akquise) — Delete-Overlay integrieren

**Datei:** `src/components/akquise/MandateCaseCard.tsx`

- Gleiche Integration
- Neue Props: `onDelete?: (id: string) => void`, `isDeleting?: boolean`
- Delete nur bei Status `draft` anzeigen

---

## Aenderung 5: Hook-Erweiterungen fuer Cancel/Archive

### useServiceCases — Cancel-Mutation hinzufuegen

**Datei:** `src/hooks/useServiceCases.ts`

- Neue exportierte Mutation `useCancelServiceCase()`:
  - Update: `status = 'cancelled'`, `completed_at = now()`
  - Invalidiert Query-Cache

### useFinanceCases — Cancel-Mutation (oder bestehenden Hook erweitern)

Relevante Hook-Datei identifizieren und Cancel-Mutation hinzufuegen:
- Update: `finance_requests.status = 'cancelled'`

### useAcqMandates — Cancel-Mutation

Relevante Hook-Datei identifizieren und Cancel-Mutation hinzufuegen:
- Update: `acq_mandates.status = 'cancelled'`

---

## Aenderung 6: Dashboard-Integration

### SanierungTab

**Datei:** `src/pages/portal/immobilien/SanierungTab.tsx`

- `onDelete` Prop an `ServiceCaseCard` durchreichen
- `useCancelServiceCase` Hook nutzen

### Finanzierungsmanager Dashboard

Relevante Datei: Die Seite, die `FinanceCaseCard` als Widgets rendert
- `onDelete` Prop durchreichen

### Akquise-Manager Dashboard

Relevante Datei: Die Seite, die `MandateCaseCard` als Widgets rendert
- `onDelete` Prop durchreichen

---

## Zusammenfassung der Loesch-Logik

| Modul | Tabelle | Loesch-Aktion | Erlaubte Status |
|-------|---------|---------------|-----------------|
| Sanierung | `service_cases` | `status -> cancelled` | `draft`, `cancelled` |
| Finanzierung | `finance_requests` | `status -> cancelled` | `draft` |
| Akquise | `acq_mandates` | `status -> cancelled` | `draft` |
| Task Widgets | `task_widgets` | `status -> cancelled` | `pending` (bereits implementiert) |

Kein Hard-Delete. Alle "geloeschten" Vorgaenge bleiben in der DB mit Status `cancelled` fuer Audit-Zwecke. Die Dashboard-Filter zeigen sie nicht mehr an (bestehender Filter `!['completed', 'cancelled']`).

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| NEU | `src/components/shared/WidgetDeleteOverlay.tsx` — Wiederverwendbare Hover-Papierkorb + AlertDialog Komponente |
| EDIT | `src/components/sanierung/ServiceCaseCard.tsx` — Delete-Overlay integrieren |
| EDIT | `src/components/finanzierungsmanager/FinanceCaseCard.tsx` — Delete-Overlay integrieren |
| EDIT | `src/components/akquise/MandateCaseCard.tsx` — Delete-Overlay integrieren |
| EDIT | `src/hooks/useServiceCases.ts` — Cancel-Mutation hinzufuegen |
| EDIT | Finanzierungs-Hook — Cancel-Mutation hinzufuegen |
| EDIT | Akquise-Hook — Cancel-Mutation hinzufuegen |
| EDIT | `src/pages/portal/immobilien/SanierungTab.tsx` — onDelete durchreichen |
| EDIT | FM-Dashboard — onDelete durchreichen |
| EDIT | AM-Dashboard — onDelete durchreichen |

Keine Datenbank-Migration noetig. Die bestehenden Status-Felder und State-Machine-Trigger decken `cancelled` bereits ab.
