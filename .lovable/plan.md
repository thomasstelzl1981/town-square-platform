

# Profil-Speichern Fix + MIETY Adressuebernahme

## Fehler-Analyse

In `src/pages/portal/stammdaten/ProfilTab.tsx` Zeilen 167-183 speichert die `updateProfile`-Mutation nur diese Felder:
- `display_name`
- `avatar_url`
- `email_signature`
- `letterhead_*` (6 Felder)
- `updated_at`

**Es fehlen komplett:**
- `first_name`, `last_name`
- `street`, `house_number`, `postal_code`, `city`, `country`
- `phone_landline`, `phone_mobile`, `phone_whatsapp`
- `tax_number`, `tax_id`

Das heisst: Der User gibt Daten ein, drueckt Speichern, es kommt "Profil gespeichert" — aber die Adresse, Telefonnummern etc. werden nie an die Datenbank gesendet.

## Loesung

### Aenderung 1: Update-Mutation vervollstaendigen

**Datei:** `src/pages/portal/stammdaten/ProfilTab.tsx`

Die `.update()`-Payload um alle fehlenden Felder erweitern:

```
first_name, last_name,
street, house_number, postal_code, city, country,
phone_landline, phone_mobile, phone_whatsapp,
tax_number, tax_id
```

### Aenderung 2: MIETY auto-Adressuebernahme

**Datei:** `src/pages/portal/MietyPortalPage.tsx`

In der UebersichtTile: Wenn kein Home existiert aber Profildaten vorhanden sind, wird das Create-Formular mit vorausgefuellter Adresse angezeigt. Die Adresse soll als Default-Wert sichtbar sein, nicht erst nach Klick auf "Anlegen".

Das `MietyCreateHomeForm` hat den Prefill bereits implementiert (wurde im letzten Update eingebaut) — es liest `profiles.street/house_number/postal_code/city`. Sobald der Profil-Speichern-Bug gefixt ist, funktioniert die Kette:

1. User gibt Adresse im Profil ein → Speichern funktioniert
2. MIETY liest Profildaten → Formular ist vorausgefuellt

## Technische Details

| Datei | Aenderung |
|---|---|
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Update-Mutation um 12 fehlende Felder erweitern (Zeilen 169-180) |

Keine Datenbank-Aenderungen noetig — die Spalten existieren bereits in der `profiles`-Tabelle.

