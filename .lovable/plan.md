

# Redesign Ncore Business Consulting — Von Schwarz-Emerald zu Hell-Cool-Tech

## Analyse

**Aktuell:** Reines Schwarz (`bg-black`) mit Emerald-Akzenten. Alle 8 Seiten sind dunkel, kalt, text-heavy, keine Bilder. Wirkt wie ein SaaS-Startup, nicht wie eine Unternehmensberatung mit Netzwerk und Personen.

**Ziel:** Heller, aber weiterhin cool und technisch. Nicht weiß wie Otto², sondern ein elegantes Slate-950 → Slate-50 mit Emerald-Akzenten. Bilder von Tech, Beratungssituationen, Netzwerk, Personen. Eigene Schriftart (Inter oder Space Grotesk — modern, tech-cool). Mehr visuell, weniger text-wall.

## Design-System (Neu)

```text
Hintergrund:     #0F172A (slate-900) als Basis, #F8FAFC (slate-50) für helle Sektionen
                 Wechsel zwischen dunklen und hellen Sektionen für Rhythmus
Header/Footer:   #0F172A (slate-900) mit Emerald-Akzenten
Primärfarbe:     #10B981 (emerald-500) — bleibt als Markenfarbe
Akzent-Hell:     #ECFDF5 (emerald-50) für helle Sektionen
Text dunkel:     #F1F5F9 (slate-100) auf dunklem Grund
Text hell:       #1E293B (slate-800) auf hellem Grund
Karten hell:     bg-white border-slate-200 shadow-sm
Karten dunkel:   bg-slate-800/50 border-emerald-900/30
Schriftart:      'Space Grotesk' (Google Fonts) — modern, tech, cool
```

## AI-generierte Bilder (4 Stück)

1. **Hero:** Futuristisches Netzwerk-Visualization mit verbundenen Punkten, emerald-teal Farbschema, abstrakt
2. **Beratung:** Zwei Personen am Laptop in modernem Office, Glaswände, natürliches Licht
3. **Tech/KI:** Abstraktes KI-Konzeptbild, neuronales Netz, emerald Farbton
4. **Netzwerk:** Handshake/Meeting-Situation, professionell, modern, diverse Personen

## Betroffene Dateien (8 Stück)

| Datei | Änderung |
|-------|----------|
| `NcoreLayout.tsx` | Heller Header (glassmorphism), Space Grotesk Font, Hell/Dunkel-Rhythmus im Footer |
| `NcoreHome.tsx` | Hero mit AI-Bild als Background, helle 3-Pillars-Sektion, Bilder in Why-Ncore Section |
| `NcoreDigitalisierung.tsx` | Hell/Dunkel-Sektionswechsel, KI-Bild einfügen |
| `NcoreStiftungen.tsx` | Hell/Dunkel-Sektionswechsel |
| `NcoreGeschaeftsmodelle.tsx` | Hell/Dunkel-Sektionswechsel |
| `NcoreNetzwerk.tsx` | Beratungsbild einfügen, hellere Karten |
| `NcoreGruender.tsx` | Persönlicheres Design mit Bild-Platzhalter |
| `NcoreKontakt.tsx` | Helles Formular auf hellem Hintergrund |

## Kern-Konzept: Alternierende Sektionen

Statt durchgehend schwarz wechseln Sektionen zwischen:
- **Dunkel:** `bg-slate-900 text-slate-100` (Hero, CTA, Footer)
- **Hell:** `bg-slate-50 text-slate-800` (Content-Sektionen, Karten, FAQ)

Das erzeugt visuellen Rhythmus und Modernität, bleibt aber cool und tech.

## Implementierungsschritte

1. Layout redesignen (Font, Header glassmorphism, Footer hell/dunkel)
2. AI-Bilder generieren (4 Stück via Edge Function)
3. NcoreHome komplett redesignen mit Bildern und alternierenden Sektionen
4. Alle Unterseiten auf Hell/Dunkel-Wechsel umstellen
5. Kontaktformular auf helles Design umstellen

## Kein Impact auf andere Brands

Alles auf `src/pages/zone3/ncore/*` beschränkt. Font wird nur im Ncore-Layout geladen.

