
# Systemweite Widget- und Einreichungs-Analyse

## Inventar aller analysierten Prozess-Module

| # | Modul | Seite | Widget-Leiste | Einreichungs-Block | WidgetGrid/Cell |
|---|-------|-------|---------------|-------------------|-----------------|
| 1 | MOD-07 Finanzierung | AnfrageTab | JA (FinanceRequestWidgets) | JA (FinanzierungsauftragBlock) | JA (WidgetGrid + WidgetCell) |
| 2 | MOD-11 FM Dashboard | FMDashboard | JA (Faelle-Widgets) | NEIN (nicht noetig, Dashboard) | JA (WidgetGrid + WidgetCell) |
| 3 | MOD-11 FM Finanzierungsakte | FMFinanzierungsakte | NEIN — keine Widget-Leiste oben | NEIN (GenerateCaseCard unten, kein Consent) | NEIN — kein WidgetGrid |
| 4 | MOD-11 FM Einreichung | FMEinreichung | TEIL — eigenes Grid (grid-cols-6), nicht WidgetGrid | NEIN (E-Mail-Logik, kein Consent) | NEIN — ad-hoc grid-cols |
| 5 | MOD-11 FM Archiv | FMArchiv | TEIL — eigenes Grid (grid-cols-6) | NEIN | NEIN — ad-hoc grid-cols |
| 6 | MOD-11 FM Provisionen | FMProvisionen | NEIN | NEIN (Vertragslogik, kein Widget) | NEIN |
| 7 | MOD-04 Portfolio | PortfolioTab | JA (Kontext-Widgets) | NEIN (kein Einreichungsprozess) | JA (WidgetGrid + WidgetCell) |
| 8 | MOD-04 Sanierung | SanierungTab | JA (CTA + Case-Widgets) | NEIN (Inline-Detail, kein Consent) | JA (WidgetGrid + WidgetCell) |
| 9 | MOD-12 AM Dashboard | AkquiseDashboard | JA (Mandate-Widgets) | NEIN (Dashboard) | JA (WidgetGrid + WidgetCell) |
| 10 | MOD-12 AM Mandate | AkquiseMandate | JA (Mandate-Widgets oben) | NEIN (Workflow-Kacheln, kein Consent) | JA (WidgetGrid + WidgetCell) |
| 11 | MOD-13 Projekte | ProjekteDashboard | TEIL — ProjectCards in eigenem Grid | NEIN (Magic Intake, kein Consent) | NEIN — eigene grid-Klassen |
| 12 | MOD-08 Verkauf | VorgaengeTab | NEIN | NEIN (Tabellen-Layout) | NEIN |
| 13 | MOD-09 Services | BestellungenTab | NEIN (Tabs statt Widgets) | NEIN | NEIN |
| 14 | Miety | MietyHomeDossier | NEIN (Dossier-Layout) | NEIN | NEIN |

---

## Befunde: Widget-Struktur Abweichungen

### KRITISCH: Falsches Grid (nicht WidgetGrid/WidgetCell)

**1. FMEinreichung (Zeile 329)**
```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
```
Soll: `WidgetGrid` (max 4 Spalten) + `WidgetCell` (aspect-square)

**2. FMArchiv (Zeile 44)**
```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
```
Identisches Problem. Soll: `WidgetGrid` + `WidgetCell`

**3. ProjekteDashboard (Zeile ~320+)**
ProjectCards werden in eigenem Grid dargestellt, nicht in `WidgetGrid/WidgetCell`. Soll: Standard-Widgets nutzen.

### KRITISCH: Fehlende Widget-Leiste

**4. FMFinanzierungsakte**
Keine Widget-Leiste oben. Der Nutzer navigiert direkt auf eine leere Akte. Es fehlt die Moeglichkeit, zwischen mehreren Akten zu wechseln ohne zurueckzunavigieren. Laut Manager-Module-Pattern muss eine persistente Widget-Leiste mit bestehenden Akten + CTA "Neue Akte" oben erscheinen.

### MITTLERER SCHWEREGRAD: Fehlende Einreichungslogik

**5. FMFinanzierungsakte**
Hat einen `GenerateCaseCard` am Ende, aber keinen formalen Consent-/Einreichungs-Block. Der "Fall erstellen" ist ein technischer Vorgang, kein bewusster Auftrag mit Einwilligung.

**6. AkquiseMandate**
Mandatserstellung erfolgt ueber `handleCreateMandate()` nach KI-Extraktion, aber ohne formalen Consent-Block (Datenweitergabe, Beauftragung).

