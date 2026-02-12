

# Performance-Optimierung: Bilder-Laden und Bundle-Größe

## Problem-Zusammenfassung

Das Programm hat drei Haupt-Engpaesse:

1. **Bilder werden einzeln geladen** — jedes Bild erfordert einen eigenen HTTP-Request fuer eine Signed URL
2. **Zone-3-Websites sind nicht lazy-loaded** — alle 5 Website-Bundles werden beim Start geladen
3. **Kein Client-seitiger Bild-Cache** — beim Tab-Wechsel werden Bilder neu geladen

## Massnahme 1: Zentraler Image-Cache mit Signed-URL-Pooling

### Neue Datei: `src/lib/imageCache.ts`

Ein zentraler In-Memory-Cache fuer Signed URLs:
- Speichert generierte URLs mit TTL (50 Minuten bei 60-Min-Signatur)
- Verhindert doppelte Requests fuer dasselbe Bild
- Dedupliziert parallele Anfragen (wenn 3 Komponenten gleichzeitig dasselbe Bild wollen, wird nur 1 Request gemacht)

```text
Cache-Logik:
1. Anfrage fuer file_path kommt rein
2. Ist URL im Cache und noch gueltig? → Sofort zurueckgeben
3. Laeuft bereits ein Request fuer diesen Pfad? → Auf denselben Promise warten
4. Sonst: Neuen Request starten, Ergebnis cachen
```

### Aenderung: `src/lib/fetchPropertyImages.ts`

Statt direkte `createSignedUrl`-Aufrufe nutzt die Funktion den neuen Cache. Dadurch profitieren alle Stellen, die `fetchPropertyImages` verwenden, automatisch.

### Aenderung: Alle 12 Stellen mit `createSignedUrl`

Jede Stelle wird auf den zentralen Cache umgestellt:
- `Kaufy2026Home.tsx`
- `SucheTab.tsx`
- `BeratungTab.tsx` (via fetchPropertyImages)
- `ExposeImageGallery.tsx` (beide Versionen)
- `PreviewView.tsx`
- `KatalogDetailPage.tsx`
- `ProfilTab.tsx`
- `ExposeDocuments.tsx`

## Massnahme 2: Zone-3-Websites lazy-loaden

### Aenderung: `src/router/ManifestRouter.tsx`

Alle Zone-3-Komponenten (ca. 25 Imports) von direktem `import` auf `React.lazy()` umstellen:

```text
Vorher (direkt, laedt sofort):
  import Kaufy2026Home from '@/pages/zone3/kaufy2026/Kaufy2026Home';
  import MietyHome from '@/pages/zone3/miety/MietyHome';
  import SotHome from '@/pages/zone3/sot/SotHome';
  ... (25 weitere)

Nachher (lazy, laedt bei Bedarf):
  const Kaufy2026Home = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Home'));
  const MietyHome = React.lazy(() => import('@/pages/zone3/miety/MietyHome'));
  ... etc.
```

**Erwartete Ersparnis:** Mehrere hundert KB aus dem initialen Bundle entfernt. Zone-3-Seiten laden erst, wenn der User sie tatsaechlich besucht.

## Massnahme 3: Bild-Komponente mit Skeleton-Loading

### Neue Datei: `src/components/ui/cached-image.tsx`

Eine wiederverwendbare Bild-Komponente, die:
- Den Image-Cache nutzt
- Waehrend des Ladens ein Skeleton anzeigt (statt leerer Flaeche)
- Bei Fehler ein Fallback-Icon zeigt
- `loading="lazy"` fuer natives Browser-Lazy-Loading nutzt

## Auswirkungen

```text
Vorher:
  10 Immobilien auf einer Seite = 10 Signed-URL-Requests + 10 Bild-Downloads
  Seitenwechsel und zurueck = nochmal 10 + 10
  Gesamt: 40 HTTP-Requests

Nachher:
  10 Immobilien = 10 Signed-URL-Requests (gecacht) + 10 Bild-Downloads
  Seitenwechsel und zurueck = 0 neue Requests (aus Cache)
  Gesamt: 20 HTTP-Requests (50% Reduktion)
```

## Keine Datenbank-Aenderungen noetig

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/lib/imageCache.ts` | **NEU** — Zentraler Signed-URL-Cache |
| `src/components/ui/cached-image.tsx` | **NEU** — Bild-Komponente mit Cache + Skeleton |
| `src/lib/fetchPropertyImages.ts` | Cache-Integration |
| `src/router/ManifestRouter.tsx` | Zone-3-Imports auf lazy umstellen |
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Cache nutzen |
| `src/pages/portal/investments/SucheTab.tsx` | Cache nutzen |
| `src/components/investment/ExposeImageGallery.tsx` | Cache nutzen |
| `src/components/verkauf/ExposeImageGallery.tsx` | Cache nutzen |
| `src/components/dms/views/PreviewView.tsx` | Cache nutzen |
| `src/pages/portal/vertriebspartner/KatalogDetailPage.tsx` | Cache nutzen |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Cache nutzen |
| `src/components/investment/ExposeDocuments.tsx` | Cache nutzen |

