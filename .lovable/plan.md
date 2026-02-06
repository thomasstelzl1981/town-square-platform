
# Fix-Plan: MOD-09 Vertriebspartner — Kritische Fehler

## Fehleranalyse

### Screenshot-Befund
Die Seite `/portal/vertriebspartner/beratung` crasht mit dem Fehler:
> **"A <Select.Item /> must have a value prop that is not an empty string."**

### Ursache
Radix UI `@radix-ui/react-select` reserviert den leeren String (`""`) intern, um die Auswahl zu löschen und den Placeholder anzuzeigen. Wenn ein `<SelectItem value="">` gerendert wird, wirft die Komponente einen Fehler.

---

## Gefundene Fehler

| Priorität | Datei | Zeile | Problem |
|-----------|-------|-------|---------|
| **P0** | `BeratungTab.tsx` | 209 | `<SelectItem value="">` für Empty State |
| **P0** | `BeratungTab.tsx` | 253 | `<SelectItem value="">` für Empty State |
| **P1** | `KatalogTab.tsx` | 390 | `<SelectItem value="">` für "Alle Städte" |

---

## Lösung

### Korrektur-Pattern

**Falsch (crasht):**
```tsx
{items.length === 0 ? (
  <SelectItem value="" disabled>Keine Einträge</SelectItem>
) : (
  items.map(...)
)}
```

**Richtig (funktioniert):**
```tsx
{items.length === 0 ? (
  <SelectItem value="__empty__" disabled>Keine Einträge</SelectItem>
) : (
  items.map(...)
)}
```

Oder alternativ: Empty-State außerhalb des Select rendern:
```tsx
{items.length === 0 ? (
  <p className="p-2 text-sm text-muted-foreground">Keine Einträge</p>
) : (
  items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)
)}
```

---

## Zu ändernde Dateien

### 1. `src/pages/portal/vertriebspartner/BeratungTab.tsx`

**Zeile 207-211:** Objekt-Dropdown Empty State
```tsx
// VORHER:
{selectedListings.length === 0 ? (
  <SelectItem value="" disabled>
    Keine Objekte vorgemerkt
  </SelectItem>
) : (...)}

// NACHHER:
{selectedListings.length === 0 ? (
  <SelectItem value="__no_objects__" disabled>
    Keine Objekte vorgemerkt
  </SelectItem>
) : (...)}
```

**Zeile 251-255:** Kunden-Dropdown Empty State
```tsx
// VORHER:
{customers.length === 0 ? (
  <SelectItem value="" disabled>
    Keine Kunden vorhanden
  </SelectItem>
) : (...)}

// NACHHER:
{customers.length === 0 ? (
  <SelectItem value="__no_customers__" disabled>
    Keine Kunden vorhanden
  </SelectItem>
) : (...)}
```

### 2. `src/pages/portal/vertriebspartner/KatalogTab.tsx`

**Zeile 390:** Stadt-Filter "Alle Städte"
```tsx
// VORHER:
<SelectItem value="">Alle Städte</SelectItem>

// NACHHER:
<SelectItem value="__all__">Alle Städte</SelectItem>
```

**Zusätzlich Zeile 385:** Filter-Logik anpassen
```tsx
// VORHER:
<Select value={cityFilter} onValueChange={setCityFilter}>

// NACHHER:
<Select 
  value={cityFilter || "__all__"} 
  onValueChange={(v) => setCityFilter(v === "__all__" ? "" : v)}
>
```

---

## Testprotokoll nach Fix

| Test | Route | Erwartetes Ergebnis |
|------|-------|---------------------|
| 1 | `/portal/vertriebspartner/beratung` | Seite lädt ohne Fehler |
| 2 | Objekt-Dropdown öffnen (leer) | Zeigt "Keine Objekte vorgemerkt" (disabled) |
| 3 | Kunden-Dropdown öffnen (leer) | Zeigt "Keine Kunden vorhanden" (disabled) |
| 4 | `/portal/vertriebspartner/objektauswahl` | Filter-Dropdown funktioniert |
| 5 | Stadt-Filter "Alle Städte" | Setzt Filter zurück, zeigt alle |

---

## Zusammenfassung

- **3 Fehler** in 2 Dateien identifiziert
- **Root Cause:** `value=""` ist bei Radix UI Select nicht erlaubt
- **Fix:** Dummy-Werte wie `__no_objects__`, `__all__` verwenden
- **Aufwand:** Klein (~15 Minuten)
