

## Versicherungs-Einträge aus AddWidgetMenu entfernen

MOD-20 wird per User-Anweisung entfroren. Änderung ist minimal und klar abgegrenzt.

### Änderungen (2 Dateien)

| Datei | Aktion |
|-------|--------|
| `spec/current/00_frozen/modules_freeze.json` | MOD-20 `frozen: false` setzen |
| `src/pages/portal/miety/widgets/AddWidgetMenu.tsx` | Den gesamten "Versicherung"-Block entfernen (Zeilen 56-65: `DropdownMenuSeparator`, `DropdownMenuLabel "Versicherung"`, `Hausratversicherung`-Item, `Haftpflichtversicherung`-Item) |

### Was entfernt wird (AddWidgetMenu.tsx)
```text
<DropdownMenuSeparator />
<DropdownMenuLabel>Versicherung</DropdownMenuLabel>
<DropdownMenuItem onClick={() => onAddContract('hausrat')}>
  <Shield .../>Hausratversicherung
</DropdownMenuItem>
<DropdownMenuItem onClick={() => onAddContract('haftpflicht')}>
  <Shield .../>Haftpflichtversicherung
</DropdownMenuItem>
```

Der `Shield`-Import kann ebenfalls entfernt werden, sofern er nirgends sonst genutzt wird. Die `onAddContract`-Prop bleibt erhalten (wird weiterhin für Versorgungsverträge genutzt).

