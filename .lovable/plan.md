
# Investment-Engine Homogenisierung — Vollständiger Plan v2.0

## Executive Summary

Dieser Plan konsolidiert die drei Investment-Ansichten (Zone 3 KAUFY, MOD-08 Suche, MOD-09 Beratung) auf eine gemeinsame Komponentenbasis. Neue Anforderungen:

1. **Quadratische Ergebnis-Kacheln** im 4-Quadranten-Layout (Bild | Daten | Einnahmen | Ausgaben)
2. **T-Konto-Stil** (Adenauer-Kreuz) für die Haushaltsrechnung
3. **Dokumenten-Freigabe** mit DSGVO-konformer Mieterdaten-Schwärzung
4. **Single Source of Truth** für alle Investment-Exposés

---

## Teil 1: Ergebnis-Kachel (InvestmentResultTile)

### Anforderung
Die Suchergebnis-Kacheln sollen quadratisch sein und in vier Quadranten aufgeteilt werden:

```text
┌─────────────────┬─────────────────┐
│                 │ € 320.000       │
│    [BILD]       │ 87 m² · Hamburg │
│   Titelbild     │ MFH · 2 WE      │
│                 │ 4,2% Rendite    │
├─────────────────┼─────────────────┤
│   EINNAHMEN     │   AUSGABEN      │
│ + Miete €1.100  │ − Zins    €450  │
│                 │ − Tilgung €300  │
├─────────────────┴─────────────────┤
│  MONATSBELASTUNG: +€350/Mo  ✓     │
└───────────────────────────────────┘
```

### Komponente: `InvestmentResultTile.tsx`

**Neue Datei:** `src/components/investment/InvestmentResultTile.tsx`

```typescript
interface InvestmentResultTileProps {
  listing: PublicListing;
  metrics?: InvestmentMetrics | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showProvision?: boolean;
  linkPrefix?: string;
}
```

**Struktur:**
- `aspect-square` für quadratisches Format
- CSS Grid: `grid-cols-2 grid-rows-[1fr_1fr_auto]`
- **Quadrant 1 (oben links):** Bild mit Herz-Icon für Favoriten
- **Quadrant 2 (oben rechts):** Objektdaten (Preis, Fläche, Ort, Typ, Rendite)
- **Quadrant 3 (unten links):** Einnahmen (grüner Hintergrund)
- **Quadrant 4 (unten rechts):** Ausgaben (roter Hintergrund)
- **Footer:** Monatsbelastung hervorgehoben mit farbcodiertem Ergebnis

---

## Teil 2: Haushaltsrechnung als T-Konto

### Anforderung
Die Einnahmen-Ausgaben-Rechnung soll im klassischen Buchhaltungsstil (Adenauer-Kreuz / T-Konto) dargestellt werden:

```text
┌────────────────────────────────────────────────────────────┐
│                    HAUSHALTSRECHNUNG                        │
├────────────────────────────┬───────────────────────────────┤
│       EINNAHMEN p.a.       │       AUSGABEN p.a.           │
│                            │                               │
│  + Mieteinnahmen  €12.000  │  − Zinsen         €5.000      │
│  + Steuerersparnis €2.400  │  − Tilgung        €3.000      │
│                            │  − Verwaltung       €300      │
├────────────────────────────┴───────────────────────────────┤
│                     NETTO-BELASTUNG                         │
│                    +€340/Mo (positiver Cashflow)            │
└────────────────────────────────────────────────────────────┘
```

### Änderung: `Haushaltsrechnung.tsx`

**Neue Variante:** `variant="ledger"` (T-Konto-Stil)

```typescript
interface HaushaltsrechnungProps {
  result: CalculationResult;
  variant?: 'compact' | 'detailed' | 'ledger';  // NEU: ledger
  showMonthly?: boolean;
  className?: string;
}
```

**T-Konto Layout:**
- `grid md:grid-cols-2 gap-0` mit vertikaler Trennlinie
- Linke Spalte: Grüner Rand, Einnahmen mit `+` Prefix
- Rechte Spalte: Roter Rand, Ausgaben mit `−` Prefix
- Footer: Ergebniszeile spanning beide Spalten

---

## Teil 3: Dokumenten-Freigabe für Exposés

### Anforderung
Im Investment-Exposé müssen Dokumente abrufbar sein (Grundbuch, Energieausweis, Teilungserklärung etc.), jedoch mit DSGVO-konformer Sperrung von Mieterdaten.

### Architektur

**Neue Tabelle/Spalte in `document_links`:**
```sql
ALTER TABLE document_links ADD COLUMN 
  expose_visibility TEXT DEFAULT 'internal' 
  CHECK (expose_visibility IN ('internal', 'partner', 'public'));
```

**Dokumenten-Kategorien:**

