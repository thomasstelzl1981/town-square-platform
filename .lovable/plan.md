

## Lennox & Friends in der Partnersuche anzeigen

### Problem

Die Partnersuche auf der Lennox & Friends Website zeigt keine Ergebnisse, obwohl der Provider in der Datenbank existiert und als "published" markiert ist. Zwei Ursachen:

1. **RLS blockiert den Zugriff**: Die aktuelle SELECT-Policy auf `pet_providers` erlaubt nur Zugriff wenn `tenant_id = get_user_tenant_id()`. Zone-3-Besucher (nicht eingeloggt oder mit Z3-Auth) haben keinen Tenant und bekommen daher immer 0 Ergebnisse.

2. **Kein Demo-Fallback**: Wenn die DB-Abfrage leer zurueckkommt, zeigt die Seite nur "Keine Partner in dieser Region gefunden" statt Lennox & Friends als Fallback.

### Loesung

**1. Neue RLS-Policy fuer oeffentliche Provider**

Eine zusaetzliche SELECT-Policy erlaubt allen Nutzern (inkl. anon), veroeffentlichte Provider zu sehen:

```sql
CREATE POLICY "public_published_providers" ON pet_providers
  FOR SELECT TO anon, authenticated
  USING (is_published = true AND status = 'active');
```

Die bestehende Tenant-Policy bleibt bestehen — Provider-Inhaber sehen weiterhin auch ihre unveroffentlichten Profile. Die neue Policy ergaenzt (PERMISSIVE = OR-Logik).

**2. Search-Hook: `is_published`-Filter hinzufuegen**

Der `usePetProviderSearch`-Hook filtert aktuell nur nach `status = 'active'`. Fuer die oeffentliche Suche muss zusaetzlich `is_published = true` geprueft werden, damit nur freigegebene Provider angezeigt werden.

**3. Demo-Fallback in `LennoxStartseite.tsx`**

Wenn nach der Suche keine Ergebnisse zurueckkommen, wird Lennox & Friends als Demo-Kachel angezeigt. Die Daten kommen aus einer neuen Konstante `DEMO_LENNOX_SEARCH_PROVIDER` im Demo-Container.

```text
Suche ausfuehren
  |
  v
DB gibt Ergebnisse? ── ja ──> Echte Partner-Kacheln anzeigen
  |
  nein
  |
  v
DEMO_LENNOX_SEARCH_PROVIDER als Fallback-Kachel anzeigen
```

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| Migration SQL | NEU — Neue RLS-Policy `public_published_providers` auf `pet_providers` |
| `src/hooks/usePetProviderSearch.ts` | EDIT — `.eq('is_published', true)` zum Query hinzufuegen |
| `src/engines/demoData/petManagerDemo.ts` | EDIT — `DEMO_LENNOX_SEARCH_PROVIDER` Konstante exportieren (SearchProvider-Format) |
| `src/pages/zone3/lennox/LennoxStartseite.tsx` | EDIT — Demo-Fallback wenn `providers.length === 0` nach Suche |

### Sicherheit

- Die neue Policy exponiert NUR Provider mit `is_published = true AND status = 'active'`
- Sensible Felder wie `tenant_id`, `user_id` werden im Search-Hook nicht selektiert (nur `id, company_name, address, phone, email, bio, rating_avg, cover_image_url, service_area_postal_codes`)
- Die bestehende Tenant-basierte Policy bleibt fuer Zone 1/2 unveraendert
