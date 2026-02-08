
# Bugfix-Plan: Partner-Exposé mit Bildern und Unterlagen

## Zusammenfassung

Die Investment-Suche funktioniert jetzt (Objekte werden angezeigt), aber das **vollständige Verkaufsexposé** mit Bildern und Unterlagen ist für Partner im MOD-09 nicht sichtbar. Die Bilder existieren im Storage, sind aber nicht in die Partner-Ansicht integriert.

## Problemanalyse

### Ist-Zustand
| Bereich | Status |
|---------|--------|
| Bilder im Storage | 5 Bilder physisch vorhanden |
| document_links | Korrekt verknüpft mit Property |
| RLS für listings/properties | Öffentlich lesbar (Kaufy-Channel) |
| RLS für documents/document_links | NUR für eingeloggte Nutzer |
| KaufyExpose | Zeigt Platzhalter-Icon statt Bilder |
| Partner-Modul (KatalogTab) | Zeigt nur Metadaten, keine Bilder/Dokumente |

### Soll-Zustand (basierend auf Benutzerantworten)
- **Öffentlich sichtbar:** Nur Bilder (auf Kaufy-Website)
- **Partner-Modul:** Vollständiges Exposé mit Bildern + PDFs (Energieausweis, Teilungserklärung, Grundbuch)
- **Ort:** Im Partner-Modul nach Login

## Lösung in 3 Teilen

### Teil 1: Öffentliche Bilder-RLS für Kaufy (Zone 3)

Neue RLS-Policy, die anonymen Lesezugriff auf Bilder ermöglicht, die zu aktiven Kaufy-Listings gehören:

```text
-- Öffentlicher Lesezugriff auf Bilder von Kaufy-Listings
CREATE POLICY "public_read_kaufy_images"
  ON public.documents FOR SELECT
  USING (
    mime_type LIKE 'image/%'
    AND EXISTS (
      SELECT 1 FROM document_links dl
      JOIN listings l ON dl.object_id = l.property_id
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE dl.document_id = documents.id
        AND dl.object_type = 'property'
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );

-- Passende Policy für document_links
CREATE POLICY "public_read_kaufy_image_links"
  ON public.document_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN listings l ON document_links.object_id = l.property_id
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE d.id = document_links.document_id
        AND d.mime_type LIKE 'image/%'
        AND document_links.object_type = 'property'
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );
```

### Teil 2: KaufyExpose Bilder-Integration

Die Zone 3 Exposé-Seite muss die `ExposeImageGallery` oder eine vereinfachte Version nutzen.

Datei: `src/pages/zone3/kaufy/KaufyExpose.tsx`

Änderungen:
1. Query für Bilder hinzufügen (via document_links)
2. Signed URLs generieren
3. Bildergalerie anstelle des Platzhalter-Icons rendern

```text
// Neue Query für Listing-Bilder
const { data: images } = useQuery({
  queryKey: ['listing-images', listing?.id],
  queryFn: async () => {
    // Hole Bilder via document_links + documents
    const { data } = await supabase
      .from('document_links')
      .select('documents!inner(id, name, file_path, mime_type)')
      .eq('object_type', 'property')
      .eq('object_id', listing.property_id)
      .like('documents.mime_type', 'image/%');
    
    // Generiere Signed URLs
    // ...
  },
  enabled: !!listing?.id
});
```

### Teil 3: Partner-Exposé-Detailseite (MOD-09)

Neue Komponente für eingeloggte Partner mit vollständigem Zugang zu:
- Bildergalerie (mit Titelbild)
- Dokumente (Energieausweis, Teilungserklärung, Grundbuch) als Download

Neue Datei: `src/pages/portal/vertriebspartner/KatalogDetailPage.tsx`

Neue Route: `/portal/vertriebspartner/katalog/:publicId`

Struktur:
```text
┌─────────────────────────────────────────────────────────────┐
│  ← Zurück zum Katalog                                       │
├─────────────────────────────────────────────────────────────┤
│  [Bildergalerie - ExposeImageGallery]                       │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │  ★  │ │     │ │     │ │     │ │     │                   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │
├─────────────────────────────────────────────────────────────┤
│  Objektdetails (Preis, Rendite, Provision, Fläche, etc.)    │
├─────────────────────────────────────────────────────────────┤
│  📄 Unterlagen                                              │
│  ┌──────────────────────────────────────────┐              │
│  │ 📎 Energieausweis.pdf              [↓]   │              │
│  │ 📎 Teilungserklärung.pdf           [↓]   │              │
│  │ 📎 Grundbuchauszug.pdf             [↓]   │              │
│  └──────────────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│  [Investment-Simulation - InvestmentSliderPanel]            │
│  [Haushaltsrechnung]                                        │
├─────────────────────────────────────────────────────────────┤
│  [Deal starten]  [Anfrage senden]                           │
└─────────────────────────────────────────────────────────────┘
```

## Betroffene Dateien

| Datei | Änderungstyp |
|-------|--------------|
| Migration (RLS) | Neue Policies für public image access |
| `src/pages/zone3/kaufy/KaufyExpose.tsx` | Bilder-Query + Galerie hinzufügen |
| `src/pages/zone3/kaufy/KaufyImmobilien.tsx` | Titelbild aus document_links laden |
| `src/pages/portal/vertriebspartner/KatalogDetailPage.tsx` | Neue Detailseite |
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | Navigation zur Detailseite |
| `src/pages/portal/VertriebspartnerPage.tsx` | Route hinzufügen |

## Unterlagen-Mapping

Die doc_types für die gewünschten Unterlagen sind bereits definiert:

| Unterlage | doc_type in DB | Ordner im DMS |
|-----------|----------------|---------------|
| Energieausweis | `energy_certificate` | 12_Energieausweis |
| Teilungserklärung | `division_declaration` | 04_Teilungserklärung |
| Grundbuch | `land_register` | 03_Grundbuchauszug |

Query für Partner-Dokumente:
```text
SELECT d.id, d.name, d.file_path, d.doc_type
FROM documents d
JOIN document_links dl ON d.id = dl.document_id
WHERE dl.object_type = 'property'
  AND dl.object_id = '{property_id}'
  AND d.doc_type IN ('energy_certificate', 'division_declaration', 'land_register')
  AND d.mime_type = 'application/pdf';
```

## Mobile UI-Optimierungen (aus vorherigem Plan)

Diese werden parallel implementiert:
- Haushaltsrechnung: Vertikales Layout auf Mobile
- DetailTable40Jahre: Kompakte Kartenansicht statt 9-Spalten-Tabelle
- InvestmentSliderPanel: Collapsible Advanced-Optionen

## Erfolgskriterien

- [ ] Kaufy-Website zeigt Bilder in der Objekt-Detailseite
- [ ] Kaufy-Übersicht zeigt Titelbild auf den Karten
- [ ] Partner-Katalog hat klickbare Detail-Ansicht
- [ ] Partner-Detailseite zeigt Bildergalerie
- [ ] Partner-Detailseite zeigt PDF-Unterlagen zum Download
- [ ] Unterlagen sind NICHT öffentlich zugänglich (nur nach Login)
- [ ] Mobile-Darstellung ist optimiert
