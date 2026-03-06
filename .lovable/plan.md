

# Favicon & Tab-Titel Konzept — Marken-Trennung Zone 2 + Zone 3

## Ist-Zustand

- **Favicon**: Überall dasselbe `icon-192.png` (Armstrong-Logo)
- **Tab-Titel**: Statisch `Armstrong AI` aus `index.html`
- **SEOHead** (Zone 3): Setzt `document.title` dynamisch pro Brand, aber **kein Favicon-Swap**
- **Zone 2 (Portal)**: Kein dynamisches Title/Favicon-Management — immer "Armstrong AI"

## Konzept: Brand-Favicon-Registry + dynamischer Swap

### 1. SVG-Favicons erstellen (Emoji-basiert, kein Upload nötig)

Da wir keine eigenen ICO/PNG-Dateien pro Brand haben, generieren wir **SVG-Favicons** programmatisch (Buchstabe + Brandfarbe). Alternativ: Wenn echte Brand-Logos als PNG vorliegen, diese nach `public/icons/` legen.

| Site | Favicon | Tab-Titel | Beschreibung |
|------|---------|-----------|-------------|
| **Zone 2 (Portal)** | `A` auf dunkelblau (#0a1628) | `Armstrong` | Dein digitales Cockpit |
| **KAUFY** | `K` auf gold (#D4A843) | `KAUFY` | KI-Plattform für Kapitalanlageimmobilien |
| **FutureRoom** | `F` auf dunkelgrün (#1a3a2a) | `FutureRoom` | Digitale Immobilienfinanzierung |
| **Acquiary** | `A` auf navy (#0B1120) | `ACQUIARY` | Digitale Akquise für Investments |
| **Lennox & Friends** | `L` auf forest (#2D4A3E) | `Lennox & Friends` | Premium Dog Resorts & Services |
| **System of a Town** | `S` auf slate (#1E293B) | `System of a Town` | Digitalisierung greifbar machen |
| **Ncore** | `N` auf slate-900 (#0F172A) | `Ncore` | Ganzheitliche Unternehmensberatung |
| **Otto² Advisory** | `O²` auf blau (#0055A4) | `Otto² Advisory` | Finanzberatung für Unternehmer |
| **ZL Wohnbau** | `ZL` auf rot (#C41E3A) | `ZL Wohnbau` | Wohnraum für Mitarbeiter |

### 2. Technische Umsetzung

**Neue Datei: `src/lib/brandFavicon.ts`**
- Registry: `siteKey → { faviconHref, title, description }`
- Funktion `applyBrandFavicon(siteKey: string)`: Setzt `<link rel="icon">` und `document.title` dynamisch
- SVG-Generator: Erstellt inline `data:image/svg+xml` Favicons (Buchstabe auf farbigem Kreis)

**SEOHead erweitern** (Zone 3):
- `SEOHead` ruft `applyBrandFavicon(brand)` im `useEffect` auf
- Cleanup: Favicon zurücksetzen beim Unmount

**Zone 2 — Portal Layout**:
- Im Portal-Layout (`PortalLayout.tsx` oder `SystemBar.tsx`) einmal `applyBrandFavicon('armstrong')` setzen

**index.html bleibt als Fallback**:
- Behält das Armstrong-Icon als Default (für den initialen Ladevorgang)

### 3. Dateien die geändert werden

| Datei | Aktion |
|-------|--------|
| `src/lib/brandFavicon.ts` | **NEU** — Registry + SVG-Generator + applyBrandFavicon() |
| `src/components/zone3/shared/SEOHead.tsx` | Favicon-Swap im useEffect ergänzen |
| Portal-Layout (z.B. `SystemBar.tsx`) | Armstrong-Favicon beim Mount setzen |

### 4. Vorteile

- Kein Upload von 9 verschiedenen PNG-Dateien nötig (SVG inline)
- SSOT: Eine Registry für alle Brands
- Automatisch: Jede Zone-3-Seite bekommt beim Navigieren das richtige Favicon
- Fallback: Armstrong-Default bleibt in index.html

