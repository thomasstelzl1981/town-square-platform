
# Stammdaten-Profil: Gleiches Kachel-Design wie Finanzanalyse

## Problem

Die RecordCard im Stammdaten-Profil (`ProfilTab.tsx`, Zeile 282-286) uebergibt nur 3 Summary-Felder (E-Mail, Mobil, Stadt). Dadurch greift das alte quadratische Layout statt des neuen Detail-Layouts (Foto links, Daten rechts), das in der Finanzanalyse bereits aktiv ist.

## Aenderung

### `src/pages/portal/stammdaten/ProfilTab.tsx` — Summary erweitern

Die `summary`-Props der RecordCard (Zeile 282-286) werden um alle 11 Felder erweitert, damit das `hasDetailedSummary`-Layout (>4 Eintraege) automatisch greift:

```typescript
summary={[
  ...(formData.first_name ? [{ label: 'Anrede', value: formData.display_name || '' }] : []),
  ...(formData.street ? [{ label: 'Straße', value: `${formData.street} ${formData.house_number || ''}`.trim() }] : []),
  ...(formData.postal_code ? [{ label: 'PLZ/Ort', value: `${formData.postal_code} ${formData.city || ''}`.trim() }] : []),
  ...(formData.phone_landline ? [{ label: 'Tel.', value: formData.phone_landline }] : []),
  ...(formData.phone_mobile ? [{ label: 'Mobil', value: formData.phone_mobile }] : []),
  ...(formData.email ? [{ label: 'E-Mail', value: formData.email }] : []),
]}
```

Das sind dieselben Felder wie in `UebersichtTab.tsx` (Zeile 169-177), angepasst an die `formData`-Feldnamen aus dem Profil. Sobald mehr als 4 Eintraege vorhanden sind, rendert RecordCard automatisch das neue Layout mit Foto links und Kontaktdaten rechts.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Summary-Array von 3 auf 6+ Felder erweitern |

Kein weiterer Code noetig — das Layout in `RecordCard.tsx` ist bereits implementiert und reagiert dynamisch auf die Anzahl der Summary-Eintraege.
