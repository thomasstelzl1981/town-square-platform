
# Geldeingang-Tab + Mahn-Automatismus — Immobilienakte (MOD-04)

## Uebersicht

Die Immobilienakte erhaelt einen neuen Tab **"Geldeingang"** im Slider (TabsList). Dort werden Mietzahlungen pro Mietverhaeltnis dokumentiert: Eingang (Ist) neben Soll (Warmmiete). Zusaetzlich wird ein Automatismus implementiert, der am 10. des Monats bei Rueckstand ein Aufgaben-Widget auf dem Dashboard erstellt, das direkt zum Briefgenerator fuer eine Mahnung verlinkt.

---

## Teil 1: Neuer Tab "Geldeingang" in der Immobilienakte

### Position im Slider

Der neue Tab wird zwischen "Mietverhaeltnis" und "Datenraum" eingefuegt:

```text
Akte | Simulation | Expose | Verkaufsauftrag | Bewertung | Mietverhaeltnis | Geldeingang | Datenraum
```

### Inhalt des Tabs

Der Tab zeigt pro aktivem Mietvertrag (Lease) eine beschriftete Tabelle:

**Tabellen-Header:**
| Monat | Soll (Warmmiete) | Eingang | Differenz | Status | Datum |

- **Soll** = Warmmiete aus dem Lease (`monthly_rent` bzw. `rent_cold_eur + nk_advance_eur + heating_advance_eur`)
- **Eingang** = tatsaechlich eingegangener Betrag aus `rent_payments`
- **Differenz** = Soll - Eingang (rot wenn negativ, gruen wenn ausgeglichen)
- **Status** = Badge (Bezahlt / Offen / Teilweise / Ueberfaellig)
- **Datum** = `paid_date` aus `rent_payments`

Die Tabelle zeigt die letzten 12 Monate (aktueller Monat bis 11 Monate zurueck).

### Konto-Zuordnung (oben im Tab)

Oberhalb der Tabelle erscheint ein Steuerungs-Bereich:

1. **Aktivierungs-Button**: "Automatischen Abgleich aktivieren" (Toggle/Switch)
2. **Dropdown**: Auswahl des Kontos, auf dem die Miete eingeht — zeigt alle Konten aus `msv_bank_accounts` des Tenants
3. Info-Text: "Waehlen Sie das Konto, auf dem die Mietzahlungen eingehen. Die Konten verwalten Sie unter Finanzanalyse > Uebersicht."

### Manuelle Zahlungserfassung

Ein Button "Zahlung erfassen" oeffnet ein Inline-Formular:
- Betrag (vorausgefuellt mit Warmmiete)
- Datum (vorausgefuellt mit heute)
- Notiz (optional)

Speichert in die bestehende `rent_payments` Tabelle.

---

## Teil 2: Automatismus — Mahn-Widget am 10. des Monats

### Logik

Ein Edge Function (Cron oder manuell triggerbar) prueft am 10. jedes Monats:

1. Alle aktiven Leases mit `payment_due_day` <= 10
2. Fuer den aktuellen Monat: Gibt es einen `rent_payments`-Eintrag mit `status = 'paid'`?
3. Falls NEIN → Erstelle ein `task_widget` mit `type: 'letter'` auf dem Dashboard

### Task Widget Inhalt

```text
type: 'letter'
title: 'Mietrueckstand: [Mieter-Name]'
description: 'Fuer [Monat] steht noch keine Mietzahlung aus. Mahnung erstellen?'
parameters: {
  leaseId: '...',
  contactId: '...',
  propertyId: '...',
  letterType: 'mahnung',
  amount: [Warmmiete],
  period: '2026-02'
}
action_code: 'ARM.RENT.REMINDER'
```

### Widget-Aktion (Klick auf Bestaetigen)

Beim Klick auf das Widget:
1. Oeffnet den Briefgenerator (`/portal/office/brief`)
2. Kontakt ist vorausgewaehlt (Mieter)
3. KI hat bereits ein Mahnschreiben vorbereitet (via URL-Parameter `prompt`)
4. Im Brief-Tab erscheint ein **Versand-Dialog** (Popup):
   - **Per E-Mail direkt an Mieter** (wenn E-Mail vorhanden)
   - **Per E-Mail an Briefdienst** (Fax/Post)
5. Nach Versand: Brief wird im Kontakt-Verlauf abgelegt (bereits bestehende DMS-Logik)

---

## Teil 3: Datenbank-Aenderungen

### Neue Spalte: `leases.linked_bank_account_id`

```sql
ALTER TABLE leases ADD COLUMN linked_bank_account_id UUID REFERENCES msv_bank_accounts(id);
ALTER TABLE leases ADD COLUMN auto_match_enabled BOOLEAN DEFAULT false;
```

Dies speichert pro Lease, welches Konto zugeordnet ist und ob der automatische Abgleich aktiv ist.

### Bestehende Tabelle `rent_payments` (bereits vorhanden)

Die Tabelle existiert bereits mit allen benoetigten Spalten:
- `lease_id`, `tenant_id`, `amount`, `expected_amount`, `due_date`, `paid_date`, `status`, `matched_transaction_id`, `notes`

Keine Schema-Aenderung noetig.

### Bestehende Tabelle `task_widgets` (bereits vorhanden)

Das Widget-System ist bereits vollstaendig implementiert mit Realtime-Updates. Keine Aenderung noetig.

---

## Teil 4: Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/components/portfolio/GeldeingangTab.tsx` | Neuer Tab: Konto-Auswahl, Zahlungs-Tabelle (12 Monate), manuelle Erfassung |
| `supabase/functions/sot-rent-arrears-check/index.ts` | Edge Function: Prueft Rueckstaende und erstellt Task-Widgets |

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Neuer TabsTrigger "Geldeingang" + TabsContent mit GeldeingangTab |
| `src/components/dashboard/TaskWidget.tsx` | Erweiterte onClick-Logik fuer `letterType: 'mahnung'` → Briefgenerator mit vorbereiteten Parametern |

### DB-Migration

```sql
ALTER TABLE leases ADD COLUMN linked_bank_account_id UUID REFERENCES msv_bank_accounts(id);
ALTER TABLE leases ADD COLUMN auto_match_enabled BOOLEAN DEFAULT false;
```

---

## Technischer Ablauf

### Zahlungserfassung (manuell)

```text
User oeffnet Geldeingang-Tab
  → Sieht 12-Monats-Tabelle mit Soll/Ist
  → Klickt "Zahlung erfassen"
  → Gibt Betrag + Datum ein
  → INSERT in rent_payments (lease_id, amount, expected_amount=Warmmiete, due_date, paid_date, status='paid')
  → Tabelle aktualisiert sich
```

### Mahn-Automatismus

```text
Edge Function (Cron: 10. des Monats oder manueller Trigger)
  → SELECT alle aktiven Leases
  → Fuer jeden Lease: Pruefe rent_payments fuer aktuellen Monat
  → Kein Eintrag oder status != 'paid'?
    → INSERT task_widget (type='letter', title='Mietrueckstand: [Name]', ...)
  → Dashboard zeigt Widget via Realtime

User klickt Widget "Bestaetigen"
  → Navigate zu /portal/office/brief?contactId=...&subject=Mahnung&prompt=...
  → KI-Briefgenerator oeffnet mit vorbereitetem Mahnschreiben
  → User entscheidet: E-Mail direkt oder Briefdienst
  → Versand → Ablage bei Kontakt
```
