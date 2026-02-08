
# Implementierungsplan: Investment-Engine Bilder-Fix für MOD-09 & Zone 3

## Problemanalyse

Die Investment-Suche funktioniert in **MOD-08** perfekt, weil dort:
1. Bilder über `document_links` geladen werden
2. Signed URLs mit `createSignedUrl()` generiert werden
3. Die korrekte Bucket-Referenz (`tenant-documents`) verwendet wird

In **MOD-09 (Beratung)** und **Zone 3 (KAUFY)** fehlt diese Logik oder ist fehlerhaft:

| Bereich | Ursache |
|---------|---------|
| MOD-09 BeratungTab | `hero_image_path: null` wird fest gesetzt, keine Image-Query |
| Zone 3 KaufyHome | Verwendet `getPublicUrl()` statt `createSignedUrl()` für privaten Bucket |

---

## Lösung: Gemeinsamer Image-Loading-Helper

### Phase 1: Shared Helper erstellen

**Neue Datei: `src/lib/fetchPropertyImages.ts`**

Dieser Helper übernimmt die bewährte Logik aus `SucheTab.tsx`:
- Query `document_links` mit `is_title_image` und `display_order`
- Filtert nach `mime_type.startsWith('image/')`
- Generiert Signed URLs mit `createSignedUrl()`
- Gibt ein Map zurück: `propertyId → signedUrl`

```typescript
export async function fetchPropertyImages(
  propertyIds: string[]
): Promise<Map<string, string>>
```

### Phase 2: BeratungTab.tsx anpassen

Aktuelle Query (Zeilen 56-107):
- Holt nur Listing-Daten ohne Bilder
- Setzt `hero_image_path: null` fest

Änderungen:
1. Import des neuen Helpers
2. Nach der Listings-Query: Bilder laden
3. `hero_image_path` aus der Image-Map setzen

### Phase 3: KaufyHome.tsx anpassen

Aktuelle Logik (Zeilen 84-125):
- Verwendet `getPublicUrl()` → funktioniert nicht für private Buckets

Änderungen:
1. Import des neuen Helpers
2. Ersetze die manuelle Image-Logik durch den Helper
3. Bilder werden jetzt mit Signed URLs geladen

---

## Dateien-Änderungen

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/lib/fetchPropertyImages.ts` | Shared Helper für Image-Loading |

### Zu modifizierende Dateien

| Datei | Änderungen |
|-------|------------|
| `src/pages/portal/vertriebspartner/BeratungTab.tsx` | Image-Loading integrieren |
| `src/pages/zone3/kaufy/KaufyHome.tsx` | `getPublicUrl` → Helper mit Signed URLs |

---

## Technische Details

### fetchPropertyImages Helper

```typescript
import { supabase } from '@/integrations/supabase/client';
import { resolveStorageSignedUrl } from '@/lib/storage-url';

export async function fetchPropertyImages(
  propertyIds: string[]
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  
  if (propertyIds.length === 0) return imageMap;

  // 1. Query document_links mit documents join
  const { data: imageLinks, error } = await supabase
    .from('document_links')
    .select(`
      object_id,
      is_title_image,
      display_order,
      documents!inner (file_path, mime_type)
    `)
    .in('object_id', propertyIds)
    .eq('object_type', 'property')
    .order('is_title_image', { ascending: false })
    .order('display_order', { ascending: true });

  if (error || !imageLinks?.length) return imageMap;

  // 2. Best image per property
  const bestByProperty = new Map<string, { file_path: string; ... }>();
  
  for (const link of imageLinks) {
    const doc = link.documents;
    if (!doc?.file_path) continue;
    if (!String(doc.mime_type || '').startsWith('image/')) continue;
    
    // Prefer is_title_image, then lowest display_order
    // ... (gleiche Logik wie SucheTab)
  }

  // 3. Generate signed URLs
  await Promise.all(
    Array.from(bestByProperty.entries()).map(async ([propId, best]) => {
      const { data } = await supabase.storage
        .from('tenant-documents')
        .createSignedUrl(best.file_path, 3600);
      
      if (data?.signedUrl) {
        imageMap.set(propId, resolveStorageSignedUrl(data.signedUrl));
      }
    })
  );

  return imageMap;
}
```

### BeratungTab.tsx Anpassung

```typescript
import { fetchPropertyImages } from '@/lib/fetchPropertyImages';

// In queryFn (nach dem Listings-Fetch):
const propertyIds = listingsData.map(l => l.properties.id).filter(Boolean);
const imageMap = await fetchPropertyImages(propertyIds);

// Transform:
return listingsData.map(l => ({
  ...existing,
  hero_image_path: imageMap.get(l.properties.id) || null,  // ← Jetzt dynamisch
}));
```

### KaufyHome.tsx Anpassung

```typescript
import { fetchPropertyImages } from '@/lib/fetchPropertyImages';

// Statt manueller getPublicUrl-Logik:
const propertyIds = listingsData.map(l => l.properties.id);
const imageMap = await fetchPropertyImages(propertyIds);

return listingsData.map(l => ({
  ...existing,
  image_url: imageMap.get(l.properties.id) || undefined,
}));
```

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | MOD-08 Suche → Berechnen | Bilder erscheinen (unverändert) |
| 2 | MOD-09 Beratung → Berechnen | Bilder erscheinen in Property-Grid |
| 3 | KAUFY Homepage laden | Bilder in Property-Cards sichtbar |
| 4 | Keine Konsolen-Fehler | Keine 403/404 für Bild-URLs |

---

## Zusammenfassung

Das Problem ist eine **inkonsistente Image-Loading-Implementierung**:
- MOD-08 macht es richtig (Signed URLs)
- MOD-09 lädt gar keine Bilder
- KAUFY verwendet falsche URL-Methode

Die Lösung: Ein **gemeinsamer Helper** (`fetchPropertyImages`) mit der bewährten Logik aus MOD-08, der in allen drei Bereichen verwendet wird. Dies verhindert zukünftigen Drift und stellt sicher, dass alle Bereiche konsistent funktionieren.
