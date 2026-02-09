

# Phase 5: Design-Feinschliff — Präzise Anpassungen an die Vorlage

## Analyse: Aktueller Stand vs. Design-Vorlage (Screenshots)

Ich habe den aktuellen Screenshot von `/kaufy2026` mit deinen hochgeladenen Design-Screenshots verglichen. Hier sind die exakten Unterschiede:

| # | Element | Aktuell | Vorlage (Soll) |
|---|---------|---------|----------------|
| 1 | **Search-Card Position** | `bottom: -40px` (ragt unter Hero heraus) | `bottom: 80px` (schwebt INNERHALB des Hero) |
| 2 | **Search-Card Inhalt** | Tab-Leiste oben zentriert | Kein Tab, nur kompakte Cue-Bar |
| 3 | **Search-Felder** | Labels über Inputs, große Input-Boxen | Labels + Input INLINE in einer Zeile |
| 4 | **Expand-Bereich** | Buttons (Ledig/Verheiratet) | Toggle-Text: `Ledig · Verheiratet` |
| 5 | **Hero-Wrapper** | `height: 620px` | Korrekt, aber overflow klipping |
| 6 | **Perspektiven-Karten** | Icon links, Titel "Für Vermieter" | Icon oben rechts, Titel "VERMIETER" (Großbuchstaben) |
| 7 | **Perspektiven-Untertitel** | Beschreibungstext | Slogan: "Vermieten. Verstehen. Optimieren." |
| 8 | **Akkordeon-Sektion** | Fehlt komplett | 4-Panel Akkordeon mit Bild rechts |
| 9 | **Zahlen-Sektion** | Große Zahlen (500+, €250M+) | Minimales Table-Layout: `Cashflow | monatlich` |
| 10 | **Footer** | 5-Spalten Grid | 4-Spalten: Logo+Claim, Plattform, Für wen, Unternehmen |

---

## Lösung — Schritt für Schritt

### 1. Search-Card Positionierung korrigieren

**Problem:** Die Suchleiste ragt aktuell unter den Hero-Bereich.
**Lösung:** `bottom: 80px` statt `-40px`, Hero-Wrapper overflow anpassen.

**Datei:** `src/styles/zone3-theme.css`

```css
/* VORHER */
.kaufy2026-search-card {
  position: absolute;
  bottom: -40px;
  ...
}

/* NACHHER */
.kaufy2026-search-card {
  position: absolute;
  bottom: 80px;  /* Innerhalb des Hero-Bildes */
  ...
}
```

### 2. Tabs dezenter gestalten (User-Wahl)

**Lösung:** Tabs bleiben, aber werden als kleine Pill-Buttons oben rechts in der Search-Card positioniert.

**Datei:** `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx`

Änderungen:
- Tabs nach rechts oben verschieben
- Kleinere Font-Größe (10px)
- Ohne explizite Labels (nur Icons oder dezente Umschalter)

### 3. Search-Felder als Inline-Cue-Bar

**Problem:** Aktuell: Labels über Inputs, separate Zeilen.
**Vorlage:** Labels + Input in einer horizontalen Zeile, mit `·` Trennzeichen.

**Struktur (gemäß Vorlage):**
```text
┌─────────────────────────────────────────────────────────────┐
│  Einkommen (zvE) [____]  │  Eigenkapital [____]  │  [Ergebnisse →]  [↓]  │
└─────────────────────────────────────────────────────────────┘
```

**Datei:** `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx`

Änderungen:
- Flex-Layout ohne Wrapping
- Label + Input in gleichem Container
- Input ohne sichtbaren Rahmen (nur Hintergrund leicht grau)

### 4. Expand-Optionen als Text-Toggles

**Problem:** Aktuell: Große Pill-Buttons (Ledig | Verheiratet).
**Vorlage:** Dezente Text-Toggles: `Ledig · Verheiratet`

**CSS-Änderungen:**
- `.cue-toggle`: Kein Hintergrund, nur Schriftfarbe wechselt
- Aktiver Zustand: `color: #111; font-weight: 500`
- Inaktiver Zustand: `color: #999`

### 5. Perspektiven-Karten umgestalten

