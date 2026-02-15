

# Mobile SystemBar und Chat-Anpassungen

## Aenderungen (nur Mobile)

### 1. SystemBar (`src/components/portal/SystemBar.tsx`)

- **Temperatur-Button ausblenden** auf Mobile: Der Button mit der Temperaturanzeige (Zeile 147-152) wird mit einer `{!isMobile && ...}` Bedingung umschlossen, sodass er nur auf Desktop sichtbar bleibt.
- **Headline aendern**: Der zentrale Text "SYSTEM OF A TOWN" (Zeile 156-161) wird auf Mobile durch "ARMSTRONG" ersetzt. Auf Desktop bleibt "SYSTEM OF A TOWN" bestehen.

### 2. MobileHomeChatView (`src/components/portal/MobileHomeChatView.tsx`)

- **Armstrong-Planet-Icon und Text entfernen**: Der leere Zustand (Zeilen 111-119) mit dem blauen Planet-Icon, "Armstrong"-Titel und "Wie kann ich Ihnen helfen?" wird vereinfacht — das Planet-Icon und der "Armstrong"-Text werden entfernt. Nur der Hilfetext bleibt als dezenter Platzhalter.

## Keine neuen Dateien, keine DB-Aenderungen

Reine bedingte Anpassungen in zwei bestehenden Dateien.
