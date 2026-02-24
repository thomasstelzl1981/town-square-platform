

# Systemweiter Fix: Profildaten + Geolocation-Fallback (alle Tenants)

## Bestaetigung zum Scope

Beide Massnahmen wirken **systemweit auf alle Tenants**, nicht nur auf einen einzelnen User:
- **Code-Aenderungen** in shared Hooks und Portal-Pages gelten fuer jeden eingeloggten User
- **Datenbank-Updates** werden fuer alle 5 aktiven Profile durchgefuehrt

Die bereits umgesetzte Begruessungs-Aenderung (last_name-Fallback) ist ebenfalls universeller Code und wirkt fuer alle Tenants.

---

## Teil 1: Profildaten aller Accounts vervollstaendigen (Datenbank)

Alle 5 User-Profile erhalten korrekte `last_name`, `city`, `postal_code` und `street` Werte:

| Account | last_name | city | postal_code | street |
|---------|-----------|------|-------------|--------|
| rr@unitys.com (Ralph) | Reinhold | Muenchen | 80333 | Ottostrasse 3 |
| bernhard.marchner | Marchner | Muenchen | 80333 | — |
| demo | Demo-User | Muenchen | 80333 | — |
| robyn | Robyn | Ottobrunn | 85521 | — |
| thomas.stelzl (Reference) | Stelzl | Muenchen | 80333 | — |

Damit funktioniert sowohl die Begruessung ("Mr. Reinhold", "Mr. Marchner" etc.) als auch der Standort-Fallback fuer alle Accounts.

---

## Teil 2: useGeolocation.ts — Robuster Fallback (Code)

Die Fallback-Logik wird erweitert, sodass auch bei fehlender Geolocation-Berechtigung immer ein Standort und damit Wetterdaten verfuegbar sind.

### Aktuelle Fallback-Kette (fehlerhaft):
```text
Browser-Geolocation → profile.city → FEHLER "Standort nicht verfuegbar"
```

### Neue Fallback-Kette:
```text
Browser-Geolocation → profile.city (mit korrekten Koordinaten) → Default "Muenchen"
```

### Konkrete Aenderungen in `src/hooks/useGeolocation.ts`:

1. **Geocoding-Lookup-Tabelle** fuer bekannte Staedte (statt immer die gleichen Koordinaten 48.0167/11.5843):
```text
Muenchen: 48.1351, 11.5820
Berlin: 52.5200, 13.4050
Hamburg: 53.5511, 9.9937
Ottobrunn: 48.0636, 11.6653
Default: 48.1351, 11.5820 (Muenchen)
```

2. **Fallback-Funktion** verwendet die Lookup-Tabelle, um zur Stadt die richtigen Koordinaten zu liefern

3. **Letzter Notfall-Default**: Falls `profile.city` leer ist UND keine Geolocation moeglich, wird "Muenchen" als Standort gesetzt (statt Fehler)

---

## Betroffene Dateien

| Datei | Aenderung | Scope |
|-------|-----------|-------|
| DB: profiles (5 Zeilen) | last_name, city, postal_code, street befuellen | Alle Tenants |
| src/hooks/useGeolocation.ts | Fallback-Kette + City-Koordinaten-Lookup | Systemweit (shared Hook) |

## Kein Freeze-Konflikt
`useGeolocation.ts` ist ein shared Hook ausserhalb aller Modul-Pfade — nicht vom Freeze betroffen.

## Ergebnis
- **Begruessung**: Alle Accounts zeigen den korrekten Nachnamen ("Mr. Reinhold", "Mr. Marchner", etc.)
- **Wetter**: Alle Accounts bekommen Wetterdaten — entweder via Browser-Geolocation oder via Profil-Stadt-Fallback
- **Kein Fehler mehr**: "Standort nicht verfuegbar" tritt nicht mehr auf, da immer ein Default greift
