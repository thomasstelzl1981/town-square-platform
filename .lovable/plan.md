

## Problem

Die Vorschau-iframe hat `h-[70vh]` mit `overflow-hidden` — das erzeugt ein kleines Fenster mit doppeltem Scrolling (iframe scrollt intern + Seite scrollt). Das widerspricht unserer Widget-Scrolling-Policy (keine internen Scrollbereiche).

Ausserdem: Der "KI-Texte generieren"-Button generiert nur Text. Der User will KI-gestuetzte Website-**Qualitaet** — also dass die bestehende `sot-website-ai-generate` Edge Function genutzt wird, um eine komplette, gut designte Website-Struktur zu erzeugen (Sections, Layout, Tonalitaet), nicht nur Fliesstext.

## Aenderungen

### 1. Vorschau ohne Scroll-Kaefig (`LandingPageTab.tsx`)

- `h-[70vh] overflow-hidden` entfernen
- Stattdessen: `aspect-[16/10] w-full` — die iframe waechst mit der Seitenbreite, kein internes Scrolling
- Die iframe selbst behaelt `scrolling="no"` und wird per CSS-Scale verkleinert dargestellt (Desktop-Simulation), damit die gesamte Landing Page auf einen Blick sichtbar ist
- Alternative: Die Vorschau einfach als **Link-Button** "Vorschau im neuen Tab oeffnen" darstellen und den iframe komplett entfernen — das ist sauberer und vermeidet Scroll-Probleme gaenzlich

### 2. KI-Website-Button umbenennen und erweitern (`LandingPageTab.tsx`)

- Button von "KI-Texte generieren" zu **"KI-Website optimieren"** umbenennen
- Statt nur `sot-project-description` aufzurufen, auch `sot-website-ai-generate` aufrufen (existiert bereits), das eine komplette Section-Struktur mit professionellen Texten, Hero, Features, About, Services, Contact, Footer generiert
- Die generierten Sections werden in `website_sections` gespeichert und sind sofort in der Vorschau sichtbar
- Dabei wird die `template_id` aus dem aktuellen Design-Preset uebergeben (modern/classic/elegant etc.)

### Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/projekte/LandingPageTab.tsx` | iframe-Container: Scroll-Kaefig entfernen, Vollbreite oder Tab-oeffnen; KI-Button erweitern |

