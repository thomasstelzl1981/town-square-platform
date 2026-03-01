

## Vermietereinheit bearbeiten + Plus-Button statt Kachel

### Freeze-Check
MOD-04: **unfrozen** — OK

### Aenderungen in `src/pages/portal/immobilien/PortfolioTab.tsx`

**1. Neuen State fuer Edit-Modus:**
```typescript
const [editContext, setEditContext] = useState<LandlordContext | null>(null);
```

**2. Edit-Button auf jedem Vermietereinheit-Widget (neben "Zuordnen"):**
Ein kleiner Bearbeiten-Button (Pencil-Icon) im Footer jedes Context-Widgets. Klick oeffnet `CreateContextDialog` mit `editContext={ctx}`.

**3. "Neue Vermietereinheit"-Kachel entfernen (Zeilen 904-923):**
Das gesamte `<DesktopOnly><WidgetCell>` mit dem Plus-Icon und "Neue Vermietereinheit" wird geloescht.

**4. Plus-Button in der Ueberschrift-Zeile:**
Vor der WidgetGrid (Zeile 753-755) einen Header mit Plus-Button einfuegen:
```
Vermietereinheiten                    [+]
```
Der Plus-Button oeffnet `setShowCreateContextDialog(true)`.

**5. CreateContextDialog mit editContext verbinden:**
```tsx
<CreateContextDialog 
  open={showCreateContextDialog || !!editContext} 
  onOpenChange={(open) => { 
    if (!open) { setShowCreateContextDialog(false); setEditContext(null); }
  }}
  editContext={editContext}
/>
```

### Keine Backend-Aenderung noetig
`CreateContextDialog` unterstuetzt bereits den `editContext`-Prop mit Update-Logik.

