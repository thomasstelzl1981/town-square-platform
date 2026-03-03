

## Anpassung: Dialog shadow + border-radius

`shadow-elevated` existiert bereits in der Tailwind-Config. Zwei Dateien werden angepasst:

### 1. `src/components/ui/dialog.tsx`
- **DialogOverlay**: Klasse bleibt (bereits korrekt mit `--overlay-scrim`)
- **DialogContent**: `shadow-2xl` → `shadow-elevated`, `rounded-2xl` → `sm:rounded-lg`

### 2. `src/components/ui/popover.tsx`
- **PopoverContent**: `shadow-md` → `shadow-elevated`

Keine weiteren Dateien betroffen.