| Kategorie | Standard-Freigabe | Besonderheit |
|-----------|-------------------|--------------|
| Grundbuchauszug | `partner` | Freigabe für Partner-Netzwerk |
| Energieausweis | `public` | Öffentlich (KAUFY) |
| Teilungserklärung | `partner` | Freigabe für Partner |
| Fotos | `public` | Öffentlich |
| **Mietvertrag** | `internal` | **NIEMALS freigeben** |
| **Nebenkostenabrechnung** | `internal` | **NIEMALS freigeben** |

### Komponente: `ExposeDocuments.tsx`

**Neue Datei:** `src/components/investment/ExposeDocuments.tsx`

**Features:**
- Query auf `document_links` mit `expose_visibility != 'internal'`
- Automatische Filterung nach Viewer-Typ (public/partner/internal)
- Kategorisierte Darstellung (Rechtliches, Energie, Sonstiges)
- Download-Buttons mit Signed URLs

### Schwärzungs-Workflow für Mieterdaten

**Edge Function:** `sot-document-redact`

Wenn ein Dokument mit Mieterdaten (erkannt an `document_type = 'lease'` oder `document_type = 'utility_bill'`) freigegeben werden soll:

1. **Prüfung:** Dokument enthält sensible Mieterdaten?
2. **KI-Schwärzung:** Automatische Erkennung und Schwärzung von:
   - Mieter-Namen
   - Mieter-Adressen (außer Objektadresse)
   - Bankverbindungen
   - Geburtsdaten
3. **Speicherung:** Geschwärzte Kopie in separatem Storage-Pfad
4. **Freigabe:** Nur geschwärzte Version wird extern sichtbar

---

## Teil 4: Gemeinsame Exposé-Komponente

### Komponente: `InvestmentExposeView.tsx`

**Neue Datei:** `src/components/investment/InvestmentExposeView.tsx`

Diese Komponente wird von allen drei Ansichten (KAUFY, MOD-08, MOD-09) verwendet.

```typescript
interface InvestmentExposeViewProps {
  listing: ListingData;
  images: ListingImage[];
  documents: ExposeDocument[];
  calcResult: CalculationResult | null;
  params: CalculationInput;
  onParamsChange: (params: CalculationInput) => void;
  showMap?: boolean;
  showDocuments?: boolean;
  variant?: 'page' | 'modal';
  viewerType?: 'public' | 'partner' | 'internal';
}
```

**Layout-Struktur:**

```text
┌────────────────────────────────────────┬──────────────────┐
│  [Bildergalerie mit Prev/Next/Dots]    │                  │
├────────────────────────────────────────┤  INVESTMENT      │
│  Titel · Adresse · Badges              │  SLIDER          │
├────────────────────────────────────────┤  PANEL           │
│  Key Facts (Preis, Fläche, Rendite)    │                  │
├────────────────────────────────────────┤  (sticky)        │
│  MasterGraph (40-Jahres-Projektion)    │                  │
├────────────────────────────────────────┤                  │
│  Haushaltsrechnung (T-Konto)           │                  │
├────────────────────────────────────────┤                  │
│  DetailTable40Jahre (Collapsible)      │                  │
├────────────────────────────────────────┤                  │
│  Dokumente (falls showDocuments=true)  │                  │
├────────────────────────────────────────┴──────────────────┤
│  Google Maps (ganz unten, volle Breite)                   │
└───────────────────────────────────────────────────────────┘
```

---

## Teil 5: Bildergalerie zentralisieren

### Komponente: `ExposeImageGallery.tsx` (Investment-Version)

**Neue Datei:** `src/components/investment/ExposeImageGallery.tsx`

Die bestehende `ExposeImageGallery` in `src/components/verkauf/` ist für die Editor-Ansicht (MOD-06). Für die Investment-Ansicht benötigen wir eine Read-Only-Version mit:

- Navigation: Prev/Next Buttons
- Dot-Indikatoren
- Fullscreen-Lightbox
- Klickbare Thumbnails
- Lazy Loading

**Query-Logik (kopiert aus KaufyExpose):**
```typescript
// Bilder über document_links → documents laden
const { data: images } = useQuery({
  queryKey: ['expose-images', propertyId],
  queryFn: async () => {
    const { data } = await supabase
      .from('document_links')
      .select(`
        id, display_order, is_title_image,
        documents!inner (id, name, file_path, mime_type)
      `)
      .eq('object_type', 'property')
      .eq('object_id', propertyId)
      .in('documents.mime_type', ['image/jpeg', 'image/png', 'image/webp']);
    
    // Signed URLs generieren...
    return sortedImages;
  }
});
```

---

## Teil 6: Dokumenten-Freigabe in MOD-04/MOD-06

### Anforderung
Im Verkaufsexposé (MOD-06) muss eine Kachel zur Dokumentenfreigabe existieren.

### Komponente: `ExposeDocumentReleaseCard.tsx`

**Neue Datei:** `src/components/verkauf/ExposeDocumentReleaseCard.tsx`

**Features:**
- Zeigt alle verfügbaren Dokumente der Immobilie
- Toggle-Switches für `expose_visibility` (intern/partner/öffentlich)
- **Automatische Sperrung** von Mieterdokumenten
- Warnung bei Freigabe sensibler Dokumente
- Preview-Option für Dokumente

