

# Systemweiter Funktionstest + Widget-Designanalyse + Homogenisierungsplan

## Ziel

Strukturierter Durchlauf aller Zone-1 und Zone-2 Menuepunkte mit:
1. **Funktionstest**: Demo-Daten vorhanden? Gehoeren sie zur Familie Mustermann?
2. **Screenshot-Dokumentation**: Demo ON vs. Demo OFF pro Menuepunkt
3. **Widget-Designanalyse**: Welcher Widget-Typ wird verwendet? Ist der Glow sichtbar?
4. **Homogenisierungsvorschlaege**: Backlog-JSON mit konkreten Massnahmen

---

## Phase 1: Pruefplan — Alle Menuepunkte systematisch

### Zone 2 (Portal) — 21 Module, je mit Sub-Tabs

Fuer jeden Menuepunkt wird geprueft:
- (A) Demo ON: Sind Demo-Widgets/Daten sichtbar? Gehoeren sie zu "Mustermann"?
- (B) Demo OFF: Verschwinden die Demo-Daten korrekt?
- (C) Widget-Typ: Welche Komponente (RecordCard, WidgetCell, Custom Card, etc.)?
- (D) Glow: Ist ein farbiger Glow sichtbar? Welche Farbe? Ist er visuell wirksam?

| Nr | Modul | Route | Sub-Tabs (einzeln zu pruefen) |
|---|---|---|---|
| 1 | MOD-00 Dashboard | `/portal` | Hauptseite (Armstrong, Wetter, Globe, Tasks) |
| 2 | MOD-01 Stammdaten | `/portal/stammdaten` | Profil, Vertraege, Abrechnung, Sicherheit, Demo-Daten |
| 3 | MOD-02 KI Office | `/portal/office` | Email, Brief, Kontakte, Kalender, Widgets, WhatsApp, Videocalls |
| 4 | MOD-03 DMS | `/portal/dms` | Dateien, Posteingang, Sortieren, Einstellungen |
| 5 | MOD-04 Immobilien | `/portal/immobilien` | Zuhause, Portfolio, V+V, Sanierung |
| 6 | MOD-05 Pets | `/portal/pets` | Meine Tiere, Caring, Shop, Fotoalbum |
| 7 | MOD-06 Verkauf | `/portal/verkauf` | Objekte, Anfragen, Vorgaenge, Reporting |
| 8 | MOD-07 Finanzierung | `/portal/finanzierung` | Selbstauskunft, Dokumente, Anfrage, Status, Privatkredit |
| 9 | MOD-08 Investment-Suche | `/portal/investments` | Suche, Favoriten, Mandat, Simulation |
| 10 | MOD-09 Immomanager | `/portal/vertriebspartner` | Katalog, Beratung, Kunden, Netzwerk, Leads, Landing Page |
| 11 | MOD-10 Lead Manager | `/portal/leads` | Uebersicht |
| 12 | MOD-11 FM-Manager | `/portal/finanzierungsmanager` | Dashboard, Finanzierungsakte, Einreichung, Provisionen, Archiv, Landing Page |
| 13 | MOD-12 Akquisemanager | `/portal/akquise-manager` | Dashboard, Mandate, Objekteingang, Datenbank, Tools, Landing Page |
| 14 | MOD-13 Projektmanager | `/portal/projekte` | Dashboard, Projekte, Vertrieb, Landing Page |
| 15 | MOD-14 Communication Pro | `/portal/communication-pro` | Serien-E-Mails, Recherche, Social, KI-Telefon |
| 16 | MOD-15 Fortbildung | `/portal/fortbildung` | Buecher, Fortbildungen, Vortraege, Kurse |
| 17 | MOD-16 Shop | `/portal/services` | Amazon, OTTO Office, Miete24, Bestellungen |
| 18 | MOD-17 Car-Management | `/portal/cars` | Fahrzeuge, Boote, Privatjet, Angebote |
| 19 | MOD-18 Finanzen | `/portal/finanzanalyse` | Uebersicht, Investment, Versicherungen, Vorsorge, KV, Abos, Vorsorge+Testament |
| 20 | MOD-19 Photovoltaik | `/portal/photovoltaik` | Anlagen, Enpal, Dokumente, Einstellungen |
| 21 | MOD-20 Miety | `/portal/miety` | Uebersicht, Versorgung, Versicherungen, Smart Home, Kommunikation |

### Zone 1 (Admin) — Stichproben

| Nr | Bereich | Route | Pruefobjekte |
|---|---|---|---|
| 22 | Admin Dashboard | `/admin` | KPIs, Organisationen |
| 23 | FutureRoom | `/admin/futureroom` | Demo-Finanzierungsanfragen |
| 24 | Acquiary | `/admin/acquiary` | Demo-Akquise-Mandate |
| 25 | Sales Desk | `/admin/sales-desk` | Demo-Listings |
| 26 | Projekt Desk | `/admin/projekt-desk` | Demo-Projekte |
| 27 | Armstrong | `/admin/armstrong` | KI-Config |

