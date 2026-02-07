
# Umsetzungsplan: Bildergalerie im Exposé-Tab + Demo-Bilder

## 1. Analyse der Probleme

### Problem 1: ExposeImageGallery nicht eingebunden
Die Komponente `ExposeImageGallery` existiert bereits unter `src/components/verkauf/ExposeImageGallery.tsx`, wurde aber **nie in `ExposeTab.tsx` importiert und integriert**.

### Problem 2: Keine Demo-Bilder vorhanden
Das Golden-Path-Seed enthält nur 12 PDF-Dokumente. Der Ordner `11_Fotos` (ID: `5708b5bb-f3ac-4e19-bfc6-bb65fff26963`) ist leer.

### Problem 3: Empty-State wird nicht angezeigt
Die ExposeImageGallery-Komponente hat zwar einen Empty-State, aber ohne Einbindung sieht man nichts.

---

## 2. Technische Umsetzung

### Schritt 1: ExposeTab.tsx - Galerie einbinden

**Datei:** `src/components/portfolio/ExposeTab.tsx`

```typescript
// Import hinzufügen (Zeile 6)
import ExposeImageGallery from '@/components/verkauf/ExposeImageGallery';

// Nach Header-Card (Zeile 96), vor Objektbeschreibung einfügen:
{/* Bildergalerie - immer sichtbar */}
<ExposeImageGallery propertyId={property.id} />
```

Die Galerie zeigt automatisch einen Platzhalter-State, wenn keine Bilder vorhanden sind.

### Schritt 2: Demo-Bilder generieren und einspielen

Da es sich um Demo-Daten handelt, verwende ich den KI-Bildgenerator, um 4-5 typische Immobilienfotos zu erstellen:

| Nr | Motiv | Dateiname |
|----|-------|-----------|
| 1 | Außenansicht Altbau Leipzig | demo_aussen_1.jpg |
| 2 | Wohnzimmer mit Parkettboden | demo_wohnzimmer_1.jpg |
| 3 | Moderne Küche | demo_kueche_1.jpg |
| 4 | Balkon mit Stadtblick | demo_balkon_1.jpg |
| 5 | Treppenhaus historisch | demo_treppenhaus_1.jpg |

### Schritt 3: Seed-Funktion erweitern (Zone 1)

**Datei:** Neue Migration für `seed_golden_path_data()`

Die Bilder werden über eine Edge-Function in den Storage hochgeladen und mit dem Property verknüpft:

```sql
-- Ergänzung in seed_golden_path_data()
-- 5 Demo-Bilder für 11_Fotos Ordner
INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source) VALUES 
  ('00000000-0000-4000-a000-000000000301'::uuid, t_id, 'SOT-D-IMG001', 'Außenansicht.jpg', 'demo/fotos/aussen_1.jpg', 'image/jpeg', 250000, 'photo', 'property', 'import'),
  ('00000000-0000-4000-a000-000000000302'::uuid, t_id, 'SOT-D-IMG002', 'Wohnzimmer.jpg', 'demo/fotos/wohnzimmer_1.jpg', 'image/jpeg', 280000, 'photo', 'property', 'import'),
  ('00000000-0000-4000-a000-000000000303'::uuid, t_id, 'SOT-D-IMG003', 'Küche.jpg', 'demo/fotos/kueche_1.jpg', 'image/jpeg', 220000, 'photo', 'property', 'import'),
  ('00000000-0000-4000-a000-000000000304'::uuid, t_id, 'SOT-D-IMG004', 'Balkon.jpg', 'demo/fotos/balkon_1.jpg', 'image/jpeg', 190000, 'photo', 'property', 'import'),
  ('00000000-0000-4000-a000-000000000305'::uuid, t_id, 'SOT-D-IMG005', 'Treppenhaus.jpg', 'demo/fotos/treppenhaus_1.jpg', 'image/jpeg', 210000, 'photo', 'property', 'import');

-- Verknüpfung mit 11_Fotos-Ordner und Property
INSERT INTO document_links (id, tenant_id, document_id, node_id, object_type, object_id, link_status) VALUES
  ('00000000-0000-4000-a000-000000000401'::uuid, t_id, '00000000-0000-4000-a000-000000000301'::uuid, 
   (SELECT id FROM storage_nodes WHERE property_id = prop_id AND name = '11_Fotos'), 
   'property', prop_id, 'linked'),
  -- ... (analog für alle 5 Bilder)
```

