
# Design-Harmonisierung: Alle 5 Fahrzeug-Tabs auf Manifest-Standard bringen

## Problem

Alle fuenf Unterseiten (Autos, Bikes, Boote, Privatjet, Angebote) verwenden ad-hoc Tailwind-Grid-Klassen statt der vorgeschriebenen Shared-Komponenten `WidgetGrid` und `WidgetCell`. Die Kacheln haben unterschiedliche Hoehen, unterschiedliche Spaltenanzahlen und inkonsistente Header-Strukturen.

### Konkrete Abweichungen

| Seite | Ist-Grid | Soll-Grid | Ist-Card-Hoehe | Soll |
|-------|----------|-----------|----------------|------|
| Autos | ad-hoc `xl:grid-cols-4` | `WidgetGrid` (4 Spalten) | `h-36` Bild + Content | `WidgetCell` (260px / aspect-square) |
| Bikes | ad-hoc `xl:grid-cols-4` | `WidgetGrid` | `h-36` Bild + Content | `WidgetCell` |
| Boote | ad-hoc `xl:grid-cols-4` | `WidgetGrid` | `h-40` Bild + Content | `WidgetCell` |
| Privatjet | ad-hoc `xl:grid-cols-3` | `WidgetGrid` (4 Spalten!) | `h-44` Bild + Content | `WidgetCell` |
| Angebote | ad-hoc `xl:grid-cols-3` | `WidgetGrid` (4 Spalten!) | `h-36`/`h-40` | `WidgetCell` |

### Weitere Inkonsistenzen
- Boote und Privatjet haben grosse Provider-Header-Cards (Haller Experiences, NetJets), Autos und Bikes nicht
- Angebote hat zwei Sektionen mit Provider-Headern, aber in einem anderen Stil (kein Bild-Overlay)
- Privatjet nutzt nur 3 Spalten statt 4
- Angebote nutzt nur 3 Spalten statt 4

---

## Loesung: Einheitliche Struktur fuer alle 5 Tabs

### Gemeinsames Layout-Pattern (fuer alle Tabs identisch)

```text
PageShell
  ModulePageHeader (Titel, Beschreibung, optionaler Action-Button)
  [Optional: Provider-Header als ContentCard mit WidgetHeader-Stil]
  WidgetGrid (variant="widget")
    WidgetCell -> VehicleCard (Bild + Kennzeichen + Mini-KPIs)
    WidgetCell -> VehicleCard
    ...
  [Optional: Inline-Detail unterhalb des Grids]
```

### Fuer alle Cards gilt
- Eingebettet in `WidgetCell` (h-[260px] mobil, aspect-square Desktop)
- Bild oben (~55% Hoehe), Content unten
- Status-Badge oben links
- Kennzeichen/Name unten links auf dem Bild
- Mini-Info-Grid im Content-Bereich (2x2, max 4 KPIs)

---

## Aenderung 1: CarsAutos.tsx

**Aenderungen:**
- `div.grid.grid-cols-1.md:grid-cols-2.xl:grid-cols-4.gap-4` ersetzen durch `<WidgetGrid>`
- Jede `<Card>` in `<WidgetCell>` wrappen
- Card-Bild-Hoehe auf `h-[55%]` relativ zur WidgetCell anpassen (statt festes `h-36`)
- Card nutzt `h-full` um die WidgetCell voll auszufuellen
- Import von `WidgetGrid` und `WidgetCell` hinzufuegen

---

## Aenderung 2: CarsBikes.tsx

**Aenderungen:**
- Gleiche Grid-Umstellung wie Autos
- `div.grid` -> `WidgetGrid` + `WidgetCell`
- Cards auf `h-full` + relative Bild/Content-Aufteilung
- Import von `WidgetGrid`, `WidgetCell`

---

## Aenderung 3: CarsBoote.tsx

**Aenderungen:**
- Provider-Header (Haller Experiences) bleibt, wird aber als `ContentCard` mit `WidgetHeader`-Stil umgebaut (Icon-Box + Titel + Beschreibung + Action)
- Boat-Grid: `div.grid` -> `WidgetGrid` + `WidgetCell`
- Boat-Cards: `h-full`, Bild ~55%, Content unten mit Name, Laenge, Gaeste, Preis
- 4 Spalten statt aktuell auch schon 4 (bleibt, aber ueber WidgetGrid)
- Import von `WidgetGrid`, `WidgetCell`, `ContentCard`

---

## Aenderung 4: CarsPrivatjet.tsx

**Aenderungen:**
- Provider-Header (NetJets) analog zu Boote als `ContentCard` umbauen
- Fleet-Grid: `xl:grid-cols-3` -> `WidgetGrid` (4 Spalten!)
- Jet-Cards: In `WidgetCell` wrappen, `h-full`, Bild ~55%
- Description-Text (`line-clamp-2`) wird kompakter, um in die quadratische Kachel zu passen
- Import von `WidgetGrid`, `WidgetCell`, `ContentCard`

---

## Aenderung 5: CarsAngebote.tsx

**Aenderungen:**
- Beide Provider-Header (Miete24, BMW/MINI) als `ContentCard` mit konsistentem Stil
- Beide Grids: `xl:grid-cols-3` -> `WidgetGrid` (4 Spalten!)
- Alle Offer-Cards in `WidgetCell` wrappen, `h-full`
- Bild-Bereich ~50%, Content unten mit Titel, Badges, Preis
- Import von `WidgetGrid`, `WidgetCell`, `ContentCard`

---

## Provider-Header Standard (neu, einheitlich fuer Boote, Privatjet, Angebote)

Statt ad-hoc Hero-Bilder mit absolutem Positioning wird ein konsistenter Provider-Header verwendet:

```text
ContentCard
  icon={PartnerIcon}
  title="Haller Experiences" / "NETJETS" / "miete24" / "BMW & MINI"
  description="Premium Yacht Charter · Ibiza"
  headerAction={<Button>Website</Button>}
  [Optional: Kompakte KPI-Zeile mit Badges]
```

Das ist kompakter, manifest-konform und visuell einheitlich ueber alle Tabs.

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/components/portal/cars/CarsAutos.tsx` — WidgetGrid + WidgetCell |
| EDIT | `src/components/portal/cars/CarsBikes.tsx` — WidgetGrid + WidgetCell |
| EDIT | `src/components/portal/cars/CarsBoote.tsx` — WidgetGrid + WidgetCell + ContentCard Header |
| EDIT | `src/components/portal/cars/CarsPrivatjet.tsx` — WidgetGrid + WidgetCell + ContentCard Header, 4 Spalten |
| EDIT | `src/components/portal/cars/CarsAngebote.tsx` — WidgetGrid + WidgetCell + ContentCard Headers, 4 Spalten |

Keine neuen Dateien. Keine Datenbank-Aenderungen. Reine UI-Harmonisierung mit bestehenden Shared-Komponenten.
