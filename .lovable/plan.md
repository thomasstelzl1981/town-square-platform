
# Demo-Daten Navigation + Sicherheitshaertung

## Was wird gemacht

1. **Demo-Daten Sub-Tile in Navigation hinzufuegen** -- SQL-Migration, die den fehlenden Eintrag "Demo-Daten" als fuenften Sub-Tile zu MOD-01 in der `tile_catalog`-Tabelle hinzufuegt. Danach erscheint der Tab in der Seitennavigation.

2. **Leaked-Password-Protection aktivieren** -- Auth-Konfiguration anpassen, damit kompromittierte Passwoerter bei der Registrierung und Passwortaenderung abgelehnt werden.

3. **OTP-Expiry wird NICHT geaendert** -- Wie gewuenscht bleibt die aktuelle Ablaufzeit bestehen, um haeufiges Re-Login waehrend der Entwicklung zu vermeiden.

## Was sich NICHT aendert

- Kein Code-Aenderung noetig (Route, Komponente, Toggle-Logik existieren bereits)
- Demo-Modus bleibt default AN fuer neue User
- Build-Warnungen (CSS-Gradient-Interpolation) sind kosmetisch und blockieren den Build nicht

## Technische Details

### SQL-Migration

```text
UPDATE tile_catalog
SET sub_tiles = '[
  {"title":"Profil","route":"/portal/stammdaten/profil"},
  {"title":"Verträge","route":"/portal/stammdaten/vertraege"},
  {"title":"Abrechnung","route":"/portal/stammdaten/abrechnung"},
  {"title":"Sicherheit","route":"/portal/stammdaten/sicherheit"},
  {"title":"Demo-Daten","route":"/portal/stammdaten/demo-daten"}
]'::jsonb
WHERE tile_code = 'MOD-01';
```

### Auth-Konfiguration

Aktivierung der Leaked-Password-Protection ueber die Auth-Config-API.
