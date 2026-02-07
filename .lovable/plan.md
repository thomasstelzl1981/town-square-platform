
# Problemanalyse: Armstrong verschwindet beim Minimieren

## Identifizierte Ursache

### Das Kernproblem: Falsche Button-Logik im Chat-Header

In `ArmstrongContainer.tsx` (Zeilen 122-133) gibt es den **Minimize-Button**:

```tsx
onClick={(e) => {
  e.stopPropagation();
  toggleArmstrongExpanded();  // ← Setzt armstrongExpanded = false
}}
```

Das ist **KORREKT** — dieser Button sollte `armstrongExpanded` von `true` auf `false` setzen.

### ABER: Das localStorage speichert `false` für `armstrongVisible`

Das Problem liegt im **localStorage**. Wenn der User in einer früheren Session Armstrong komplett geschlossen hat (X-Button), wurde:

```tsx
localStorage.setItem('sot-portal-armstrong-visible', 'false')
```

Dieser Wert bleibt erhalten und überschreibt den neuen Default `true`.

### Die Funktion `getStoredValue`:

```tsx
function getStoredValue(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;  // ← Nur wenn NICHTS gespeichert
  return stored === 'true';
}
```

**Ergebnis**: Wenn localStorage `'false'` enthält, wird `false` zurückgegeben — unabhängig vom neuen Default.

---

## Klick-Analyse: Was passiert wo?

### 1. Rocket-Button in SystemBar (Zeilen 174-188)

```tsx
onClick={() => {
  if (!armstrongVisible) {
    toggleArmstrong();         // ← Macht visible = true
  } else {
    toggleArmstrongExpanded(); // ← Togglet expanded
  }
}}
```

| Zustand vorher | Klick-Ergebnis |
|----------------|----------------|
| visible=false | visible=true, expanded=unchanged |
| visible=true, expanded=false | expanded=true (Planet → Chat) |
| visible=true, expanded=true | expanded=false (Chat → Planet) |

**Problem**: Der Rocket-Button macht Armstrong sichtbar, aber weil `visible` im localStorage auf `false` gespeichert ist, startet Armstrong unsichtbar.

### 2. Minimize-Button im Chat-Header (ArmstrongContainer Zeile 122-133)

```tsx
onClick={(e) => {
  e.stopPropagation();
  toggleArmstrongExpanded();
}}
```

**Aktion**: Setzt `armstrongExpanded` von `true` auf `false`.

**Erwartung**: Armstrong sollte als Planet erscheinen.

**Realität**: Armstrong erscheint als Planet — **ABER nur, wenn `armstrongVisible = true`**.

### 3. X-Button im Chat-Header (ArmstrongContainer Zeile 134-145)

```tsx
onClick={(e) => {
  e.stopPropagation();
  toggleArmstrong();
}}
```

**Aktion**: Setzt `armstrongVisible` von `true` auf `false`.

**Realität**: Armstrong verschwindet komplett. **Das ist gewollt!**

---

## Die eigentliche Fehlerquelle

Der User hat wahrscheinlich irgendwann den X-Button geklickt, was `armstrongVisible = false` im localStorage speicherte. Jetzt:

1. Beim Start wird `localStorage.getItem('sot-portal-armstrong-visible')` = `'false'` gelesen
2. `armstrongVisible` startet als `false`
3. `ArmstrongContainer` gibt `null` zurück (Zeile 86-88)
4. Kein Planet, kein Chat, nichts

---

## Lösung: LocalStorage bereinigen + Logik verdeutlichen

### Änderung 1: LocalStorage-Reset bei Besuch (einmalig)

Um das Problem für bestehende User zu beheben, müssen wir den alten localStorage-Wert einmalig löschen.

**Datei:** `src/hooks/usePortalLayout.tsx`

```tsx
// VOR der useState-Initialisierung:
if (typeof window !== 'undefined') {
  // Einmaliger Reset: Alte "hidden" Werte entfernen (v2.0 Migration)
  const migrationKey = 'sot-armstrong-migrated-v2';
  if (!localStorage.getItem(migrationKey)) {
    localStorage.removeItem(ARMSTRONG_KEY);
    localStorage.removeItem(ARMSTRONG_EXPANDED_KEY);
    localStorage.setItem(migrationKey, 'true');
  }
}
```

### Änderung 2: Konzept-Klarstellung mit separaten Buttons

Die aktuelle Verwirrung entsteht, weil der Rocket-Button zwei verschiedene Dinge macht. Klares Konzept:

