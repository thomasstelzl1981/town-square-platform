

## Plan: Content Engine vollautomatisch machen

### Was gebaut wird

1. **Themen-Tabelle `content_topics`** — Vordefinierte Artikel-Themen pro Brand mit Status (pending/published/failed)
   - Spalten: id, brand, title_prompt, category, status, created_at
   - Initial befüllt mit 3-4 Themen pro Brand (Kaufy, FutureRoom, Acquiary, Lennox, Ncore, Otto²)

2. **Edge Function erweitern** — `sot-content-engine` bekommt einen neuen Modus: ohne explizites Thema aufgerufen, zieht er das nächste pending Topic aus `content_topics` und generiert den Artikel

3. **Cron-Job einrichten** — Datenbank-Cron via `pg_cron` + `pg_net`, der am 1. und 15. jedes Monats die Edge Function aufruft (2 Artikel/Monat pro Brand)

4. **Themen-Seed** — Initiale Themen pro Brand einfügen:
   - Kaufy: "Rendite bei Kapitalanlageimmobilien", "Nebenkosten für Vermieter", "Mietrendite berechnen", "Steuervorteile Vermietung"
   - FutureRoom: "Bonitätsprüfung erklärt", "Baufinanzierung 2026", "KfW-Fördermittel", "Tilgungsplan verstehen"
   - Acquiary: "Off-Market Deals", "Institutionelle Akquise", "Due Diligence Immobilien", "Portfolio-Ankauf"
   - Lennox: "Hundepension vs. Hundesitter", "Reisen mit Hund", "Hundeversicherung", "Erstausstattung Welpe"
   - Ncore: "Digitalisierung Finanzbranche", "API-First Plattformen", "Cloud-Infrastruktur", "Datengetriebene Entscheidungen"
   - Otto²: "Projektmanagement Immobilien", "Bauträger-Kalkulation", "Nachhaltiges Bauen", "Smart Home Integration"

### Technische Details

- Cron-Schedule: `0 6 1,15 * *` (1. und 15. jeden Monats um 06:00 UTC)
- Edge Function prüft: nächstes `pending` Topic für einen rotierenden Brand → generiert Artikel → setzt Topic auf `published`
- Wenn alle Topics verbraucht: Function tut nichts (kein Fehler)
- Neue Topics können jederzeit per DB-Insert nachgelegt werden

### Dateien

| Aktion | Datei |
|--------|-------|
| Migration | `content_topics` Tabelle + Seed-Daten + Cron-Job |
| Edit | `supabase/functions/sot-content-engine/index.ts` — Auto-Topic-Modus |

