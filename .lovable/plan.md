
# Plan: Logo aus SystemBar entfernen

## Begründung
Da das Projekt mehrere Marken umfasst (KAUFY, MIETY, SystemOfATown, Future Room), macht ein festes Software-Logo im SystemBar keinen Sinn.

## Änderungen

### Datei: `src/components/portal/SystemBar.tsx`

**1. Import entfernen (Zeile 33):**
```tsx
// ENTFERNEN:
import { AppLogo } from './AppLogo';
```

**2. Logo-Container entfernen (Zeilen 113-116):**
```tsx
// ENTFERNEN:
{/* Logo - Theme-aware */}
<div className="hidden md:flex items-center">
  <AppLogo size="sm" />
</div>
```

## Resultat

**Vorher:**
```text
| [Haus]  [LOGO]  |    Standort · 11:05    |  [Rakete] [Avatar] |
```

**Nachher:**
```text
| [Haus]          |    Standort · 11:05    |  [Rakete] [Avatar] |
```

---

## Hinweis zu Armstrong Drag & Drop

Ihre Idee, Armstrong frei im Browser verschiebbar zu machen, ist technisch umsetzbar. Das würde folgende Komponenten erfordern:

| Komponente | Beschreibung |
|------------|--------------|
| **Draggable Wrapper** | Ein Container mit `position: fixed` und Mouse/Touch-Events |
| **Position State** | Speichern von `{x, y}` Koordinaten (ggf. in LocalStorage) |
| **Boundary Constraints** | Grenzen setzen, damit Armstrong nicht aus dem Viewport verschwindet |
| **Grip Handle** | Ein sichtbarer "Anfasser" zum Ziehen (z.B. oben am Container) |

Falls gewünscht, kann ich dafür einen separaten Plan erstellen.
