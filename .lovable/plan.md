
# MOD-16 Shops + Bestellungen — MVP UI Build

## Aenderung 1: Naming Fix + Manifest Update

**Datei:** `src/manifests/routesManifest.ts`

MOD-16 wird umbenannt und die Tiles komplett neu definiert:

```
name: "Shops" (statt "Services")
icon: "ShoppingCart" (statt "Wrench")
tiles:
  - { path: "amazon", title: "Amazon Business" }
  - { path: "otto-office", title: "OTTO Office" }
  - { path: "miete24", title: "Miete24" }
  - { path: "bestellungen", title: "Bestellungen" }
```

## Aenderung 2: ServicesPage.tsx komplett neu

**Datei:** `src/pages/portal/ServicesPage.tsx`

Die bisherigen Katalog/Anfragen/Auftraege/Einstellungen Tiles werden ersetzt durch:

### Shop-Tabs (Amazon, OTTO Office, Miete24)

Jeder Shop-Tab bekommt dieselbe Struktur:

**A) Hero Card:**
- Shop-Name + Icon/Logo-Platzhalter
- Kurzbeschreibung (z.B. "Buerobedarf und IT-Zubehoer fuer Ihr Unternehmen")
- CTA Button "Shop oeffnen" (placeholder Link, `onClick` only)

**B) Integration Card:**
- Status-Badge: "Nicht verbunden" (disconnected default)
- Credential-Felder (nur UI, keine Logik):
  - Amazon: API Key, Partner Tag
  - OTTO Office: Affiliate ID, API Key
  - Miete24: Partner ID, API Secret
- Button "Verbindung testen" (disabled)

### Bestellungen-Tab

**A) Bestellungsliste (links/oben):**
- Leere Liste mit Empty State
- Button "Neue Bestellung"
- Eine leere Bestellung "#---" ist als geoeffneter Tab vorhanden

**B) Tab-Leiste fuer geoeffnete Bestellungen (Widget-Pattern):**
- Tabs wie Dashboard-Widgets, horizontal scrollbar
- Default: Ein Tab "Bestellung #---" (aktiv)

**C) Bestell-Detail (im aktiven Tab):**

Header-Felder (2-3 Spalten Grid):
- Bestell-ID (placeholder "---")
- Shop (Select: Amazon/OTTO Office/Miete24)
- Status (Select: Draft/Submitted/Ordered/Shipped/Completed/Cancelled)
- Auftraggeber (Input, leer)
- Kostenstelle/Projekt (Input, leer)
- Lieferadresse, Rechnungsadresse (Textareas, leer)
- Bestelldatum, Lieferdatum (Date Inputs, leer)
- Zahlungsart (Select, leer)
- Notizen (Textarea, leer)

Positionen-Tabelle:
- 8 leere Zeilen sichtbar
- Spalten: Pos | Artikel | SKU | Menge | Einheit | Einzelpreis netto | MwSt% | Gesamt netto | Gesamt brutto | Link | Bemerkung

Summenblock:
- Zwischensumme netto: 0,00 EUR
- MwSt Summe: 0,00 EUR
- Gesamt brutto: 0,00 EUR

Verlauf + Anhaenge:
- Verlauf: leere Liste ("Noch keine Eintraege")
- Anhaenge: Upload-Dropzone Platzhalter

## Aenderung 3: WorkflowSubbar

**Datei:** `src/components/shared/WorkflowSubbar.tsx`

`SERVICES_WORKFLOW_STEPS` wird aktualisiert auf die neuen Shop-Steps:
```
amazon → otto-office → miete24 → bestellungen
```
(Labels: "Amazon" → "OTTO Office" → "Miete24" → "Bestellungen")

## Design-Prinzipien

- Alle Karten nutzen das bestehende `glass-card` / `Card` Pattern
- Keine Beispieldaten — nur leere Felder und Strukturen
- Desktop-first, Widget-Look fuer die Bestellungs-Tabs
- Bestehende UI-Komponenten (Input, Select, Card, Badge, Button, Tabs) werden wiederverwendet

## Technische Aenderungen

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | MOD-16: name "Shops", 4 neue Tiles (amazon, otto-office, miete24, bestellungen) |
| `src/pages/portal/ServicesPage.tsx` | Komplett neu: 3 Shop-Tabs + Bestellungen-Tab mit Widget-Pattern |
| `src/components/shared/WorkflowSubbar.tsx` | SERVICES_WORKFLOW_STEPS aktualisieren |

### Keine Datenbank-Aenderungen noetig
Reines Frontend-MVP ohne Backend-Anbindung.
