

# Redesign Otto² Advisory — Von Tech-Dark zu Freundlich-Hell (Telis-Finanz-Stil)

## Analyse

**Aktuell:** Dunkles Slate-950 Design, tech-artig, kalte Blue-Akzente auf schwarzem Hintergrund. Passt nicht zur Zielgruppe (Familien, Privathaushalte, bayerische Finanzberatung).

**Ziel (Telis-Finanz-Stil):** Heller, freundlicher, weißer Hintergrund, warmes Blau (#0055A4 Telis-Blau), professionell aber nahbar. Natur, Personen in Beratungssituationen, Familie, Eigenheim. Schriftart wechseln (weg von der Plattform-Standard-Schrift).

**Referenz Telis Finanz AG:** Weiß-blau, große Hero-Bilder mit Menschen/Familien in Natur, freundliche Typografie, saubere Karten, warme Bildsprache.

## Betroffene Dateien (6 Stück)

| Datei | Aenderung |
|-------|-----------|
| `OttoAdvisoryLayout.tsx` | Komplettes Redesign: weißer Hintergrund, blaue Akzente, neue Schriftart (Source Sans Pro / Open Sans), Header und Footer hell |
| `OttoHome.tsx` | Helles Design, AI-generierte Hero-Bilder (Beratungssituation, Familie, Eigenheim, Natur), warme Farben, weiße Karten mit blauen Akzenten |
| `OttoUnternehmer.tsx` | Hell umstellen, Bilder von Geschaeftssituationen/Beratung |
| `OttoPrivateHaushalte.tsx` | Hell umstellen, Bilder von Familie/Eigenheim/Natur |
| `OttoKontakt.tsx` | Helles Formular-Design, blaue Akzente auf weißem Grund |
| `OttoFinanzierung.tsx` | Heller Wizard, blaue Fortschrittsleiste, weiße Karten |

## Design-System (Neu fuer Otto²)

```text
Hintergrund:     #FFFFFF (weiß) + #F8FAFC (slate-50 fuer Sektionen)
Primaerfarbe:    #0055A4 (Telis-Blau / Deutsche-Bank-Blau)
Akzent:          #E8F0FE (hellblau fuer Highlights)
Text:            #1E293B (slate-800) / #64748B (slate-500)
Schriftart:      'Source Sans 3' (Google Fonts) — professionell, warm, lesbar
Buttons:         bg-[#0055A4] text-white, rounded-lg
Karten:          bg-white border border-slate-200 shadow-sm
```

## KI-generierte Bilder (4 Stueck, via Gemini Image API)

1. **Hero-Bild:** Junge Familie vor bayerischem Eigenheim, Garten, Sonnenschein
2. **Beratungs-Bild:** Berater im Gespraech mit Paar am Tisch, freundlich, professionell
3. **Natur-Bild:** Bayerische Landschaft (Berge, Wiese, See) als Hintergrundelement
4. **Eigenheim-Bild:** Modernes Einfamilienhaus mit Garten

Bilder werden via Edge Function generiert, als Base64 in Supabase Storage hochgeladen und per URL referenziert.

## Schriftart-Einbindung

Google Fonts `Source Sans 3` wird im `OttoAdvisoryLayout.tsx` per `<link>` Tag im `<Helmet>` eingebunden und nur auf Otto²-Seiten angewendet (kein globaler Impact).

## Implementierungsschritte

1. **OttoAdvisoryLayout.tsx redesignen** — Weißer Hintergrund, blaues Header/Footer, Google Font einbinden, CSS-Variablen fuer Otto²-Scope
2. **OttoHome.tsx redesignen** — Helle Hero-Section mit Bild, weiße Service-Karten, warme CTA-Bloecke, Bildergalerie mit generierten Bildern
3. **OttoUnternehmer.tsx + OttoPrivateHaushalte.tsx** — Alle dark-Klassen durch helle ersetzen (slate-950 → white, white/50 → slate-500, etc.)
4. **OttoKontakt.tsx + OttoFinanzierung.tsx** — Formulare hell stylen (weiße Inputs mit slate-Borders statt dunkle)
5. **Bilder generieren** — 4 AI-Bilder via Gemini generieren, in Storage speichern, in Komponenten einbinden

## Keine Auswirkungen auf andere Brands

Das Redesign ist vollstaendig auf `src/pages/zone3/otto/*` beschraenkt. Kein globaler CSS-Impact. Die Schriftart wird nur innerhalb des Otto²-Layouts geladen.