**Integration in ExposeDetail.tsx:**
```typescript
// Neuer Tab "Dokumente" in Tabs
<TabsTrigger value="dokumente">Dokumente</TabsTrigger>

<TabsContent value="dokumente">
  <ExposeDocumentReleaseCard 
    propertyId={property.id}
    listingId={listing?.id}
  />
</TabsContent>
```

---

## Technische Umsetzung

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/investment/InvestmentResultTile.tsx` | Quadratische Suchergebnis-Kachel |
| `src/components/investment/InvestmentExposeView.tsx` | Gemeinsame Exposé-Ansicht |
| `src/components/investment/ExposeImageGallery.tsx` | Read-Only Bildergalerie für Exposés |
| `src/components/investment/ExposeDocuments.tsx` | Dokumenten-Download im Exposé |
| `src/components/verkauf/ExposeDocumentReleaseCard.tsx` | Dokumenten-Freigabe in MOD-06 |
| `supabase/functions/sot-document-redact/index.ts` | KI-Schwärzung für Mieterdaten |

### Zu ändernde Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/investment/Haushaltsrechnung.tsx` | Neue `variant="ledger"` hinzufügen |
| `src/components/investment/index.ts` | Neue Exports hinzufügen |
| `src/pages/zone3/kaufy/KaufyExpose.tsx` | Refaktorieren auf `InvestmentExposeView` |
| `src/pages/portal/investments/InvestmentExposePage.tsx` | Refaktorieren auf `InvestmentExposeView` |
| `src/pages/portal/investments/SucheTab.tsx` | `InvestmentSearchCard` → `InvestmentResultTile` |
| `src/components/vertriebspartner/PartnerExposeModal.tsx` | Refaktorieren auf `InvestmentExposeView` |
| `src/components/vertriebspartner/PartnerPropertyGrid.tsx` | Neue Kacheln verwenden |
| `src/pages/portal/verkauf/ExposeDetail.tsx` | Tab "Dokumente" hinzufügen |

### Zu löschende Dateien

| Datei | Grund |
|-------|-------|
| `src/components/investment/InvestmentSearchCard.tsx` | Ersetzt durch `InvestmentResultTile` |

### Datenbank-Migration

```sql
-- Dokumenten-Freigabe für Exposés
ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS expose_visibility TEXT DEFAULT 'internal'
CHECK (expose_visibility IN ('internal', 'partner', 'public'));

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_document_links_expose_visibility 
ON document_links(expose_visibility) 
WHERE expose_visibility != 'internal';

-- Mieterdokumente automatisch auf 'internal' setzen
UPDATE document_links 
SET expose_visibility = 'internal'
WHERE document_id IN (
  SELECT id FROM documents 
  WHERE document_type IN ('lease', 'utility_bill', 'tenant_correspondence')
);
```

---

## Akzeptanzkriterien

| # | Test | Priorität |
|---|------|-----------|
| 1 | Suchergebnis-Kacheln sind quadratisch (`aspect-square`) | Hoch |
| 2 | Kacheln zeigen 4-Quadranten-Layout (Bild, Daten, Einnahmen, Ausgaben) | Hoch |
| 3 | Haushaltsrechnung im T-Konto-Stil (Einnahmen links, Ausgaben rechts) | Hoch |
| 4 | Monatsbelastung ist prominent hervorgehoben | Hoch |
| 5 | Bildergalerie funktioniert in allen 3 Ansichten identisch | Hoch |
| 6 | Bilder sind klickbar mit Prev/Next Navigation | Mittel |
| 7 | Google Maps erscheint ganz unten im Exposé | Mittel |
| 8 | Investment-Slider bleibt sticky beim Scrollen | Mittel |
| 9 | Dokumenten-Kachel im Exposé zeigt freigegebene Dokumente | Mittel |
| 10 | MOD-06 hat Tab "Dokumente" zur Freigabe-Steuerung | Mittel |
| 11 | Mieterdokumente sind automatisch gesperrt | Hoch |
| 12 | KAUFY, MOD-08 und MOD-09 sehen visuell identisch aus | Hoch |

---

## Zusammenfassung

Dieses Refactoring eliminiert die "Copy-Paste-Architektur" und etabliert eine echte Single Source of Truth:

1. **`InvestmentResultTile`** — Quadratische Kacheln mit 4-Quadranten-Layout
2. **`Haushaltsrechnung variant="ledger"`** — T-Konto-Stil wie in der Buchhaltung
3. **`InvestmentExposeView`** — Eine Komponente für alle Investment-Exposés
4. **`ExposeDocuments`** — Dokumenten-Download mit DSGVO-Schutz
5. **`ExposeDocumentReleaseCard`** — Freigabe-Steuerung in MOD-06

Nach der Implementierung gibt es nur noch **eine Stelle**, an der Änderungen vorgenommen werden müssen — die gemeinsamen Komponenten in `src/components/investment/`.