| Button | Ort | Funktion |
|--------|-----|----------|
| Rocket (SystemBar) | Immer sichtbar | `armstrongVisible` togglen |
| Minimize (Chat-Header) | Nur im Chat | `armstrongExpanded = false` (→ Planet) |
| X (Chat-Header) | Nur im Chat | `armstrongVisible = false` (→ Unsichtbar) |
| Klick auf Planet | Collapsed State | `armstrongExpanded = true` (→ Chat) |

### Änderung 3: SystemBar Rocket-Button vereinfachen

Statt der komplexen if/else Logik, sollte der Rocket-Button **NUR** die Sichtbarkeit togglen:

```tsx
onClick={toggleArmstrong}
title={armstrongVisible ? 'Armstrong ausblenden' : 'Armstrong einblenden'}
```

Das ist intuitiver: Rocket = Ein/Aus Schalter für Armstrong.

### Änderung 4: Optional — Minimize-Button auch im Planet-State? Nein.

Im Planet-State gibt es keinen Minimize-Button — man klickt einfach auf den Planeten, um zu expandieren.

---

## Zusammenfassung der Änderungen

| Datei | Zeilen | Änderung |
|-------|--------|----------|
| `usePortalLayout.tsx` | 74-76 | Einmalige Migration: localStorage bereinigen |
| `SystemBar.tsx` | 177-183 | Rocket-Button: Nur `toggleArmstrong()` statt if/else |

### Erwartetes Verhalten nach Fix

1. **Erstbesuch/Nach Migration**: Armstrong als Planet sichtbar
2. **Klick auf Planet**: Expandiert zu Chat
3. **Klick auf Minimize (Chat)**: Zurück zum Planeten
4. **Klick auf X (Chat)**: Armstrong verschwindet
5. **Klick auf Rocket (SystemBar)**: Macht Armstrong wieder sichtbar (als Planet)
6. **Page Reload**: Zustand aus localStorage, aber Sichtbarkeit startet jetzt bei true

---

## Technische Details

### Neue Migration-Logik (`usePortalLayout.tsx`)

```typescript
// Zeile 74, vor der Provider-Komponente
const MIGRATION_KEY = 'sot-armstrong-migrated-v2';

export function PortalLayoutProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  // === MIGRATION: Reset alter unsichtbar-Werte ===
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem(MIGRATION_KEY)) {
        localStorage.removeItem(ARMSTRONG_KEY);
        localStorage.removeItem(ARMSTRONG_EXPANDED_KEY);
        localStorage.setItem(MIGRATION_KEY, 'true');
        // Force re-render mit neuen Defaults
        window.location.reload();
      }
    }
  }, []);
  
  // ... rest of the provider
}
```

### Vereinfachte SystemBar-Logik

```tsx
// Zeile 174-188 in SystemBar.tsx
{!isMobile && (
  <Button
    variant={armstrongVisible ? 'secondary' : 'ghost'}
    size="icon"
    onClick={toggleArmstrong}
    className="h-9 w-9"
    title={armstrongVisible ? 'Armstrong ausblenden' : 'Armstrong einblenden'}
  >
    <Rocket className="h-5 w-5" />
  </Button>
)}
```

---

## Visuelles Konzept (verdeutlicht)

```text
┌─────────────────────────────────────────────────────────────────┐
│ SystemBar                                                       │
│                                                         🚀 👤   │
│                                       ↑                         │
│                           Rocket = SICHTBARKEIT togglen         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐       ┌───────────────────────────┐
│  Armstrong (Planet)         │ ───▶  │  Armstrong (Chat)         │
│                             │ Klick │  ┌─────────────────────┐  │
│      ●                      │       │  │ 🌍  Armstrong  ⤡  ✕ │  │
│   (60px Sphere)             │       │  ├─────────────────────┤  │
│   "Armstrong"               │       │  │                     │  │
│                             │       │  │  Chat-Inhalt        │  │
└─────────────────────────────┘       │  │                     │  │
      ▲                               │  │                     │  │
      │                               └───────────────────────────┘
      │  ⤡ (Minimize)                          │
      └────────────────────────────────────────┘

      ✕ (X-Button) = komplett ausblenden → nur via 🚀 wieder einblendbar
```

---

## Zusammenfassung

| Problem | Lösung |
|---------|--------|
| localStorage enthält `visible=false` | Einmalige Migration löscht alte Werte |
| Rocket-Button hat verwirrende Doppelfunktion | Vereinfacht auf nur `toggleArmstrong()` |
| Default war unklar | Default ist jetzt konsistent `visible=true, expanded=false` (= Planet) |
