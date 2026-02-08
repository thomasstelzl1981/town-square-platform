
# Fix-Plan: Partner-Katalog Zeilen-Klick und Exposé-Abfrage

## Identifizierte Probleme

### Problem 1: Zeilen sind nicht klickbar

**Ursache:** In `KatalogTab.tsx` (Zeile 488-500) wird `PropertyTable` aufgerufen, aber **kein `onRowClick` Prop** übergeben:

```typescript
<PropertyTable
  data={filteredListings}
  columns={columns}
  isLoading={isLoading}
  rowActions={renderRowActions}
  emptyState={{...}}
  // ⚠️ FEHLT: onRowClick={(row) => navigate(...)}
/>
```

Die `PropertyTable`-Komponente unterstützt `onRowClick`, aber es wird nicht verwendet. Nur das Eye-Icon in `rowActions` navigiert aktuell.

---

### Problem 2: "Objekt nicht gefunden" (HTTP 400)

**Netzwerk-Response:**
```json
{
  "code": "22P02",
  "message": "invalid input syntax for type uuid: \"leipzig-76f21038\""
}
```

**Ursache:** In `KatalogDetailPage.tsx` (Zeile 77) ist die Query falsch:

```typescript
.or(`public_id.eq.${publicId},id.eq.${publicId}`)
```

Wenn `publicId = 'leipzig-76f21038'` (ein String-Slug), versucht PostgreSQL diesen Wert auch als UUID für die `id`-Spalte zu parsen — was fehlschlägt.

**Lösung:** Die `id`-Bedingung nur hinzufügen, wenn der Wert ein valides UUID-Format hat.

---

## Technische Lösung

### Fix 1: Zeilen-Klick in KatalogTab.tsx

```typescript
<PropertyTable
  data={filteredListings}
  columns={columns}
  isLoading={isLoading}
  rowActions={renderRowActions}
  onRowClick={(row) => {
    const identifier = row.public_id || row.id;
    navigate(`/portal/vertriebspartner/katalog/${identifier}`);
  }}
  emptyState={{...}}
/>
```

---

### Fix 2: UUID-Validierung in KatalogDetailPage.tsx

```typescript
// Zeile 54-79: Query-Logik anpassen
const isValidUUID = (str: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Nur public_id abfragen wenn kein UUID-Format
// Sonst: .or() mit beiden Optionen
let query = supabase
  .from('listings')
  .select(`...`)

if (isValidUUID(publicId)) {
  // Könnte UUID oder public_id sein — beide prüfen
  query = query.or(`public_id.eq.${publicId},id.eq.${publicId}`);
} else {
  // Definitiv kein UUID — nur public_id prüfen
  query = query.eq('public_id', publicId);
}

const { data, error } = await query.limit(1).maybeSingle();
```

---

### Fix 3: Provision im Exposé ausblenden (Anforderung)

In `KatalogDetailPage.tsx` (Zeile 328-332) wird aktuell die Provision angezeigt:

```typescript
{listing.commission_rate > 0 && (
  <p className="text-sm text-muted-foreground">
    Provision: {listing.commission_rate}%
  </p>
)}
```

Da die Provision nur in der Katalog-Liste sichtbar sein soll, aber nicht im Exposé, wird dieser Block entfernt.

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `KatalogTab.tsx` | `onRowClick` Prop hinzufügen |
| `KatalogDetailPage.tsx` | UUID-Validierung, Provisions-Anzeige entfernen |

---

## Implementierungsreihenfolge

1. **KatalogTab.tsx**: `onRowClick` hinzufügen — Zeilen werden klickbar
2. **KatalogDetailPage.tsx**: Query-Logik mit UUID-Prüfung — "Objekt nicht gefunden" gefixt
3. **KatalogDetailPage.tsx**: Provisions-Block entfernen — Provision nur in Liste sichtbar
4. **Testen**: Klick auf Zeile → Exposé öffnet sich korrekt

---

## Akzeptanzkriterien

| # | Test |
|---|------|
| 1 | Klick auf Zeile im Katalog → Exposé öffnet sich |
| 2 | Klick auf Eye-Icon → Exposé öffnet sich (weiterhin funktional) |
| 3 | Exposé zeigt Immobilie ohne Provisionsangabe |
| 4 | Provision ist nur in der Katalog-Tabelle sichtbar |
| 5 | Kein "Objekt nicht gefunden" Fehler mehr |