### Schritt 4: Statische Platzhalter-Bilder hinterlegen

Als Alternative zu KI-generierten Bildern können lizenzfreie Bilder verwendet werden:

**Option A:** Public-Domain-Bilder von Unsplash/Pexels in `public/demo/fotos/` hinterlegen

**Option B:** KI-generierte Bilder mit dem Nano Banana Model erstellen

Die Bilder werden dann über eine Admin-Funktion oder manuell in den Storage-Bucket hochgeladen.

---

## 3. Datei-Änderungen

| Datei | Änderung |
|-------|----------|
| `src/components/portfolio/ExposeTab.tsx` | Import + Integration von ExposeImageGallery |
| `supabase/migrations/...` | Seed-Funktion um 5 Demo-Bilder erweitern |
| `public/demo/fotos/` | 5 Platzhalter-Bilder (falls statisch) |
| `src/hooks/useGoldenPathSeeds.ts` | SEED_IDS um Bild-IDs erweitern |

---

## 4. Neue Exposé-Struktur nach Umsetzung

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ Eigentumswohnung                                            │
│ Leipziger Straße 42                                         │
│ 04109 Leipzig, Deutschland              DEMO-001            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BILDERGALERIE (NEU - immer sichtbar)                        │
│ ┌────────────────────────┐  ┌─────┐  ┌─────┐                │
│ │                        │  │     │  │     │                │
│ │    Hauptbild          │  │ Th1 │  │ Th2 │                │
│ │    (Außenansicht)     │  │     │  │     │                │
│ │                        │  ├─────┤  ├─────┤                │
│ │                        │  │ Th3 │  │ Th4 │                │
│ └────────────────────────┘  └─────┘  └─────┘                │
│ 5 Bilder aus dem Datenraum          → Im Datenraum bearbeiten│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OBJEKTBESCHREIBUNG                                          │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

Falls keine Bilder vorhanden:

```
┌─────────────────────────────────────────────────────────────┐
│ BILDERGALERIE                                               │
│ Wählen Sie Bilder aus dem Datenraum für Ihr Exposé          │
│ ┌─────────────────────────────┐  ┌───┐┌───┐                 │
│ │  [Upload-Icon]              │  │   ││   │                 │
│ │  Bilder im Datenraum        │  │   ││   │                 │
│ │  hochladen                  │  │   ││   │                 │
│ │  → Immobilienakte öffnen    │  └───┘└───┘                 │
│ └─────────────────────────────┘                             │
│ Bilder werden aus dem Datenraum der Immobilie verknüpft     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Testplan

### Test 1: Galerie-Karte sichtbar (auch ohne Bilder)
1. Immobilienakte öffnen → Tab "Exposé"
2. **Erwartung:** Bildergalerie-Karte erscheint direkt nach Header
3. Empty-State mit Upload-Hinweis sichtbar

### Test 2: Demo-Bilder nach Seed
1. Zone 1 → Testdaten → Golden Path Seeds ausführen
2. Immobilienakte DEMO-001 öffnen → Tab "Exposé"
3. **Erwartung:** 5 Bilder in Galerie sichtbar

### Test 3: Lightbox funktioniert
1. Auf Hauptbild klicken
2. **Erwartung:** Vollbild-Ansicht mit Navigation

### Test 4: Konsistenz in Verkaufsmodulen
1. MOD-06 Verkauf → Exposé für DEMO-001
2. **Erwartung:** Dieselben 5 Bilder erscheinen
