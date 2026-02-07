
# Plan: SystemBar Optimierung - Logo, Armstrong-Icon und Uhr

## Analyse

### Problem 1: Logo mit weißem Hintergrund
Das hochgeladene PNG-Logo hat wahrscheinlich einen weißen Hintergrund statt Transparenz. Im Screenshot ist ein kleines Rechteck mit weißem Hintergrund sichtbar.

**Empfehlung fur Logo-Uberarbeitung:**
- PNG mit transparentem Hintergrund erstellen (Alpha-Kanal)
- Alternativ: SVG-Format verwenden (bereits vorhanden: `armstrong_logo_dark.svg`, `armstrong_logo_light.svg`)
- Logo ohne Text-Element, nur das grafische Symbol
- Empfohlene Exportgrosse: min. 200px Hohe fur scharfe Darstellung

### Problem 2: Armstrong kann nicht wieder geoffnet werden
Der aktuelle Armstrong-Toggle-Button (Zeile 179-196) ist nur auf grossen Bildschirmen (`lg:flex`) sichtbar und zeigt Text "Armstrong". Wenn Armstrong geschlossen wird, gibt es keinen einfachen Weg, ihn wieder zu offnen.

**Losung:** Ein separates Icon-Button (Rocket) in der rechten Headersektion hinzufugen.

### Problem 3: Uhr entfernen
Die analoge Uhr (Clock-Icon + Zeit) soll aus der Headline entfernt werden.

---

## Implementierung

### Teil 1: Logo optimieren

**Datei:** `src/components/portal/AppLogo.tsx`

- SVG-Logos statt PNG verwenden (bessere Skalierung, native Transparenz)
- Logo grosser machen (`h-8` statt `h-6`)

**Anderung:**
```tsx
// Logo imports - SVG statt PNG
import logoLight from '@/assets/logos/armstrong_logo_light.svg';
import logoDark from '@/assets/logos/armstrong_logo_dark.svg';

const sizeClasses = {
  sm: 'h-8',    // SystemBar (grosser)
  md: 'h-10',   // Login page
  lg: 'h-16',   // Landing page
};
```

**Hinweis:** Falls die SVG-Dateien nicht existieren oder auch Hintergrund-Probleme haben, mussen die Logos extern uberarbeitet werden. Ich werde die vorhandenen SVGs prufen.

### Teil 2: Armstrong-Icon hinzufugen

**Datei:** `src/components/portal/SystemBar.tsx`

**Neues Icon importieren:**
```tsx
import { 
  Home,
  LogOut, 
  Settings, 
  User,
  Rocket,      // NEU: Armstrong-Icon
  KeyRound,
  MapPin,
  Mountain
} from 'lucide-react';
```

**Neuer Button vor dem User-Menu (Zeile 177-196 ersetzen):**
```tsx
{/* Right section: Settings + Armstrong + User avatar */}
<div className="flex items-center gap-1">
  {/* Settings button */}
  <Button
    variant="ghost"
    size="icon"
    asChild
    className="h-9 w-9"
  >
    <Link to="/portal/stammdaten/sicherheit" title="Einstellungen">
      <Settings className="h-5 w-5" />
    </Link>
  </Button>

  {/* Armstrong toggle - Desktop only */}
  {!isMobile && (
    <Button
      variant={armstrongVisible ? 'secondary' : 'ghost'}
      size="icon"
      onClick={toggleArmstrong}
      className="h-9 w-9"
      title={armstrongVisible ? 'Armstrong schliessen' : 'Armstrong offnen'}
    >
      <Rocket className="h-5 w-5" />
    </Button>
  )}

  {/* User Menu */}
  <DropdownMenu>
    ...
  </DropdownMenu>
</div>
```

### Teil 3: Uhr entfernen

**Datei:** `src/components/portal/SystemBar.tsx`

**Zeilen 170-173 entfernen:**
```tsx
// ENTFERNEN:
<div className="flex items-center gap-1.5">
  <Clock className="h-4 w-4" />
  <span className="text-sm font-mono">{formattedTime}</span>
</div>
```

**Clock-Import und Zeit-State entfernen:**
- `Clock` aus Imports entfernen
- `currentTime` State und Timer-Effect konnen bleiben (evtl. fur zukunftige Nutzung) oder ebenfalls entfernt werden

---

## Visuelle Darstellung (nach Anderung)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [🏠]  [ARMSTRONG LOGO - GROSSER]    📍 Berlin · ⛰ 34m    [⚙️] [🚀] [👤] │
└─────────────────────────────────────────────────────────────────┘
       ↑ Transparenter Hintergrund                        ↑ Neu: Settings + Rocket-Icon
```

---

## Logo-Vorbereitung (extern notwendig)

Falls die SVG-Logos auch Probleme haben, hier die Anleitung zur Logo-Uberarbeitung:

| Anforderung | Beschreibung |
|-------------|--------------|
| Format | PNG mit Alpha-Kanal ODER SVG |
| Hintergrund | Transparent (kein Weiss) |
| Inhalt | Nur grafisches Symbol, ohne Text |
| Grosse | min. 200px Hohe |
| Varianten | Light (fur hellen Hintergrund), Dark (fur dunklen Hintergrund) |

**Tools:**
- Adobe Illustrator/Photoshop
- Figma (Export als SVG)
- GIMP (PNG mit Transparenz)
- Online: remove.bg fur Hintergrund entfernen

---

## Dateiänderungen

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/components/portal/AppLogo.tsx` | MODIFY | SVG-Import, grossere Darstellung |
| `src/components/portal/SystemBar.tsx` | MODIFY | Rocket-Icon, Settings-Icon, Uhr entfernen |

---

## Abhangigkeiten

- `Rocket` Icon ist in lucide-react verfugbar
- SVG-Logos sind im Asset-Ordner vorhanden (mussen aber gepruft werden)
