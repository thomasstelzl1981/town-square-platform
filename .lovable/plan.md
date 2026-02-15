

# Demo-Daten saisonal verbessern + Google Solar API anbinden

## Ueberblick

Der Demo-Generator wird so erweitert, dass er **Jahreszeit, Taglaenge und optional Standortdaten** beruecksichtigt. Zusaetzlich wird eine Edge Function erstellt, die die **Google Solar API** abfragt, um echte standortbezogene Solarpotenzial-Daten fuer eine Adresse zu liefern.

## 1. Saisonaler Demo-Generator

**Datei: `src/components/photovoltaik/DemoLiveGenerator.ts`**

Alle Funktionen erhalten einen optionalen Parameter `month` (default: aktueller Monat). Die folgenden saisonalen Faktoren werden eingebaut:

| Monat | Sonnenaufgang | Sonnenuntergang | Peak-Faktor | Sonnenstunden/Tag |
|-------|--------------|-----------------|-------------|-------------------|
| Dez/Jan | 08:00 | 16:00 | 0.25 | 1.0 |
| Feb | 07:30 | 17:00 | 0.35 | 1.5 |
| Maerz | 06:30 | 18:30 | 0.55 | 2.5 |
| Apr/Mai | 06:00 | 20:00 | 0.75 | 3.5 |
| Jun/Jul | 05:15 | 21:30 | 1.0 | 4.8 |
| Aug | 05:45 | 20:45 | 0.90 | 4.2 |
| Sep | 06:30 | 19:30 | 0.65 | 3.0 |
| Okt | 07:00 | 18:00 | 0.45 | 2.0 |
| Nov | 07:30 | 16:30 | 0.30 | 1.2 |

Aenderungen:
- `generateDemoPower()`: Sonnenauf-/untergang und Peak-Leistung variieren nach Monat
- `generateDemoPowerDeterministic()`: gleiche saisonale Logik
- `generate24hCurve()`: beruecksichtigt aktuellen Monat
- `generateDemoEnergyMonth()`: nutzt monatsspezifische Sonnenstunden statt fixe 3.2h
- Neue Hilfsfunktion `getSeasonalParams(month)` liefert alle Parameter

**Ergebnis:** Im Februar (jetzt) zeigt die Demo-Kurve einen kurzen, flachen Bogen (ca. 07:30-17:00), im Sommer einen langen, hohen Bogen (05:15-21:30).

## 2. Google Solar API — Edge Function

Der `GOOGLE_MAPS_API_KEY` ist bereits konfiguriert. Die Google Solar API (`solar.googleapis.com`) nutzt denselben Key — vorausgesetzt, die Solar API ist im Google Cloud Projekt aktiviert.

**Neue Datei: `supabase/functions/sot-solar-insights/index.ts`**

Endpunkt: `POST { latitude, longitude }` oder `POST { address }`

Ablauf:
1. Falls nur Adresse: Geocoding ueber Google Geocoding API (gleicher Key)
2. Request an `https://solar.googleapis.com/v1/buildingInsights:findClosest`
3. Rueckgabe: `maxSunshineHoursPerYear`, `maxArrayPanelsCount`, `maxArrayAreaMeters2`, `yearlyEnergyDcKwh`, `carbonOffsetFactorKgPerMwh`

**Fallback:** Falls die Solar API nicht aktiviert ist oder keine Daten liefert (z.B. laendliche Gebiete), wird ein Fehler mit Hinweis zurueckgegeben, und die UI nutzt weiterhin den saisonalen Demo-Generator.

## 3. UI-Integration im Dossier

**Datei: `src/pages/portal/photovoltaik/PVPlantDossier.tsx`**

- Neuer Button "Solarpotenzial abrufen" in der Technik-Sektion
- Nutzt die Adresse der Anlage (street, postal_code, city) fuer den API-Call
- Zeigt Ergebnis in einer Info-Box: geschaetzte Jahresleistung, optimale Panelflaeche, CO2-Einsparung
- Wenn Daten vorhanden: Demo-Generator kann die Google-Sonnenstunden als Kalibrierung nutzen

## 4. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/photovoltaik/DemoLiveGenerator.ts` | Saisonale Parameter, variable Taglaenge |
| `supabase/functions/sot-solar-insights/index.ts` | Neue Edge Function fuer Google Solar API |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | Button "Solarpotenzial abrufen" + Ergebnis-Anzeige |
| `src/hooks/usePvMonitoring.ts` | Keine Aenderung noetig (nutzt automatisch den verbesserten Generator) |

## 5. Hinweis zur Google Solar API

Die Solar API muss im Google Cloud Projekt aktiviert sein (unter "APIs & Services"). Der vorhandene `GOOGLE_MAPS_API_KEY` wird mitverwendet. Falls die API nicht aktiviert ist, wird die Edge Function einen klaren Fehler zurueckgeben — der saisonale Demo-Fallback funktioniert unabhaengig davon.

