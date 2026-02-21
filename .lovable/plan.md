

# Fix: Grauer Bildschirm — .env-Datei wiederherstellen

## Ursache

Die `.env`-Datei wurde bei den letzten Aenderungen versehentlich als leere Datei ueberschrieben. Dadurch fehlen die Backend-Zugangsdaten (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), und die App stuerzt beim Start sofort ab mit dem Fehler "supabaseUrl is required".

## Loesung

Die `.env`-Datei mit den korrekten Werten wiederherstellen:

```
VITE_SUPABASE_PROJECT_ID="ktpvilzjtcaxyuufocrs"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://ktpvilzjtcaxyuufocrs.supabase.co"
```

Die Werte sind bekannt (aus der Projektkonfiguration). Es ist nur eine Datei betroffen, keine weiteren Code-Aenderungen noetig.

## Betroffene Datei

| Datei | Aenderung |
|---|---|
| `.env` | Wiederherstellen mit den 3 Umgebungsvariablen |

Nach dem Fix sollte die App sofort wieder funktionieren.

