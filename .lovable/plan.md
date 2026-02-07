
# Korrekturplan: Armstrong Planet beim Start sichtbar + Minimieren funktioniert

## Diagnose

### Identifizierte Probleme

| Problem | Ursache | Ort |
|---------|---------|-----|
| Armstrong unsichtbar beim Start | `armstrongVisible` default = `false` | `usePortalLayout.tsx:89-91` |
| Planet-Design nicht sichtbar | Armstrong rendert `null` wenn nicht visible | `ArmstrongContainer.tsx:86-88` |
| Minimieren zeigt nichts | Nach Minimize ist `armstrongExpanded = false`, aber Render-Logik ist korrekt |

### Kern-Problem
Die Logik unterscheidet zwischen:
1. **`armstrongVisible`**: Ob Armstrong überhaupt gerendert wird (true/false)
2. **`armstrongExpanded`**: Ob Armstrong als Planet (collapsed) oder Chat (expanded) gezeigt wird

**Aktueller Default:**
- `armstrongVisible` = `false` → Armstrong wird GAR NICHT gerendert
- `armstrongExpanded` = `false` → Wenn sichtbar, als Planet

**Gewünschter Default:**
- `armstrongVisible` = `true` → Armstrong wird gerendert
- `armstrongExpanded` = `false` → Startet als Planet

---

## Lösung

### Änderung 1: Default für Sichtbarkeit auf `true` setzen

**Datei:** `src/hooks/usePortalLayout.tsx`

Zeile 89-91 ändern:

```tsx
// AKTUELL:
const [armstrongVisible, setArmstrongVisibleState] = useState(() => {
  return getStoredValue(ARMSTRONG_KEY, false);
});

// NEU:
const [armstrongVisible, setArmstrongVisibleState] = useState(() => {
  return getStoredValue(ARMSTRONG_KEY, true); // ← Default: SICHTBAR als Planet
});
```

### Änderung 2: Expanded Default bleibt `false` (Planet-Modus)

Der expanded State ist bereits korrekt:
```tsx
const [armstrongExpanded, setArmstrongExpandedState] = useState(() => {
  return getStoredValue(ARMSTRONG_EXPANDED_KEY, false); // ← Startet als Planet (collapsed)
});
```

### Änderung 3: Sicherstellen, dass Collapse korrekt funktioniert

In `ArmstrongContainer.tsx` ist die Logik bereits korrekt:
- Zeile 91: `if (armstrongExpanded)` → zeigt Chat-Panel
- Zeile 161: `else` → zeigt Planet-Sphere

**ABER**: Der Click-Handler in Zeile 173-177 prüft `!isDragging` — das ist korrekt.

---

## Technische Details

### Änderung in `usePortalLayout.tsx`

**Zeile 90:**
```tsx
// Vorher
return getStoredValue(ARMSTRONG_KEY, false);

// Nachher
return getStoredValue(ARMSTRONG_KEY, true);
```

### Verhalten nach dem Fix

| Szenario | Ergebnis |
|----------|----------|
| Erstbesuch (kein localStorage) | Armstrong als Planet sichtbar |
| User schließt Armstrong (X-Button) | `armstrongVisible = false`, Armstrong verschwindet |
| User öffnet via SystemBar | `armstrongVisible = true`, zeigt Planet |
| Klick auf Planet | `armstrongExpanded = true`, zeigt Chat |
| Klick auf Minimize im Chat | `armstrongExpanded = false`, zeigt Planet |
| Page Reload | Zustand aus localStorage wiederhergestellt |

---

## Zusammenfassung

| Datei | Zeile | Änderung |
|-------|-------|----------|
| `src/hooks/usePortalLayout.tsx` | 90 | `false` → `true` (Default für `armstrongVisible`) |

### Eine einzige Zeile Änderung!

Das Planet-Design ist bereits vollständig implementiert und funktioniert. Das einzige Problem war, dass `armstrongVisible` standardmäßig auf `false` gesetzt war, wodurch Armstrong beim Start nicht gerendert wurde.

---

## Erwartetes Ergebnis nach dem Fix

### Desktop
1. **Beim Start**: Armstrong erscheint als **Planet-Sphere** (60px, draggable)
2. **Klick auf Planet**: Expandiert zum Chat-Panel (320px)
3. **Klick auf Minimize**: Zurück zum Planet
4. **Klick auf X**: Schließt Armstrong komplett (via SystemBar wieder öffnbar)

### Visuelle Bestätigung
- Light Mode: Cyan-blaue Planet-Atmosphäre mit 3D-Tiefe
- Dark Mode: Violett-blaue Nebel-Planet mit Weltraum-Glow
- Beide: `MessageCircle` Icon in der Mitte, "Armstrong" Label darunter
