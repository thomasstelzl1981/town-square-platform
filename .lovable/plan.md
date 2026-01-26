

# Korrektur: Zurück zum originalen CI + Armstrong-Stripe optimieren

## Übersicht der Änderungen

| Änderung | Aktion |
|----------|--------|
| CI zurücksetzen | `--surface` wieder dunkel machen, `bg-surface` entfernen |
| Stripe-Breite | Bleibt bei 190px (aktueller Wert ist gut) |
| Schnellaktionen | Komplett entfernen |
| Name | "AI Assistant" → "Armstrong" |
| Upload-Zone | Kleiner und cleaner, nur "Upload" |

---

## Datei 1: src/index.css

### Änderungen:
- Zeile 138-139: `--surface` und `--surface-2` zurück auf dunkle Werte setzen

```css
/* VORHER (Pergament): */
--surface: 40 20% 94%;
--surface-2: 40 15% 92%;

/* NACHHER (Original dunkel): */
--surface: 222 30% 10%;
--surface-2: 222 35% 8%;
```

---

## Datei 2: src/components/portal/PortalLayout.tsx

### Änderungen:
- Zeile 62: `bg-surface` entfernen → zurück zu `bg-background`
- Zeile 79-82: `quickActions` komplett entfernen (leeres Array)
- Zeile 109-111: `quickActions` auch im Mobile-Drawer entfernen

```tsx
// VORHER:
<div className="min-h-screen bg-surface">

// NACHHER:
<div className="min-h-screen bg-background">
```

```tsx
// VORHER:
quickActions={[
  { label: 'Hilfe', action: 'help' },
  { label: 'Dokument analysieren', action: 'analyze' },
]}

// NACHHER:
// komplett entfernen (keine quickActions prop mehr übergeben)
```

---

## Datei 3: src/components/chat/ChatPanel.tsx

### Änderung 1: Name ändern (Zeile 123)
```tsx
// VORHER:
<h3 className="text-sm font-semibold">AI Assistant</h3>

// NACHHER:
<h3 className="text-sm font-semibold">Armstrong</h3>
```

### Änderung 2: Schnellaktionen komplett entfernen (Zeilen 158-178)
Der gesamte Block wird gelöscht:
```tsx
// LÖSCHEN:
{quickActions.length > 0 && (
  <div className="px-4 py-3 border-b space-y-2">
    <p className="text-xs font-medium text-muted-foreground">Schnellaktionen</p>
    ...
  </div>
)}
```

### Änderung 3: Upload-Zone minimieren (Zeilen 229-256)
Die große FileUploader-Box wird durch eine kompakte einzeilige Version ersetzt:

```tsx
// VORHER (groß mit Label und Hint):
<FileUploader
  onFilesSelected={handleFilesSelected}
  accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
  multiple
  label="📎 Dokumente ablegen"
  hint="PDF, Excel, Bilder für Analyse"
  className="text-xs"
/>

// NACHHER (kompakt, nur Icon + "Upload"):
<FileUploader
  onFilesSelected={handleFilesSelected}
  accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
  multiple
  className="text-xs"
>
  <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1">
    <Upload className="h-3.5 w-3.5" />
    <span>Upload</span>
  </div>
</FileUploader>
```

---

## Ergebnis

Nach den Änderungen:
- **Dunkler Hintergrund** überall wie ursprünglich
- **Armstrong** als Name des Assistenten
- **Keine Schnellaktionen** mehr
- **Minimale Upload-Zone** – nur "Upload" mit Icon
- **Stripe-Breite** bleibt bei 190px

