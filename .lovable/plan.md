
# PV-Demo-Anlage: Daten aus Kundenakte uebernehmen

## Was sich aendert

Die Demo-PV-Anlage in `AnlagenTab.tsx` wird von der fiktiven Berliner Anlage (9,8 kWp) auf die reale Anlage aus der Kundenakte umgestellt.

## Aenderungen in einer Datei

### `src/pages/portal/photovoltaik/AnlagenTab.tsx`

Die Konstante `DEMO_PLANT` (Zeile 31-69) wird komplett aktualisiert:

| Feld | Alt (fiktiv) | Neu (aus PDF) |
|------|-------------|---------------|
| name | EFH SMA 9,8 kWp | EFH Oberhaching 32,4 kWp |
| street | Schadowstr. | Sauerlacher Str. |
| house_number | 12 | 30 |
| postal_code | 10117 | 82041 |
| city | Berlin | Deisenhofen |
| location_notes | Sued-Dach, 30deg | Sued-Nord Ausrichtung, 108 Module |
| kwp | 9.8 | 32.4 |
| commissioning_date | 2024-06-15 | 2019-04-28 |
| wr_manufacturer | SMA | SMA Solar Technology AG |
| wr_model | Sunny Tripower 10.0 | Sunny Tripower 15000 TL (2x) |
| has_battery | true | false |
| battery_kwh | 10 | null |
| grid_operator | Stromnetz Berlin GmbH | Bayernwerk Netz GmbH |
| energy_supplier | Vattenfall | (leer) |
| feed_in_meter_operator | Stromnetz Berlin | Bayernwerk Netz |

Zusaetzlich werden die Demo-Widget-Texte (Zeile 239-254) angepasst:
- Titel: "EFH Oberhaching 32,4 kWp"
- Subtitle: "Deisenhofen - SMA Sunny Tripower"
- Leistung, Tagesertrag und Jahresertrag werden proportional zur groesseren Anlage hochskaliert (ca. 3,3x)

## Keine neuen Dateien, keine DB-Aenderungen

Reine Datenanpassung in einer bestehenden Datei.
