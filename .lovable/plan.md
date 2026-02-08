
# Reparaturplan v3.1 — Die 3 kritischen UI-Fehler

## Problem 1: Titelbild fehlt in Ergebniskacheln

### Ursache
In `SucheTab.tsx` Zeile 134 wird `hero_image_path: null` hart gesetzt, anstatt das Titelbild aus `document_links` zu laden.

### Lösung
Nach dem Laden der Listings eine zweite Query ausführen, die die Titelbilder lädt:

```typescript
// Nachdem listings geladen sind, Titelbilder nachladen
const propertyIds = data.map(item => item.properties?.id).filter(Boolean);

const { data: titleImages } = await supabase
  .from('document_links')
  .select(`
    object_id,
    documents!inner (file_path, mime_type)
  `)
  .in('object_id', propertyIds)
  .eq('object_type', 'property')
  .eq('is_title_image', true)
  .in('documents.mime_type', ['image/jpeg', 'image/png', 'image/webp']);

// Signed URLs generieren und als Map speichern
const imageMap = new Map();
for (const img of titleImages || []) {
  if (img.documents?.file_path) {
    const { data: signedUrl } = await supabase.storage
      .from('property-documents')
      .createSignedUrl(img.documents.file_path, 3600);
    if (signedUrl?.signedUrl) {
      imageMap.set(img.object_id, resolveStorageSignedUrl(signedUrl.signedUrl));
    }
  }
}

// hero_image_path aus Map zuweisen
return data.map(item => ({
  ...mappedListing,
  hero_image_path: imageMap.get(item.properties?.id) || null,
}));
```

**Betroffene Datei:** `src/pages/portal/investments/SucheTab.tsx`

---

## Problem 2: Einstellungs-Kachel nicht sticky

### Ursache
Das `sticky top-24` funktioniert nur, wenn:
1. Das Parent-Element höher ist als der sticky-Container
2. Der sticky-Container nicht den gesamten sichtbaren Bereich einnimmt

Aktuell scrollt die **gesamte Seite** - nicht die linke Spalte. Der sticky-Container braucht einen scrollbaren Kontext.

### Lösung
Die Layout-Struktur so ändern, dass die **linke Spalte scrollt** während die rechte fixed bleibt:

```tsx
{/* Main Content - Fixed Height Layout */}
<div className="h-[calc(100vh-5rem)]"> {/* Header-Höhe abziehen */}
  <div className="h-full grid lg:grid-cols-3 gap-8 p-6">
    {/* Left Column - SCROLLBAR */}
    <div className="lg:col-span-2 overflow-y-auto pr-4 space-y-8">
      {/* ... Content ... */}
    </div>

    {/* Right Column - FIXED (nicht sticky, sondern implizit fixed durch Parent) */}
    <div className="lg:col-span-1 overflow-y-auto">
      <InvestmentSliderPanel ... />
    </div>
  </div>
</div>
```

**Alternative (einfacher):**
Den gesamten Container mit `position: relative` und definierter Höhe versehen, sodass `sticky` korrekt funktioniert.

```tsx
<div className="relative min-h-screen">
  <div className="grid lg:grid-cols-3 gap-8 p-6">
    {/* Left - Normal scroll */}
    <div className="lg:col-span-2 space-y-8">
      ...
    </div>

    {/* Right - Sticky */}
    <div className="hidden lg:block">
      <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <InvestmentSliderPanel ... />
      </div>
    </div>
  </div>
</div>
```

**Betroffene Datei:** `src/pages/portal/investments/InvestmentExposePage.tsx`

---

## Problem 3: Summen-Strich nicht aligned im T-Konto

### Ursache
Linke Spalte: 2 Zeilen (Mieteinnahmen, Steuerersparnis)
Rechte Spalte: 3 Zeilen (Zinsen, Tilgung, Verwaltung)

Die `border-t` vor Σ erscheint auf unterschiedlicher Höhe.

### Lösung A: CSS Grid mit gleichen Zeilen
Beide Spalten mit festem Grid-Layout, sodass die Summenzeile immer in derselben Grid-Row ist:

```tsx
<div className="grid md:grid-cols-2 gap-0 border rounded-lg overflow-hidden">
  {/* Linke Spalte */}
  <div className="p-4 bg-green-50/50 border-l-4 border-l-green-500">
    <div className="grid grid-rows-[auto_1fr_auto] min-h-[160px]">
      <h4>Einnahmen p.a.</h4>
      
      {/* Content - flexibel */}
      <div className="space-y-2">
        <div>+ Mieteinnahmen...</div>
        <div>+ Steuerersparnis...</div>
      </div>
      
      {/* Footer - immer unten */}
      <div className="border-t pt-2 mt-auto">
        <div>Σ Einnahmen</div>
      </div>
    </div>
  </div>

  {/* Rechte Spalte - identische Struktur */}
  <div className="p-4 bg-red-50/50 border-l-4 border-l-red-500">
    <div className="grid grid-rows-[auto_1fr_auto] min-h-[160px]">
      <h4>Ausgaben p.a.</h4>
      
      <div className="space-y-2">
        <div>− Zinsen...</div>
        <div>− Tilgung...</div>
        <div>− Verwaltung...</div>
      </div>
      
      <div className="border-t pt-2 mt-auto">
        <div>Σ Ausgaben</div>
      </div>
    </div>
  </div>
</div>
```

Der Trick: `grid-rows-[auto_1fr_auto]` mit `min-h-[160px]` stellt sicher, dass:
- Header (auto) passt sich an
- Content (1fr) nimmt verfügbaren Platz
- Footer (auto) ist immer am selben Y-Punkt

### Lösung B: Flexbox mit mt-auto
```tsx
<div className="flex flex-col min-h-[160px]">
  <h4>Header</h4>
  <div className="flex-1 space-y-2">
    {/* Variable Anzahl Zeilen */}
  </div>
  <div className="border-t pt-2 mt-auto">
    Σ Summe
  </div>
</div>
```

**Betroffene Datei:** `src/components/investment/Haushaltsrechnung.tsx`

---

## Technische Umsetzung

### Dateien zu ändern

| Datei | Änderungen |
|-------|------------|
| `src/pages/portal/investments/SucheTab.tsx` | Titelbilder aus document_links laden |
| `src/pages/portal/investments/InvestmentExposePage.tsx` | Layout für korrektes Sticky-Verhalten |
| `src/components/investment/Haushaltsrechnung.tsx` | T-Konto mit aligned Summenzeilen |

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Suchergebnis-Kacheln zeigen Titelbilder | ✓ Wenn is_title_image=true existiert |
| 2 | Beim Scrollen bleibt Parameter-Panel rechts fixiert | ✓ Panel scrollt nicht mit |
| 3 | Σ Einnahmen und Σ Ausgaben sind auf gleicher Höhe | ✓ Horizontale Linie durchgehend |
| 4 | T-Konto funktioniert auch bei unterschiedlicher Zeilenanzahl | ✓ Flexibles Layout |

---

## Zusammenfassung

Die drei Probleme haben klar identifizierbare Ursachen:

1. **Titelbild:** Query für Titelbilder fehlt komplett
2. **Sticky:** CSS-Kontext erfordert definierte Höhe oder scroll-Container
3. **Summen-Strich:** Flexbox mit `mt-auto` oder Grid mit festen Rows

Nach der Reparatur werden alle drei Ansichten (KAUFY, MOD-08, MOD-09) konsistent und benutzerfreundlich sein.