**Vorlage-Struktur:**
```text
┌─────────────────────────────────────┐
│  ┌──────────────────────────┐  🏠   │  ← Icon oben rechts
│  │  VERMIETER               │       │  ← Kategorie (Großbuchstaben)
│  │                          │       │
│  │  Vermieten. Verstehen.   │       │  ← Slogan (mehrzeilig)
│  │  Optimieren.             │       │
│  │                          │       │
│  │  Alles, was zählt –      │       │  ← Beschreibung
│  │  auf einen Blick.        │       │
│  └──────────────────────────┘       │
└─────────────────────────────────────┘
```

**Datei:** `src/components/zone3/kaufy2026/PerspektivenKarten.tsx`

Änderungen:
- Icon-Position: `position: absolute; top: 16px; right: 16px`
- Kategorie-Label: `VERMIETER` (uppercase, kleiner font)
- Slogan-Zeile hinzufügen: "Vermieten. Verstehen. Optimieren."
- Card klickbar machen (kein separater Link-Button)

### 6. Akkordeon-Sektion hinzufügen (NEUE KOMPONENTE)

**Vorlage zeigt 4 Panels:**
1. **Vermieter** — Kaufy macht aus Bestand eine steuerbare Anlage.
2. **Anbieter** — Kapitalanlageobjekte treffen auf den richtigen Markt.
3. **Vertrieb** — Beratung, die sich rechnen lässt – für Kunde und Vertrieb.
4. **Automationen & KI** — Im Hintergrund intelligent. Im Alltag spürbar.

**Layout:**
```text
┌───────────────────────────────────────────────────────────────────────┐
│  Eine Plattform. Drei Perspektiven.                                   │
│  Kaufy passt sich deiner Rolle an – nicht umgekehrt.                  │
│                                                                       │
│  ┌────────────────────────────────────┐   ┌─────────────────────────┐ │
│  │  1  Vermieter            ⌵         │   │                         │ │
│  │     Kaufy macht aus Bestand...     │   │   [PERSPEKTIVEN-BILD]   │ │
│  ├────────────────────────────────────┤   │                         │ │
│  │  2  Anbieter             ⌵         │   │                         │ │
│  │     Kapitalanlageobjekte...        │   │                         │ │
│  ├────────────────────────────────────┤   └─────────────────────────┘ │
│  │  3  Vertrieb             ⌵         │                               │
│  │     Beratung, die sich...          │                               │
│  ├────────────────────────────────────┤                               │
│  │  4  Automationen & KI    ⌵         │                               │
│  │     Im Hintergrund...              │                               │
│  └────────────────────────────────────┘                               │
└───────────────────────────────────────────────────────────────────────┘
```

**NEUE Datei:** `src/components/zone3/kaufy2026/PerspektivenAkkordeon.tsx`

Verwendet Radix UI `Accordion` mit custom Styling.

### 7. Zahlen-Sektion umgestalten

**Problem:** Aktuell: Große Zahlen-Grid (500+, €250M+).
**Vorlage:** Minimales Table-Layout mit linkem Accent.

**Vorlage-Struktur:**
```text
┌───────────────────────────────────────────────────────────────────────┐
│                  Immobilien sind Zahlen.                              │
│                  Kaufy macht sie verständlich.                        │
│                                                                       │
│     │ Cashflow          │ Schulden         │ Zinsbindung │ Netto-Bel. │
│     │ monatlich         │ strukturiert     │ transparent │ entscheid. │
└───────────────────────────────────────────────────────────────────────┘
```

**Datei:** `src/components/zone3/kaufy2026/ZahlenSektion.tsx`

Änderungen:
- Dunkler Hintergrund (wie Vorlage)
- 4-Spalten-Grid mit vertikalem Accent-Strich
- Headline in 2 Zeilen (erste fett, zweite leichter)

### 8. Footer anpassen

**Vorlage-Struktur:**
```text
┌─────────────────────────────────────────────────────────────────────────┐
│  KAUFY                    PLATTFORM        FÜR WEN         UNTERNEHMEN │
│                                                                         │
│  Die KI-Plattform für     Überblick        Für Vermieter   Über kaufy  │
│  Kapitalanlage.           Funktionen       Für Anbieter    Kontakt     │
│                           Immo-Wallet      Für Vertriebs.  Karriere    │
│  Vermarktung, Beratung    Vertriebs...     Für Investoren  Partner     │
│  und Verwaltung...        Automationen     Demo anfragen   Presse      │
│                           Mieti                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  © 2025 kaufy GmbH                         Impressum · Datenschutz · AGB│
└─────────────────────────────────────────────────────────────────────────┘
```

