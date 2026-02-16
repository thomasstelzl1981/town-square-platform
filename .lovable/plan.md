
# Lennox Tracker — Produktseite mit CI-Branding und AI-generierten Bildern

## Uebersicht

Die aktuelle Lennox-Tracker-Sektion (Zeilen 273-308 in `PetsShop.tsx`) ist minimal — nur eine Card mit Icon, Text und "Bald verfuegbar"-Button. Sie wird zu einer vollwertigen Produktseite ausgebaut, inspiriert von Tractive: Hero-Banner mit generiertem Bild, Feature-Grid, Produktvarianten und Abo-Modell.

## Neues Layout

```text
+----------------------------------------------------------+
|  HERO BANNER (volle Breite, Gradient + AI-Bild)          |
|                                                          |
|  [AI-generiertes Bild: Hund mit Tracker am Halsband]    |
|                                                          |
|  "Lennox GPS Tracker"                                    |
|  "Immer wissen, wo dein Liebling ist."                   |
|  [Jetzt vorbestellen]                                    |
+----------------------------------------------------------+
|                                                          |
|  FEATURE-GRID (3 Spalten, mobile: 1 Spalte)             |
|                                                          |
|  +----------------+ +----------------+ +----------------+|
|  | MapPin         | | Activity       | | Shield         ||
|  | Live-Ortung    | | Aktivitaets-   | | Geofencing     ||
|  |                | | tracking       | |                ||
|  +----------------+ +----------------+ +----------------+|
|  +----------------+ +----------------+ +----------------+|
|  | Battery        | | Droplets       | | Heart          ||
|  | 14 Tage Akku   | | Wasserdicht    | | Gesundheits-   ||
|  |                | | IP67           | | warnungen      ||
|  +----------------+ +----------------+ +----------------+|
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  PRODUKT-VARIANTEN (3 Karten nebeneinander)              |
|                                                          |
|  +----------------+ +----------------+ +----------------+|
|  | LENNOX Mini    | | LENNOX Std     | | LENNOX XL      ||
|  | Fuer kleine    | | Fuer Hunde     | | Fuer grosse    ||
|  | Hunde/Katzen   | | ab 10 kg       | | Hunde ab 25 kg ||
|  | 39,99 EUR      | | 49,99 EUR      | | 59,99 EUR      ||
|  | [Vorbestellen] | | [Vorbestellen] | | [Vorbestellen] ||
|  +----------------+ +----------------+ +----------------+|
|                                                          |
+----------------------------------------------------------+
|  ABO-MODELLE (Badge-Row)                                 |
|  Basic 2,99/Mo | Plus 4,99/Mo | Premium 6,99/Mo         |
+----------------------------------------------------------+
|  INTEGRATION-ACCORDION (Partner-ID / API Key)            |
+----------------------------------------------------------+
```

## Technische Umsetzung

### 1. AI-generierte Bilder (Edge Function)

Eine Edge Function `generate-lennox-images` wird erstellt, die ueber die Lovable AI (google/gemini-2.5-flash-image) 3 Bilder generiert:

- **Hero-Bild**: "A happy golden retriever outdoors wearing a sleek small black GPS tracker on its collar, nature background, professional product photography"
- **Tracker-Produktbild**: "A small sleek black GPS pet tracker device on white background, modern product photography, rounded edges"
- **Lifestyle-Bild**: "A person walking with a dog in a park, checking a phone app showing GPS location, warm light"

Die generierten Bilder werden in Lovable Cloud Storage (Bucket `lennox-assets`) gespeichert und die URLs in einer Konstante im Code referenziert. Alternativ: Die Bilder werden einmalig generiert und als statische URLs hinterlegt.

**Pragmatischer Ansatz**: Die Edge Function wird einmalig aufgerufen (manuell oder via Button), speichert die Bilder im Storage und liefert die public URLs zurueck. Der UI-Code referenziert dann diese festen URLs. So entsteht kein Overhead bei jedem Seitenaufruf.

### 2. UI-Umbau in `PetsShop.tsx`

Der `activeWidget === 'lennox'`-Block (Zeilen 273-308) wird komplett ersetzt durch:

**a) Hero-Banner**
- Volle Breite Card mit `bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-blue-500/5`
- AI-generiertes Hero-Bild als Hintergrund (oder links/rechts Split)
- Headline "Lennox GPS Tracker", Subline, CTA-Button

**b) Feature-Grid**
- 6 Feature-Cards in `grid-cols-2 sm:grid-cols-3`
- Icons: MapPin, Activity, Shield, Battery, Droplets, Heart
- Kurztexte zu jedem Feature

**c) Produktvarianten**
- 3 Karten: Mini (39,99 EUR), Standard (49,99 EUR), XL (59,99 EUR)
- Jede mit Bild-Placeholder, Specs, "Vorbestellen"-Button (noch disabled)

**d) Abo-Modelle**
- 3 Badges/Cards: Basic, Plus, Premium
- Preise und Leistungsuebersicht

**e) Integration-Accordion**
- Wie bei Lakefields: Partner-ID, API Key, Status

### 3. Storage Bucket

- Bucket `lennox-assets` erstellen (public)
- Edge Function speichert generierte Bilder dort

### 4. Edge Function `generate-lennox-images`

```text
POST /generate-lennox-images
- Generiert 3 Bilder via Lovable AI
- Speichert in Storage Bucket
- Gibt URLs zurueck
```

Die Function nutzt den `LOVABLE_API_KEY` (bereits vorhanden) und die Supabase-Umgebungsvariablen.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/pets/PetsShop.tsx` | Lennox-Block komplett neu (Hero, Features, Produkte, Abos) |
| `supabase/functions/generate-lennox-images/index.ts` | Neue Edge Function fuer Bildgenerierung |
| DB-Migration | Storage Bucket `lennox-assets` erstellen |

## Farbschema / CI

- Primary: Teal/Cyan (`teal-500`, `cyan-500`) — passt zum bestehenden Lennox-Styling
- Akzent: Blau fuer CTAs
- Gradient: `from-teal-500/20 via-cyan-500/10 to-blue-500/5`
- Produktkarten: Helle Borders mit Teal-Glow bei Hover