**Gesamt: ca. 80+ individuelle Screenshots** (je Menuepunkt Demo ON + Demo OFF)

---

## Phase 2: Widget-Designanalyse — Parallel zur Navigation

### Analysierte Dimensionen pro Screenshot

| Dimension | Frage |
|---|---|
| **Widget-Typ** | RecordCard / WidgetCell / Custom Card / KPI-Card / Other? |
| **Grid-Layout** | WidgetGrid (4-col) / RECORD_CARD.GRID (2-col) / Custom? |
| **Glow vorhanden?** | Ja/Nein — welche Farbe? |
| **Glow visuell wirksam?** | Ist der Farbunterschied erkennbar oder zu subtil? |
| **Aspect Ratio** | Quadratisch (aspect-square) / Rechteckig / Variabel? |
| **Badge vorhanden?** | "DEMO" Badge / Status-Badge / Kein Badge? |
| **Konsistenz** | Passt das Widget zum Abo-Standard (Referenz)? |

### Spezifisches Glow-Problem: Primary Blue ist zu schwach

Der User berichtet, dass der blaue (`primary`) Glow visuell nicht wirksam ist. Analyse:

- `primary` Glow: `border-primary/30`, `shadow-primary/15` — Die Opazitaet ist mit 30% Border und 15% Shadow sehr gering
- `emerald` Glow: `border-emerald-400/30`, `shadow-emerald-400/15` — Gleiche Opazitaet, aber Gruen hat natuerlich hoehere Sichtbarkeit auf dunklem Hintergrund

**Vorschlag**: Demo-Daten-Glow von `primary` (Blau) auf `emerald` (Gruen) umstellen — konsistent mit dem urspruenglichen "smaragdgruenen" Demo-Widget-Design.

---

## Phase 3: Ergebnisdokumentation

### 3.1 Funktionstest-Report

Pro Menuepunkt wird dokumentiert:
```text
MOD-XX / Tab-Name
  Demo ON:  [OK/FEHLER] — Beschreibung
  Demo OFF: [OK/FEHLER] — Beschreibung
  Daten:    [Mustermann/Andere/Keine]
  Widget:   [RecordCard/WidgetCell/Custom]
  Glow:     [primary/emerald/amber/.../none] — [sichtbar/unsichtbar]
```

### 3.2 Widget-Inventar

Konsolidierte Tabelle aller verwendeten Widget-Typen mit Haeufigkeit und Abweichungen vom Standard.

### 3.3 Backlog-JSON

Datei: `spec/audit/widget_homogenization_backlog.json`

```text
Struktur:
{
  "version": "1.0.0",
  "date": "2026-02-16",
  "findings": [
    {
      "id": "WH-001",
      "module": "MOD-XX",
      "tab": "...",
      "type": "glow_missing | layout_inconsistent | wrong_widget_type | demo_data_missing",
      "severity": "high | medium | low",
      "description": "...",
      "current_state": "...",
      "target_state": "...",
      "effort": "S | M | L"
    }
  ]
}
```

---

## Phase 4: Verbesserungsvorschlaege (nach Analyse)

Basierend auf den Findings werden konkrete Massnahmen vorgeschlagen:

### 4.1 Glow-Farbwechsel fuer Demo-Daten

- **Aenderung**: `DEMO_WIDGET.CARD` und `getContractWidgetGlow()` von `primary` auf `emerald` umstellen
- **Betroffene Dateien**: `designManifest.ts`, `widgetCategorySpec.ts`, alle Module die `glowVariant="primary"` fuer Demo setzen
- **Opazitaet erhoehen**: Shadow von `15%` auf `25%`, Border von `30%` auf `40%` fuer bessere Sichtbarkeit

### 4.2 Widget-Typ-Homogenisierung

- Alle Module die noch Custom Cards verwenden auf RecordCard oder WidgetCell umstellen
- V+V (MOD-04 Verwaltung) speziell analysieren — User hat explizit erwaehnt, dass dort nichts veraendert wurde

### 4.3 Layout-Standardisierung

- Alle Vertrags-Widgets einheitlich auf `RECORD_CARD.GRID` (2-col) mit RecordCard
- Alle Dashboard-/System-Widgets auf `WidgetGrid` (4-col) mit WidgetCell

---

## Durchfuehrung

Der Test wird sequenziell durchgefuehrt:

1. **Schritt 1**: Browser-Navigation zu jedem Menuepunkt, Screenshot im Demo-ON-Zustand
2. **Schritt 2**: Demo-Toggle OFF schalten (via MOD-01 Demo-Daten Tab), erneut jeden Menuepunkt screenshotten
3. **Schritt 3**: Parallel pro Screenshot die Widget-Analyse-Dimensionen dokumentieren
4. **Schritt 4**: Findings in Backlog-JSON zusammenfassen
5. **Schritt 5**: Verbesserungsvorschlaege formulieren und priorisieren

Der gesamte Durchlauf ergibt ein vollstaendiges Audit-Dokument mit konkreten, priorisierten Backlog-Items.

