

# CI- und Design-Ueberarbeitung der Immobilienakte

## Analyse: Ist-Zustand und Probleme

### Tab "Akte" (EditableUnitDossierView)
1. **Adress-Block (Row 2)** enthaelt Breitengrad/Laengengrad-Felder — macht fuer den Nutzer keinen Sinn
2. **Adress-Block** zeigt Strasse/Hausnr./PLZ/Ort — diese gehoeren aber logisch zu **Identitaet & Stammdaten**, nicht in einen eigenen Full-Width-Block
3. **Adress-Block** traegt den Titel "Lage & Beschreibung" — sollte primaer Lagebeschreibung und Objektbeschreibung enthalten
4. **Identitaets-Block** fehlt: Wohnungsnummer (unit_number ist nur in EditableBuildingBlock unter "Whg.-Nr.")
5. **Adresse fehlt komplett** im Identitaets-Block — die wichtigste Eigenschaft einer Immobilie
6. **InvestmentKPIBlock** (Row 1, 3. Kachel) zeigt eine "Kapitalanlage"-Betrachtung — gehoert in den Simulation-Tab (T-Konto, analog Investmentrechner)
7. **Unruhiges Kachel-Design**: Unterschiedliche Padding-/Spacing-Standards (manche Bloecke nutzen `pb-2 pt-3 px-4`, andere `pb-3` mit Standard-CardHeader)
8. **DossierHeader** ist ein eigener Block mit `border-b` — nicht CI-konform (sollte SectionCard oder PageShell nutzen)
9. **Kein einheitliches CI**: Bloecke nutzen rohe `Card` statt `SectionCard` / `DESIGN.CARD.SECTION`

### Tab "Mietverhaeltnis" (TenancyTab)
10. **Popup/Dialog-basiert**: Mietvertraege werden ueber ein `Dialog` erstellt/bearbeitet — nicht konsistent mit dem editierbaren Kachel-Muster der Akte
11. **~984 Zeilen** — uebermaessig lang durch die Dialog-Logik (Kontakt-Schnellerstellung, Einladungen, Brief-Generator)
12. **Keine inline-editierbare Kachelstruktur**: Sollte den gleichen Pattern wie die Akte nutzen (editierbare Karten mit gemeinsamem Speichern-Button)

### Tab "Datenraum" (DatenraumTab)
13. **Eigene Baum-Implementierung** statt des systemweiten `StorageFileManager` mit `ColumnView`
14. **Kein Drag-and-Drop**, keine Spaltenansicht (DESIGN.STORAGE Standard)
15. **Eigener Upload-Bereich** statt des integrierten FileDropZone-Patterns
16. Widerspricht dem Storage-System-Standard: "Spaltenansicht ist immer Standard, D&D-optimiert"

## Neue Struktur

### Tab "Akte" — Bereinigtes Layout

```text
ROW 0: DossierHeader (vereinfacht — nur Code + Status + Datenqualitaet)

ROW 1: [Identitaet & Stammdaten] [Gebaeude & Flaechen]
        inkl. Adresse,            (wie bisher, aber
        Wohnungsnr, PLZ, Ort      CI-normalisiert)

ROW 2: [Lage & Beschreibung — full width]
        Lagebeschreibung + Objektbeschreibung + KI-Generator
        (ohne Breitengrad/Laengengrad, ohne Adressfelder)

ROW 3: [Grundbuch & Erwerb] [Finanzierung]

ROW 4: [Mietverhaeltnis]    [WEG & Hausgeld]

ROW 5: [Dokumenten-Checkliste — 2/3 Breite]
```

Entfernte Elemente:
- **InvestmentKPIBlock** aus Row 1 entfernt (wandert in Simulation-Tab)
- **Breitengrad/Laengengrad** entfernt
- Row 1 wird 2-spaltig statt 3-spaltig

### Tab "Mietverhaeltnis" — Editierbare Kachelstruktur

Statt Dialog-basierter Erfassung:

```text
[Header: Mietvertraege + Button "Neuen Vertrag anlegen"]

Pro Vertrag: Editierbare SectionCard
+--------------------------------------------+
| Mieter: Max Mustermann         [Aktiv]     |
+---------------------+----------------------+
| Vertragsart         | Kaltmiete            |
| NK-Vorauszahlung    | Heizkosten-Vorausz.  |
| Warmmiete (berechn) | Mietbeginn           |
| Kaution             | Kaution-Status       |
| Zahlungstag         | Mietmodell           |
| Naechste Anpassung  | Vertragsende         |
+---------------------+----------------------+
| [Kuendigung] [Mieterhoehung] [Abmahnung]  |
+--------------------------------------------+

[Historische Vertraege — Collapsible]
```

- Jeder Vertrag ist eine inline-editierbare Karte (wie EditableIdentityBlock)
- Gemeinsamer Save-Button am unteren Rand
- Kontakt-Auswahl ueber Inline-Select statt separatem Dialog

### Tab "Datenraum" — StorageFileManager-Integration

Ersetzen der eigenen Baum-Implementierung durch den system-weiten `StorageFileManager`:
- Nutzt `ColumnView` (DESIGN.STORAGE Standard)
- Drag-and-Drop Unterstuetzung
- Spaltenansicht als Default
- Konsistenter Look mit MOD-03 (DMS) und MOD-11

## Detaillierte Aenderungen

### 1. `EditableIdentityBlock.tsx` — Adresse integrieren