**Datei:** `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx`

Änderungen:
- 4-Spalten-Layout (Logo+Claim breit, 3 Link-Spalten)
- Footer-Bottom-Bar mit Copyright links, Legal-Links rechts
- Mobile: Akkordeon-Struktur

---

## Dateien-Änderungsplan

| # | Datei | Aktion | Beschreibung |
|---|-------|--------|--------------|
| 1 | `src/styles/zone3-theme.css` | ÄNDERN | Search-Card `bottom: 80px`, Hero-Wrapper overflow |
| 2 | `src/components/zone3/kaufy2026/Kaufy2026SearchBar.tsx` | ÄNDERN | Inline Cue-Bar, dezente Tabs, Text-Toggles |
| 3 | `src/components/zone3/kaufy2026/PerspektivenKarten.tsx` | ÄNDERN | Icon rechts oben, Slogan, klickbare Card |
| 4 | `src/components/zone3/kaufy2026/PerspektivenAkkordeon.tsx` | NEU | 4-Panel Akkordeon mit Bild |
| 5 | `src/components/zone3/kaufy2026/ZahlenSektion.tsx` | ÄNDERN | Table-Layout mit Accent-Strich |
| 6 | `src/pages/zone3/kaufy2026/Kaufy2026Layout.tsx` | ÄNDERN | Footer 4-Spalten + Bottom-Bar |
| 7 | `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | ÄNDERN | PerspektivenAkkordeon einbinden |
| 8 | `src/components/zone3/kaufy2026/index.ts` | ÄNDERN | Export PerspektivenAkkordeon |

---

## Visuelle Vorschau der Änderungen

### Search-Card (Vorher → Nachher)

**Vorher:**
```text
              ┌──────────────────────────────────────┐
              │     [Investment] [Klassisch]         │
              │                                      │
              │  Einkommen (zvE)    Eigenkapital     │
              │  ┌───────────┐      ┌───────────┐    │
              │  │  60000    │      │  50000    │    │
              │  └───────────┘      └───────────┘    │
              │                                      │
              │  [Ergebnisse →]               [↓]    │
              └──────────────────────────────────────┘
                         ↑ Ragt unter Hero heraus
```

**Nachher:**
```text
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Einkommen (zvE) [____]  Eigenkapital [____]  [Ergebnisse →] [↓]│  │
│  │  ─────────────────────────────────────────────────────────────  │  │
│  │  Familienstand: Ledig · Verheiratet     KiSt: Nein · Ja        │  │
│  └──────────────────────────────────────────────────────────────┘   │
│                    ↑ Schwebt INNERHALB des Hero (bottom: 80px)      │
└──────────────────────────────────────────────────────────────────────┘
```

### Perspektiven-Karten (Vorher → Nachher)

**Vorher:**
```text
┌─────────────────────┐
│ [🏠]                │
│                     │
│ Für Vermieter       │
│                     │
│ Beschreibungstext   │
│                     │
│ Mehr erfahren →     │
└─────────────────────┘
```

**Nachher:**
```text
┌─────────────────────┐
│                [🏠] │
│ VERMIETER           │
│                     │
│ Vermieten.          │
│ Verstehen.          │
│ Optimieren.         │
│                     │
│ Alles, was zählt –  │
│ auf einen Blick.    │
└─────────────────────┘
```

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Search-Card Position | Schwebt innerhalb Hero (nicht darunter) |
| 2 | Tabs | Dezent, klein, nicht dominant |
| 3 | Inline-Inputs | Label + Input in einer Zeile |
| 4 | Toggle-Buttons | Text-Toggles ohne Hintergrund |
| 5 | Perspektiven-Karten | Icon rechts oben, Slogan sichtbar |
| 6 | Akkordeon | 4 Panels mit Bild rechts |
| 7 | Zahlen-Sektion | Table-Layout, dunkler Hintergrund |
| 8 | Footer | 4-Spalten + Bottom-Bar |
| 9 | Ergebnis-Kacheln | MOD-08 Grid beibehalten (wie gewählt) |
| 10 | Responsive | Funktional auf Mobile und Desktop |

