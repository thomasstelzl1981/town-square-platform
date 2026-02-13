
# Armstrong-Bereich von MOD-14 nach Stammdaten/Abrechnung verschieben

## Zusammenfassung

Der "Agenten"-Tab aus MOD-14 (Communication Pro) wird entfernt und stattdessen als "Armstrong"-Sektion in die bestehende Abrechnung (MOD-01 Stammdaten) integriert. Der Aktions-Katalog mit Credit-Preisen wird dort als Spiegelung der Zone-1-Armstrong-Billing angezeigt.

---

## Aenderung 1: "Agenten"-Tile aus MOD-14 entfernen

**Datei:** `src/manifests/routesManifest.ts`

- Zeile 442 entfernen: `{ path: "agenten", component: "CommProAgenten", title: "Agenten" }`
- MOD-14 behaelt: Serien-E-Mails, Recherche, Social, KI-Telefonassistent

**Datei:** `src/pages/portal/CommunicationProPage.tsx`

- Lazy-Import von `AgentenPage` entfernen
- Route `path="agenten"` entfernen

---

## Aenderung 2: AbrechnungTab um Armstrong-Sektion erweitern

**Datei:** `src/pages/portal/stammdaten/AbrechnungTab.tsx`

Unterhalb der bestehenden Sektionen "Aktueller Plan" und "Rechnungen" wird eine neue Sektion "Armstrong" eingefuegt:

### Sektion 3: Armstrong Credits & Aktions-Katalog
- **KPI-Kacheln**: Credits verbraucht, Gesamtkosten, Transaktionen, Durchschnitt pro Aktion (aus `armstrong_billing_events`)
- **Aktions-Katalog-Grid**: Alle Aktionen aus `armstrongManifest.ts` als Widget-Cards mit:
  - Aktionsname (title_de)
  - Action-Code
  - Execution-Mode (Sofort / Mit Bestätigung / Nur lesen)
  - Zonen-Badges (Portal, Website)
  - Cost-Model-Badge (free / metered / premium)
  - Status (Aktiv / Inaktiv)
- **Filter**: Suchfeld + Zone-Filter + Status-Filter (gleicher Pattern wie der bisherige AktionsKatalog)
- **Kosten-Uebersicht**: Top-5-Aktionen nach Verbrauch (aus `armstrong_billing_events`, wie KostenDashboard)

Die bestehenden Subkomponenten `AktionsKatalog` und `KostenDashboard` aus `src/pages/portal/communication-pro/agenten/` werden direkt wiederverwendet (Import-Pfad aendern).

---

## Aenderung 3: Keine neuen Dateien noetig

Die Komponenten `AktionsKatalog.tsx` und `KostenDashboard.tsx` bleiben an ihrem Platz in `src/pages/portal/communication-pro/agenten/` und werden von der AbrechnungTab importiert. Die `AusfuehrungsLog` und `Wissensbasis` werden NICHT in die Abrechnung uebernommen — diese gehoeren in den operativen Armstrong-Bereich (Zone 1) und nicht in die User-Abrechnung.

---

## Technisches Detail

### AbrechnungTab Layout (nach Umbau)

```text
+--------------------------------------------------+
| Abrechnung                                       |
| Ihr Plan, Credits und Rechnungen                 |
+--------------------------------------------------+
| [Card] Aktueller Plan                            |
|   Plan-Name | Status | Credits                   |
+--------------------------------------------------+
| [Card] Rechnungen                                |
|   DataTable: Nr, Datum, Betrag, Status, PDF      |
+--------------------------------------------------+
| [Separator + Header]                             |
| Armstrong — KI-Aktionen & Credits                |
+--------------------------------------------------+
| [KPI-Grid] Credits | Kosten | Transaktionen | Ø |
+--------------------------------------------------+
| [Card] Aktions-Katalog                           |
|   Filter: Suche | Zone | Status                  |
|   Widget-Grid mit Action-Cards                   |
|   (Code, Titel, Mode, Zonen, Cost-Model)         |
+--------------------------------------------------+
| [Card] Top 5 Aktionen (nach Kosten)              |
+--------------------------------------------------+
```

### Verschaltung mit Zone 1

Die Zone-1-Seite `ArmstrongBilling` (`src/pages/admin/armstrong/ArmstrongBilling.tsx`) zeigt die plattformweite Sicht auf alle Tenants. Die Zone-2-Abrechnung zeigt die tenant-spezifische Sicht. Beide lesen aus denselben Tabellen:
- `armstrong_billing_events` (Verbrauch)
- `armstrongManifest.ts` (Aktions-Definitionen)

Der Unterschied: Zone 2 filtert nach `tenant_id` / `org_id` des eingeloggten Users, Zone 1 zeigt alle.

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/manifests/routesManifest.ts` — "agenten" Tile aus MOD-14 entfernen |
| EDIT | `src/pages/portal/CommunicationProPage.tsx` — Agenten-Route entfernen |
| EDIT | `src/pages/portal/stammdaten/AbrechnungTab.tsx` — Armstrong-Sektion hinzufuegen |

Keine Datenbank-Aenderungen noetig. Alle Tabellen existieren bereits.
