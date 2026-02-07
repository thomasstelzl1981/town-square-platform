
# Löschung des doppelten "Neue Immobilie anlegen" Buttons

## Problem identifiziert

Auf der Seite `/portal/immobilien/portfolio` gibt es **zwei Möglichkeiten**, eine neue Immobilie anzulegen:

| Position | Code (Zeilen) | Text | Sichtbar |
|----------|---------------|------|----------|
| **Header rechts oben** | 644-648 | "Neue Immobilie anlegen" | ✅ Immer |
| **Tabellen-Toolbar** | 895-900 | "Neu" | ✅ Immer |
| **Empty-State** | 890-894 | "Erste Immobilie anlegen" | Nur wenn leer |

Der Button im Header (Zeilen 644-648) ist **redundant** und wird entfernt.

---

## Exakte Code-Stelle

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

**Zeilen 602-648 (aktuell):**
```tsx
return (
  <div className="space-y-6">
    {/* Header with Context Dropdown + New Property Button */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Immobilienportfolio</h2>
        {contexts.length > 0 && (
          <DropdownMenu>
            {/* ... Context Dropdown ... */}
          </DropdownMenu>
        )}
      </div>
      {/* ❌ DIESER BUTTON WIRD ENTFERNT: */}
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Neue Immobilie anlegen
      </Button>
    </div>
```

---

## Geplante Änderung

Der `<Button>` in Zeilen 644-647 wird komplett entfernt. Der Header wird dadurch nur noch den Titel und das Context-Dropdown enthalten:

**Zeilen 602-648 (nachher):**
```tsx
return (
  <div className="space-y-6">
    {/* Header with Context Dropdown */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Immobilienportfolio</h2>
        {contexts.length > 0 && (
          <DropdownMenu>
            {/* ... Context Dropdown bleibt ... */}
          </DropdownMenu>
        )}
      </div>
      {/* Button entfernt — existiert bereits in PropertyTable.headerActions */}
    </div>
```

---

## Was bleibt erhalten

Der **"Neu" Button in der PropertyTable** (Zeilen 895-900) bleibt bestehen:
```tsx
headerActions={
  <Button onClick={() => navigate('/portal/immobilien/neu')}>
    <Plus className="mr-2 h-4 w-4" />
    Neu
  </Button>
}
```

Dieser Button ist ausreichend und befindet sich direkt bei der Tabelle, wo der Benutzer ihn benötigt.

---

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/pages/portal/immobilien/PortfolioTab.tsx` | Zeilen 644-647 entfernen (4 Zeilen) |

---

## Visuelle Vorschau

**Vorher:**
```
┌────────────────────────────────────────────────────────────┐
│ Immobilienportfolio  [Alle Vermietereinheiten ▼]  [+ Neue Immobilie anlegen] │  ← Wird entfernt
├────────────────────────────────────────────────────────────┤
│ [KPI Cards...]                                             │
├────────────────────────────────────────────────────────────┤
│ [Charts...]                                                │
├────────────────────────────────────────────────────────────┤
│ Portfolio-Tabelle                                [+ Neu]   │  ← Bleibt
└────────────────────────────────────────────────────────────┘
```

**Nachher:**
```
┌────────────────────────────────────────────────────────────┐
│ Immobilienportfolio  [Alle Vermietereinheiten ▼]           │  ← Cleaner
├────────────────────────────────────────────────────────────┤
│ [KPI Cards...]                                             │
├────────────────────────────────────────────────────────────┤
│ [Charts...]                                                │
├────────────────────────────────────────────────────────────┤
│ Portfolio-Tabelle                                [+ Neu]   │  ← Einziger Button
└────────────────────────────────────────────────────────────┘
```

---

## Testplan

1. Seite `/portal/immobilien/portfolio` öffnen
2. Prüfen: Kein "Neue Immobilie anlegen" Button mehr unter der Überschrift
3. Prüfen: "Neu" Button in der Tabellen-Toolbar funktioniert weiterhin
4. Prüfen: Bei leerem Portfolio erscheint "Erste Immobilie anlegen" Link
