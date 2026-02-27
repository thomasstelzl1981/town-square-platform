

# Quick-Links für Otto² Advisory und Ncore auf dem Admin Dashboard

## Änderung: `src/pages/admin/Dashboard.tsx`

In der "Zone 3 – Websites" Schnellzugriff-Sektion (Zeile 260-268) werden zwei neue Buttons nach dem Acquiary-Button eingefügt:

1. **Otto² Advisory** → Route `/website/otto-advisory`
2. **Ncore** → Route `/website/ncore`

Beide erhalten das gleiche `variant="outline"` Styling wie die bestehenden 5 Buttons und verwenden das `ExternalLink`-Icon.

Keine weiteren Dateien betroffen.

