

# MOD-14 Social — Ueberarbeitung: Mehr Struktur, Haptik & echte Funktionalitaet

## Ist-Zustand (Audit-Ergebnis)

### Was funktioniert (DB-persistent, Edge Functions deployed):
- Knowledge Base: Topics anlegen, sortieren, Briefings generieren
- Inspiration: Quellen + Samples + Pattern-Extraktion
- Inbound: Momente erfassen + Draft-Generierung
- Content Creation: Draft-Generator + 10 Copywriter-Tools
- Calendar: Wochenansicht + Planen + "Als gepostet markieren"
- Performance: Metriken erfassen + KI-Analyse

### Was NICHT funktioniert oder zu duenn ist:
1. **Assets-Seite:** Kein echter Upload — erstellt nur Placeholder-Records mit `crypto.randomUUID()` als `document_id`
2. **Overview:** Nur 4 statische Steps, keine Live-Daten (Audit-Status, Anzahl Drafts, Themen, Metriken)
3. **Alle Seiten:** Sehr minimalistisch — nur ein Titel + Empty State. Kein visuelles "Gewicht"
4. **Keine Platform-Connection-Cards:** Im Referenzbild sieht man grosse Plattform-Karten (LinkedIn, Facebook, Instagram) — fehlt komplett
5. **Audit-Seite:** Funktioniert konzeptionell via Armstrong, aber die Seite selbst zeigt zu wenig Kontext

---

## Ueberarbeitungsplan (6 Arbeitspakete)

### AP-1: Overview Dashboard mit Live-Daten + Platform-Cards

Die Overview-Seite wird zum echten Dashboard:

**Plattform-Verbindungs-Cards (inspiriert vom Referenzbild):**
- 3 grosse Cards: LinkedIn, Facebook, Instagram
- Jede Card zeigt: Icon (mit Markenfarbe), Name, Status-Badge ("Verbunden" / "Nicht verbunden")
- Klick oeffnet einen Dialog mit Profil-URL-Eingabe (gespeichert in `social_inspiration_sources` mit platform-Flag)
- Kein OAuth — rein manuell, da wir Manual Posting machen

**Live-Status-Kacheln:**
- Audit: Abgeschlossen / Offen (liest `social_personality_profiles`)
- Themen: "X von 10 definiert" (liest `social_topics` count)
- Drafts: "X Entwuerfe, Y geplant" (liest `social_drafts` count by status)
- Performance: "X Impressions gesamt" (liest `social_metrics` sum)

**Setup-Fortschritt:**
- Progressbar basierend auf: Audit done? Topics > 0? Inspiration > 0? Draft > 0?

### AP-2: Assets-Seite mit echtem Bild-Upload

**Storage Bucket erstellen:**
- `social-assets` Bucket (public) via SQL Migration
- RLS Policy: Nur eigener Tenant kann lesen/schreiben

**Upload-Flow:**
- `react-dropzone` (bereits installiert) fuer Drag & Drop
- Upload direkt in `social-assets/{tenant_id}/{filename}`
- Nach Upload: Record in `social_assets` mit `document_id` = Storage-Pfad
- Thumbnail-Preview ueber Supabase Storage Public URL

**Galerie-Ansicht:**
- Grid mit echten Bild-Thumbnails statt grauer Placeholder-Boxen
- Tag-Editor bleibt
- Bild-Vorschau bei Klick (Lightbox-Dialog)

### AP-3: Content Creation — Mehr visuelle Struktur

**Draft-Liste aufwerten (inspiriert vom Referenzbild):**
- Jeder Draft zeigt: Thumbnail-Placeholder / erstes Asset-Bild, Status-Badge (farbig), Plattform-Badges (LinkedIn/Instagram/Facebook), Titel, Textvorschau
- "Content erstellen" Button prominent rechts (wie im Referenzbild)
- Filter-Leiste oben: Plattform-Filter, Status-Filter

**Editor aufwerten:**
- Zeichenzaehler mit Plattform-Limit-Hinweis (LinkedIn: 3000, Instagram: 2200, Facebook: 63206)
- Preview-Modus: Einfache Vorschau wie der Post auf der Plattform aussehen wuerde (Profilbild-Placeholder + Text)
- Hashtag-Vorschlaege basierend auf Content

### AP-4: Audit-Seite — Mehr Kontext & Ergebnis-Darstellung

**Vor dem Audit:**
- Erklaer-Cards: "Was wird gefragt?" mit den 4 Bloecken (Identitaet, Haltung, Sprache, Grenzen)
- Zeitschaetzung pro Block
- Beispielfragen als Vorgeschmack

**Nach dem Audit (Ergebnis-Dashboard):**
- Personality-Radar oder visuelle Skala-Darstellung statt nur Text
- Jede Dimension als eigene Card mit Slider-Visualisierung (z.B. Formalitaet: 3/10 = "Eher locker")
- Sample-Post Preview (wenn im personality_vector vorhanden)
- "Audit wiederholen" bleibt

### AP-5: Kalender — Verbesserte Wochenansicht

**Visuelles Upgrade:**
- Farbige Platform-Badges in den Kalender-Slots
- Drag & Drop von unverplanten Drafts in Tage (dnd-kit)
- Tagesansicht bei Klick auf einen Tag
- Status-Farben: Draft = grau, Planned = blau, Posted = gruen

### AP-6: Inspiration & Knowledge — Mehr Tiefe

**Inspiration:**
- Plattform-Icons (LinkedIn-Logo etc.) statt nur Text-Badges
- Extracted Patterns als aufklappbare Detail-Section (Hook-Typ, Struktur, CTA-Pattern)
- "Pattern anwenden" Button der direkt zu Content Creation navigiert

**Knowledge:**
- Briefing-Inhalt anzeigen (aufklappbar) statt nur "Briefing Checkmark"
- Briefing-Details: Kernargumente, Hook-Vorschlaege, CTA-Vorschlaege
- "Post aus Thema erstellen" Shortcut-Button

---

## Technische Details

### SQL Migration (AP-2):
```sql
-- Storage Bucket fuer Social Assets
INSERT INTO storage.buckets (id, name, public) VALUES ('social-assets', 'social-assets', true);

-- RLS: Tenant-scoped upload/read
CREATE POLICY "tenant_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'social-assets' AND ...);
CREATE POLICY "tenant_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'social-assets');
```

### Dateien (neu/geaendert):
- `OverviewPage.tsx` — Komplett ueberarbeitet (Platform-Cards, Live-Stats, Progress)
- `AssetsPage.tsx` — Echter Upload via react-dropzone + Storage
- `CreatePage.tsx` — Filter-Leiste, visuelle Draft-Cards, Zeichenlimits
- `AuditPage.tsx` — Erklaer-Cards, visuelle Ergebnis-Darstellung
- `CalendarPage.tsx` — Farbige Badges, verbessertes Layout
- `InspirationPage.tsx` — Pattern-Details, Platform-Icons
- `KnowledgePage.tsx` — Aufklappbare Briefings

### Keine Demo-Daten, keine Hardcodes:
- Alle Zahlen kommen live aus der Datenbank
- Leere Zustaende zeigen klare CTAs ("Noch nicht eingerichtet")
- Platform-Cards zeigen echten Verbindungsstatus

### Reihenfolge der Implementierung:
1. AP-1 (Overview) + AP-2 (Assets Upload) — Groesster visueller Impact
2. AP-3 (Content Creation) + AP-4 (Audit) — Funktionale Verbesserungen
3. AP-5 (Kalender) + AP-6 (Inspiration/Knowledge) — Polish

