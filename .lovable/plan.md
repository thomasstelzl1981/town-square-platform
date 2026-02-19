
# Social-Media-Vorlagenbilder generieren — 12 Posts fuer 3 Brands

## Ueberblick

Eine neue Edge Function generiert 12 Social-Media-taugliche Bilder (4 pro Brand) via AI-Bildgenerierung und speichert sie im `social-assets` Storage Bucket. Die `TemplateCard` wird erweitert, um diese Bilder anzuzeigen. Zusaetzlich wird das `social_templates`-Schema um ein `image_url`-Feld erweitert.

## Brands und ihre 4 Template-Bilder

### Kaufy (Kapitalanlage-Immobilien)
- **Rendite-Highlight**: Modernes Apartment-Gebaeude, blauer Gradient-Overlay, grosse Renditezahl "5,2%", Kaufy-Branding (blau/violett)
- **Objekt-Showcase**: Architektonische Aussenansicht eines Neubauprojekts, professionelle Immobilienfotografie-Optik
- **Berater-Portrait**: Professioneller Hintergrund fuer Beraterfoto — abstraktes blaues Design mit Platz fuer Portrait
- **Testimonial**: Cityscape/Skyline mit Kundenzitat-Platzhalter, vertrauensbildend

### FutureRoom (Finanzierung)
- **Konditionen-Highlight**: Abstrakte gruene Grafik mit Zinssymbolik, Prozentzahlen, Bankpartner-Netzwerk
- **Berater-Portrait**: Professioneller gruener Hintergrund fuer Finanzierungsberater
- **Region-Focus**: Stadtkarte/Stadtsilhouette mit Marktdaten-Overlay
- **Testimonial**: Abschluss-Szene (Handschlag, Vertragsunterzeichnung), Erfolgsstatistik

### Acquiary (Objektakquise/Sourcing)
- **Off-Market-Chancen**: Exklusives Gebaeude hinter "Vorhang"/Blur, VIP-Feeling, blauer Gradient
- **Objekt-Showcase**: Mehrfamilienhaus in A-Lage, Investment-Optik
- **Berater-Portrait**: Strategischer blauer Hintergrund fuer Akquisitionspartner
- **Sourcing-Hotspots**: Deutschland-Karte mit markierten Hotspots, Daten-Overlay

Alle Bilder werden im **4:5 Hochformat** (1080x1350px) generiert — dem Instagram/Facebook-Feed-Standard.

## Technische Umsetzung

### 1. DB-Migration: `image_url` Spalte hinzufuegen

`social_templates` bekommt eine neue Spalte `image_url TEXT` (nullable), die den oeffentlichen Storage-URL des generierten Bildes speichert.

### 2. Neue Edge Function: `sot-social-template-images`

Diese Edge Function:
1. Empfaengt `tenant_id` und `brand_context`
2. Laedt alle Templates fuer diesen Brand/Tenant
3. Generiert fuer jedes Template ein Bild via Lovable AI (`google/gemini-2.5-flash-image`)
4. Laedt das Bild als Base64 in den `social-assets` Bucket hoch (Pfad: `{tenant_id}/templates/{template_code}.png`)
5. Speichert die oeffentliche URL in `social_templates.image_url`

**Prompt-Strategie pro Template:**
Jeder Prompt beschreibt ein professionelles Social-Media-Ad-Visual im 4:5-Format mit Brand-spezifischen Farben, ohne echten Text (der wird vom Frontend ueberlagert). Stattdessen: Architektur, Abstraktion, Farben, Stimmung.

### 3. `TemplateCard.tsx` anpassen

- Wenn `image_url` vorhanden: Bild anzeigen statt Gradient-Platzhalter
- Bild im 4:5-Format (`aspect-[4/5]`, `object-cover`)
- Fallback: Gradient bleibt als Platzhalter wenn kein Bild vorhanden

### 4. `LeadManagerBrand.tsx` anpassen

- Nach dem Lazy-Seeding: automatisch die Edge Function aufrufen, um Bilder zu generieren
- Loading-State waehrend der Bildgenerierung anzeigen
- Button "Bilder neu generieren" fuer manuelles Triggern

### 5. Lazy-Seeding um `image_url` erweitern

Beim Seeding wird die Edge Function einmalig getriggert. Die generierten Bilder werden persistent gespeichert — kein erneutes Generieren bei jedem Laden.

## Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | `ALTER TABLE social_templates ADD COLUMN image_url TEXT` |
| `supabase/functions/sot-social-template-images/index.ts` | Neue Edge Function: 12 Bilder generieren und in Storage speichern |
| `src/pages/portal/lead-manager/TemplateCard.tsx` | `image_url` Prop hinzufuegen, Bild statt Gradient anzeigen |
| `src/pages/portal/lead-manager/LeadManagerBrand.tsx` | Bildgenerierung nach Seeding triggern, Loading-State |

## Umsetzungsreihenfolge

1. DB-Migration: `image_url` Spalte
2. Edge Function schreiben und deployen
3. `TemplateCard.tsx` um Bild-Anzeige erweitern
4. `LeadManagerBrand.tsx` um Generierungs-Trigger erweitern
5. Testen: Brand-Seite oeffnen, Bilder werden generiert und angezeigt
