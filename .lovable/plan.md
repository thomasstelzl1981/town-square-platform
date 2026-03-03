

# Auto-Save: Tierarzt-Suchergebnisse in Pet Desk Kontaktbuch

## Konzept

Jede erfolgreiche Tierarzt-Suche auf der Doc-Seite speichert die Ergebnisse automatisch im Hintergrund in `contact_staging` mit `desk = 'pet'` und `category = 'veterinary'`. Der Nutzer merkt davon nichts — es gibt keinen Button, kein UI-Feedback. Ueber Zeit entsteht so eine wachsende Tierarzt-Datenbank im Pet Desk.

## Architektur

```text
Z3 LennoxDoc (Tierarzt-Suche)
  → sot-research-engine (findet Ergebnisse via Google Places)
  → Engine speichert automatisch in contact_staging (service role)
  → Z1 Pet Desk sieht neue Kontakte im Kontaktbuch
```

Die Auto-Save-Logik wird direkt in die `sot-research-engine` Edge Function eingebaut — NICHT im Frontend. Damit bleibt die Zone-Governance gewahrt (Z3 schreibt nicht direkt in die DB).

## Aenderungen

### 1. `sot-research-engine/index.ts` — Auto-Save nach erfolgreicher Suche (Zeilen ~780-805)

Nach dem finalen `finalResults.slice(0, max_results)` und vor dem Response:
- Pruefen ob `context.module === 'lennox_doc'` gesetzt ist
- Wenn ja: `supabaseAdmin.from('contact_staging').upsert()` fuer jeden Treffer
- Felder: `company_name`, `phone`, `email`, `website_url`, `service_area` (city aus address), `desk: 'pet'`, `category: 'veterinary'`, `source: 'z3_doc_search'`, `tenant_id: DEV_TENANT_UUID`
- `dedupe_key`: `vet_${name_normalized}` — verhindert Duplikate bei Mehrfachsuche
- Fire-and-forget (kein `await`, kein Fehler-Bubbling — Suche darf nicht langsamer werden)

### 2. `src/pages/zone3/lennox/LennoxDoc.tsx` — Context mitsenden (Zeile ~75-82)

Einzige Aenderung: `context: { module: 'lennox_doc' }` zum Request-Body hinzufuegen:

```typescript
const { data, error } = await supabase.functions.invoke('sot-research-engine', {
  body: {
    intent: 'find_contacts',
    query: 'Tierarzt Notdienst',
    location: vetSearch.trim(),
    max_results: 4,
    context: { module: 'lennox_doc' },
  },
});
```

## Datei-Matrix

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-research-engine/index.ts` | Auto-Save Block nach Phase 3 (ca. 10 Zeilen) |
| `src/pages/zone3/lennox/LennoxDoc.tsx` | `context` Feld hinzufuegen (1 Zeile) |

## Deduplizierung

`dedupe_key = 'vet_' + company_name.toLowerCase().replace(/\s+/g, '_')` stellt sicher, dass derselbe Tierarzt nur einmal gespeichert wird, egal wie oft gesucht wird.

## Tenant-Zuordnung

`tenant_id = 'a0000000-0000-4000-a000-000000000001'` (DEV_TENANT_UUID) — der System-Tenant, unter dem die Plattform-eigenen Kontakte laufen. Der Pet Desk in Zone 1 kann diese dann sehen und bei Bedarf einem echten Tenant zuordnen.

