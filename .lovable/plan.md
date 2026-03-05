

# Analyse: Landing Page Bilder & KI-Qualität — Befund und Verbesserungsplan

## Befund: Bilder

**Die Bild-Pipeline funktioniert grundsätzlich.** Die Funktion `loadAllProjectImages()` in `ProjectLandingHome.tsx` liest korrekt aus `document_links` (object_type='project') und filtert nach slot_keys:
- `hero` → Hero-Section Hintergrundbild
- `exterior`, `interior`, `surroundings` → Foto-Karussell

**Voraussetzung:** Im Projekt-Datenblatt (MOD-13, Tab 1) müssen die 4 Bild-Slots befüllt sein. Sind dort Bilder hochgeladen, erscheinen sie auf der Landing Page. **Das funktioniert bereits.**

**Was FEHLT:**
1. **Kein KI-Hero-Enhancement** — Das Hero-Bild wird 1:1 übernommen, keine KI-Optimierung (Belichtung, Zuschnitt, Overlay)
2. **Kein Fallback-Bild** — Ohne hochgeladene Bilder zeigt die Hero-Section nur einen dunklen Gradient, die Galerie ein leeres Building2-Icon
3. **Logo-Slot wird ignoriert** — Der `logo`-Slot ist im DataSheet vorhanden, wird aber auf der Landing Page nicht angezeigt

## Befund: KI-Website-Qualität — Architektur-Disconnect

**Kritischer Fehler gefunden:** Der "KI-Website optimieren"-Button hat einen **Architektur-Disconnect**:

```text
Button "KI-Website optimieren"
  → ruft sot-website-ai-generate auf
  → generiert website_sections für tenant_websites (Profil-Website-System)
  → ABER: ProjectLandingHome.tsx liest aus landing_pages + dev_projects
  → Die generierten Inhalte werden NIRGENDS angezeigt!
```

Das heißt: Die KI-Texte landen in der falschen Tabelle. Die Landing Page zeigt weiterhin nur die Rohdaten aus `dev_projects` und `landing_pages`.

## Befund: Seiten-Design

Die aktuelle Landing Page ist **funktional solide** (Investment-Engine, Einheitentabelle, Kontaktformular), aber im Vergleich zu den Brand-Websites (Kaufy, SoT) visuell **deutlich einfacher**:
- Keine animierten Sektionen
- Kein Logo im Header
- Kein Impressum/Datenschutz-Link
- Keine Lagebeschreibung als eigene Sektion
- Kein Social Proof / Vertrauenselemente

## Verbesserungsplan (3 Stufen)

### Stufe 1: Bilder korrekt einbauen + Fallback
**Dateien:** `ProjectLandingHome.tsx`

- Logo-Slot im Header anzeigen (wenn vorhanden)
- Fallback-Hero: KI-generiertes Immobilien-Platzhalterbild über `google/gemini-2.5-flash-image` als Edge Function
- Hero-Bild mit professionellem CSS-Treatment (Gradient-Overlay, Focal-Point-Crop)

### Stufe 2: KI-Pipeline reparieren
**Dateien:** `LandingPageTab.tsx`, neue Edge Function `sot-project-landing-ai`

Den "KI-Website optimieren"-Button umleiten: Statt `sot-website-ai-generate` (falsches System) eine neue Edge Function aufrufen, die:
1. Projektdaten + Einheiten + Developer-Context liest
2. Per Gemini 2.5 Pro optimierte Texte generiert: Hero-Headline, Subheadline, Projektbeschreibung, Lagebeschreibung, 3-5 Highlights
3. Die Ergebnisse direkt in `landing_pages` schreibt (hero_headline, hero_subheadline, about_text, location_description, highlights_json)
4. Optional: Hero-Bild per `gemini-2.5-flash-image` als cinematic Real-Estate-Visual generieren und in Storage ablegen

### Stufe 3: Website-Design aufwerten
**Datei:** `ProjectLandingHome.tsx`

- Header mit Logo + Navigation (Projekt, Einheiten, Kontakt als Anchor-Links)
- Hero-Section: Größer (500px), mit animiertem Text-Fade
- Neue Sektion: Lagebeschreibung mit Karte-Placeholder
- Neue Sektion: Highlights als Feature-Grid (Icons + Text)
- Footer mit Impressum-Daten aus `landing_pages.imprint_text`
- Datenschutz-Link
- "Powered by KAUFY"-Badge im Footer
- Responsive Mobile-Optimierung

### Freeze-Check

| Pfad | Bereich | Frozen? |
|---|---|---|
| `ProjectLandingHome.tsx` (Zone 3) | ZONE3 | Prüfung nötig |
| `LandingPageTab.tsx` (MOD-13) | MOD-13 | Nicht frozen |
| Neue Edge Function | Backend | Frei |

Ich muss vor der Implementierung `spec/current/00_frozen/zone3_freeze.json` prüfen.

### Zusammenfassung

Die Bilder funktionieren technisch — sie müssen nur im Datenblatt hochgeladen sein. Das Hauptproblem ist der **KI-Disconnect**: Der Button generiert Inhalte in die falsche Tabelle. Mit der Reparatur + Design-Upgrade entsteht eine professionelle, durchdachte Landing Page mit voller KI-Power, die automatisch alle Einheiten mit Investment-Engine zeigt.