**7. BestellungenTab (Services)**
Nutzt Tabs statt Widgets. Kein CTA-Widget fuer "Neue Bestellung". Soll: Widget-Leiste mit bestehenden Bestellungen.

---

## Befunde: Design-Abweichungen

| Abweichung | Datei | Problem |
|-----------|-------|---------|
| Ad-hoc grid-cols-6 statt WidgetGrid | FMEinreichung.tsx, FMArchiv.tsx | Max 4 Spalten laut Manifest verletzt |
| Kein aspect-square | FMEinreichung, FMArchiv, ProjekteDashboard | Widgets sind nicht quadratisch |
| Section-Header im Dashboard | FMDashboard (Z301: "Finanzierungsmandate") | Laut Pattern untersagt |
| Section-Header im Dashboard | AkquiseDashboard (Z167: "Neue Auftraege") | Laut Pattern untersagt |
| Visitenkarte + Ticker UNTEN statt OBEN | FMDashboard, AkquiseDashboard | DASHBOARD_HEADER steht unterhalb der Widgets statt oben |

---

## Umsetzungsplan

### Phase 1: Widget-Grid-Standardisierung (4 Dateien)

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 1.1 | `FMEinreichung.tsx` | Ad-hoc `grid-cols-6` (Z329) durch `WidgetGrid` + `WidgetCell` ersetzen |
| 1.2 | `FMArchiv.tsx` | Ad-hoc `grid-cols-6` (Z44) durch `WidgetGrid` + `WidgetCell` ersetzen |
| 1.3 | `ProjekteDashboard.tsx` | ProjectCard-Grid durch `WidgetGrid` + `WidgetCell` ersetzen |
| 1.4 | `BestellungenTab.tsx` | Tabs-basierte Navigation durch Widget-Leiste (WidgetGrid + CTA) ersetzen |

### Phase 2: Fehlende Widget-Leisten nachrüsten (1 Datei)

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 2.1 | `FMFinanzierungsakte.tsx` | Widget-Leiste oben einfügen mit bestehenden Akten aus `future_room_cases` + CTA "Neue Akte". Analog zu MOD-07 `FinanceRequestWidgets` |

### Phase 3: Dashboard-Header-Position korrigieren (2 Dateien)

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 3.1 | `FMDashboard.tsx` | Visitenkarte + Zins-Ticker von unten nach OBEN verschieben (vor die Faelle-Widgets). Sektions-Header "Finanzierungsmandate" entfernen |
| 3.2 | `AkquiseDashboard.tsx` | Visitenkarte + KPI-Widget von unten nach OBEN verschieben. Sektions-Header "Neue Auftraege" entfernen |

### Phase 4: Einreichungslogik vereinheitlichen (2 Dateien)

| Nr | Datei | Aenderung |
|----|-------|-----------|
| 4.1 | `FMFinanzierungsakte.tsx` | `GenerateCaseCard` durch einen formalen Consent-Block ersetzen oder ergaenzen (analog `FinanzierungsauftragBlock`): Checkboxen fuer Datenrichtigkeit, Beauftragung, DSGVO |
| 4.2 | `AkquiseMandate.tsx` | Nach `handleCreateMandate()` einen Inline-Consent-Block einfuegen (Datennutzung, Kontaktrecherche-Freigabe) |

### Nicht im Scope (kein Akten-Widget-Pattern)

- **VorgaengeTab (Verkauf)**: Tabellen-basiert, kein Akten-Prozess. Korrekt so.
- **MietyHomeDossier**: Dossier-Pattern mit Accordion, kein Widget-Prozess. Korrekt so.
- **FMProvisionen**: Vertrags-/Tabellen-Ansicht, kein Widget-Prozess. Korrekt so.
- **PortfolioTab (MOD-04)**: Kontext-Widgets sind korrekt implementiert.
- **SanierungTab (MOD-04)**: Gold-Standard-Referenz, korrekt implementiert.

---

## Technische Details

Alle Widget-Grid-Korrekturen folgen dem gleichen Muster:

```text
VORHER (ad-hoc):
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
  <FinanceCaseCard ... />
</div>

NACHHER (Standard):
<WidgetGrid>
  <WidgetCell>
    <FinanceCaseCard ... />
  </WidgetCell>
</WidgetGrid>
```

Die Reihenfolge der Dashboard-Sektionen wird:
1. DASHBOARD_HEADER (Visitenkarte + Ticker/KPI)
2. WidgetGrid (aktive Faelle/Mandate)
3. Detail-Bereich (falls selektiert)

Es sind keine Datenbank-Aenderungen erforderlich.
