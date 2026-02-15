
# PVGIS Soll-Kurve: Anlagen-Ausrichtung + Ertragsvergleich

## Ueberblick

Die EU-PVGIS-API (kostenlos, kein API-Key) ersetzt die Google Solar API als primaere Datenquelle fuer standortbezogene Soll-Daten. Der Nutzer kann Neigungswinkel und Ausrichtung seiner Anlage eingeben und erhaelt eine exakte Soll-Kurve, gegen die die tatsaechliche (oder Demo-) Produktion verglichen wird.

**Wichtig:** PVGIS blockiert Browser-Anfragen (CORS). Daher laeuft der Abruf ueber eine Backend-Funktion als Proxy.

## Was aendert sich?

### 1. Neue Backend-Funktion: PVGIS-Proxy

**Datei: `supabase/functions/pvgis-proxy/index.ts`**

Ruft die PVGIS-API `PVcalc` auf und gibt die monatlichen Soll-Ertraege zurueck.

- Eingabe: `{ lat, lon, peakpower, loss, angle, aspect }`
- PVGIS-URL: `https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?lat=...&lon=...&peakpower=...&loss=...&angle=...&aspect=...&outputformat=json`
- Rueckgabe: Monatliche Soll-Ertraege (kWh), Jahresertrag, optimaler Winkel

Kein API-Key noetig. Rate-Limit: 30 Anfragen/Sekunde (mehr als ausreichend).

### 2. Bestehende "Solarpotenzial"-Sektion wird ersetzt

Die aktuelle Google-Solar-Sektion im Dossier (Zeile 442-503) wird durch eine neue **"Anlagen-Ausrichtung und Soll-Ertrag"**-Sektion ersetzt:

**Eingabefelder:**
| Feld | Bereich | Default | Erklaerung |
|------|---------|---------|------------|
| Neigung (angle) | 0-90 Grad | 35 | Dachneigung der Module |
| Ausrichtung (aspect) | -180 bis 180 | 0 (Sued) | 0=Sued, 90=West, -90=Ost |
| Systemverluste (loss) | 0-50% | 14 | Kabel, WR, Verschmutzung etc. |
| PV-Technologie | Dropdown | crystSi | crystSi, CIS, CdTe |

**Button:** "Soll-Ertrag berechnen" — ruft die Backend-Funktion auf

**Ergebnis-Anzeige:**
- 12-Monats-Balkendiagramm: Soll-Ertrag pro Monat (kWh)
- Jahresertrag gesamt (kWh/Jahr)
- Spezifischer Ertrag (kWh/kWp)
- Optimaler Neigungswinkel (falls von PVGIS berechnet)

### 3. Soll-Kurve im Monitoring-Chart

Die Tageskurve im "Live-Monitoring" bekommt eine zweite Linie: die **Soll-Kurve** (gestrichelt, heller). So sieht man auf einen Blick, ob die Anlage ueber oder unter Plan liegt.

Dafuer wird der saisonale Demo-Generator mit den PVGIS-Monatsdaten kalibriert: Wenn PVGIS-Daten vorliegen, wird der monatliche Soll-Ertrag als Referenz verwendet statt der fest codierten Sonnenstunden-Tabelle.

### 4. Google Solar API bleibt optional

Die bestehende `sot-solar-insights` Edge Function bleibt erhalten, wird aber aus dem Dossier entfernt. Sie kann spaeter fuer erweiterte Dachanalysen (Panels, Flaeche, CO2) wieder eingebunden werden.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/pvgis-proxy/index.ts` | **Neu** — Backend-Proxy fuer PVGIS API |
| `supabase/config.toml` | Neue Funktion registrieren |
| `src/pages/portal/photovoltaik/PVPlantDossier.tsx` | "Solarpotenzial" ersetzen durch "Anlagen-Ausrichtung + Soll-Ertrag", Soll-Linie im Chart |
| `src/components/photovoltaik/DemoLiveGenerator.ts` | Keine Aenderung (saisonale Logik bleibt als Fallback) |

## Technische Details

### PVGIS API Response (PVcalc, JSON)

```text
{
  "inputs": { "location": { "latitude": 51.5, "longitude": 7.0 }, ... },
  "outputs": {
    "monthly": {
      "fixed": [
        { "month": 1, "E_d": 1.23, "E_m": 38.1, "H(i)_d": 1.5, "H(i)_m": 46.5, "SD_m": 5.2 },
        ...
      ]
    },
    "totals": {
      "fixed": { "E_d": 3.05, "E_m": 92.8, "E_y": 1113.5, "H(i)_d": 3.6, ... }
    }
  }
}
```

- `E_m` = Monatlicher Ertrag in kWh
- `E_y` = Jahresertrag in kWh
- `E_d` = Durchschnittlicher Tagesertrag in kWh

### Geocoding fuer Koordinaten

Die Anlage hat Adressfelder (street, postal_code, city). Fuer PVGIS brauchen wir lat/lon. Dafuer nutzen wir die bestehende Google Geocoding API (gleicher Key wie bisher) innerhalb der Edge Function. Falls kein Google-Key vorhanden, kann der Nutzer lat/lon manuell eingeben.

### Warum PVGIS statt Google Solar?

| Kriterium | PVGIS | Google Solar |
|-----------|-------|-------------|
| Kosten | Kostenlos | Kostenlos (aber API-Aktivierung noetig) |
| API-Key | Keiner noetig | Google Maps Key + Solar API aktivieren |
| Anpassbar | Neigung, Ausrichtung, Verluste, Technologie | Nur Standort |
| Datenquelle | EU-Satellit (SARAH3), 15+ Jahre | Google Imagery |
| Soll-Kurve | Monatlich + stundlich moeglich | Nur jaehrlich |
| Verfuegbarkeit | Europa, Afrika, Asien, Amerika | Begrenzt auf Gebiete mit Imagery |
