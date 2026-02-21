

## Problem

Die `.env`-Datei fehlt im Projekt. Dadurch sind `VITE_SUPABASE_URL` und `VITE_SUPABASE_PUBLISHABLE_KEY` beim Start `undefined`, und die App stuerzt mit dem Fehler `supabaseUrl is required` ab.

Die Datei `client.ts` und `.env` werden automatisch vom System verwaltet und duerfen nicht manuell bearbeitet werden. Die Synchronisation hat in diesem Fall aber nicht funktioniert.

## Loesung

Wir fuegen in `vite.config.ts` einen Fallback ueber die `define`-Option hinzu. Damit werden die Supabase-Werte direkt in den Build eingebettet, falls die `.env`-Datei fehlt oder nicht geladen wird.

## Aenderung

**Datei: `vite.config.ts`**

In der `defineConfig`-Funktion wird eine `define`-Sektion ergaenzt, die die bekannten Supabase-Werte als Fallback bereitstellt:

```text
define: {
  'import.meta.env.VITE_SUPABASE_URL':
    JSON.stringify(process.env.VITE_SUPABASE_URL || "https://ktpvilzjtcaxyuufocrs.supabase.co"),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':
    JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIs..."),
}
```

Die Werte sind der oeffentliche (anon) Supabase-URL und Key, die bereits im Projekt bekannt und nicht geheim sind.

## Warum ist das sicher?

- Die Werte (URL + anon key) sind **oeffentliche** publishable Werte -- sie sind so konzipiert, dass sie im Frontend sichtbar sind.
- Die eigentliche Sicherheit liegt in den RLS-Policies der Datenbank, nicht in diesen Schluesseln.
- Sobald das System die `.env`-Datei korrekt synchronisiert, werden die `.env`-Werte bevorzugt (da `process.env` sie enthaelt).

## Ergebnis

Die App startet zuverlaessig, auch wenn die automatische `.env`-Synchronisation fehlschlaegt.