Neue Props: `street`, `houseNumber`, `postalCode`, `city`, `unitNumber` (Wohnungsnummer)

Neues Layout:
- Row 1: Akten-ID (disabled) + Baujahr
- Row 2: Objektart + Status
- Row 3: Strasse + Hausnr.
- Row 4: PLZ + Ort + Whg.-Nr.
- Row 5: Reporting + WEG
- Module-Status (wie bisher)

Der Block wird dadurch etwas groesser, bleibt aber kompakt mit `h-7 text-xs` Inputs.

### 2. `EditableAddressBlock.tsx` — Wird zu "Lage & Beschreibung"

Entfernte Felder:
- Strasse, Hausnr., PLZ, Ort (wandern in IdentityBlock)
- Breitengrad, Laengengrad (komplett entfernt)

Verbleibende Felder:
- Lagebezeichnung (z.B. "Altbau am Prenzlauer Berg")
- Objektbeschreibung (Textarea mit KI-Generator)

Titel aendern zu: "Lage & Objektbeschreibung"

### 3. `EditableUnitDossierView.tsx` — Layout-Umbau

- Row 1: 2-spaltig statt 3-spaltig (Identity + Building, ohne KPI)
- Row 2: Lage & Beschreibung (full-width, verschlankt)
- Adress-Props von AddressBlock an IdentityBlock umleiten
- `InvestmentKPIBlock`-Import und -Rendering entfernen

### 4. `InventoryInvestmentSimulation.tsx` — KPI-Integration

Der Simulation-Tab bekommt die KPI-Daten (Kaufpreis, Brutto-/Netto-Rendite, Cashflow) direkt als kompakte Kopfzeile angezeigt. Diese Daten sind dort kontextuell richtig, da sie zur Kapitalanlage-Betrachtung gehoeren. Das bestehende `InfoBox`-Raster im Simulation-Tab wird um die fehlenden KPIs erweitert.

### 5. `TenancyTab.tsx` — Redesign als editierbare Kachelstruktur

**Neuer Ansatz:**
- Jeder aktive Mietvertrag wird als editierbare `SectionCard` dargestellt
- Felder sind inline-editierbar (Input/Select wie in EditableFinancingBlock)
- Kontakt-Auswahl erfolgt ueber ein Inline-Select-Feld (nicht Dialog)
- Speichern ueber einen gemeinsamen Sticky-Save-Button (wie in EditableUnitDossierView)
- Aktionsbuttons (Kuendigung, Mieterhoehung, Abmahnung) bleiben als Footer-Links in jeder Karte
- "Neuen Vertrag anlegen" oeffnet eine leere Karte (nicht Dialog)
- Historische Vertraege in einem Collapsible am Ende

### 6. `DatenraumTab.tsx` — Ersetzen durch StorageFileManager

Die gesamte eigene Baum-Implementierung wird durch den bestehenden `StorageFileManager` ersetzt:
- Import von `StorageFileManager` aus `@/components/dms/StorageFileManager`
- Props: `nodes`, `documents`, `documentLinks` (gleiche Datenquellen, angepasste Queries)
- Default-View: `columns` (DESIGN.STORAGE.DEFAULT_VIEW)
- Upload via integrierter `FileDropZone`
- Download via bestehender `sot-dms-download-url` Edge Function

### 7. CI-Normalisierung aller Bloecke

Alle editierbaren Bloecke erhalten einheitliches Spacing:
- CardHeader: `pb-2 pt-3 px-4` (wie EditableIdentityBlock — der kompakteste Standard)
- CardContent: `space-y-2 px-4 pb-3`
- Input-Hoehe: `h-7 text-xs`
- Labels: `text-[11px] text-muted-foreground`

Betrifft: `EditableLegalBlock`, `EditableFinancingBlock`, `EditableWEGBlock`, `EditableAddressBlock` — diese haben derzeit grosszuegigere Abstande (`pb-3`, `space-y-4`, `gap-4`).

### 8. DossierHeader — Vereinfachung

Der DossierHeader zeigt nur noch:
- Akten-ID (H1)
- Status-Badge
- Datenqualitaets-Indikator
- Stand-Datum

Die Adresse und Lagebezeichnung werden entfernt (sind jetzt im IdentityBlock).

## Keine Datenbank-Aenderungen

Rein visuelles Refactoring. Keine Schema-, RLS- oder Routing-Aenderungen.

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| `EditableIdentityBlock.tsx` | Adresse + Whg.-Nr. integrieren |
| `EditableAddressBlock.tsx` | Nur Lage + Beschreibung, ohne Adresse/Koordinaten |
| `EditableUnitDossierView.tsx` | 2-spaltig Row 1, KPI entfernen, Props umleiten |
| `DossierHeader.tsx` | Adresse entfernen, kompakter |
| `EditableLegalBlock.tsx` | CI-Spacing normalisieren |
| `EditableFinancingBlock.tsx` | CI-Spacing normalisieren |
| `EditableWEGBlock.tsx` | CI-Spacing normalisieren |
| `TenancyTab.tsx` | Komplett-Redesign als editierbare Karten |
| `DatenraumTab.tsx` | Ersetzen durch StorageFileManager |
| `InventoryInvestmentSimulation.tsx` | KPI-Kopfzeile ergaenzen |
| `InvestmentKPIBlock.tsx` | Bleibt bestehen (wird nur nicht mehr in Akte importiert) |

