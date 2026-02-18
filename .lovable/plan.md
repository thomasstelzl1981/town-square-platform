

## Mobile Startseite vereinfachen

### Was sich aendert

Basierend auf dem Screenshot und deinem Feedback werden zwei Bereiche bereinigt:

### 1. "Module | Chat" Toggle entfernen (MobileBottomBar)

Der Toggle-Switch zwischen "Module" und "Chat" unten wird komplett entfernt. Die Chat-Eingabezeile bleibt bestehen -- wenn man tippt und absendet, oeffnet sich der Chat automatisch. Zurueck geht es per Swipe (bereits implementiert).

**Auswirkung:** Die Props `mobileHomeMode` und `onModeChange` werden aus der MobileBottomBar entfernt. Der zugehoerige State in der uebergeordneten Komponente (PortalLayout / MobileDashboard) wird ebenfalls bereinigt.

### 2. Begruessung entfernen (MobileHomeModuleList)

Der Bereich mit "Willkommen" und "Was moechtest du heute erledigen?" wird entfernt. Die Modul-Liste startet direkt oben mit den Eintraegen, mit etwas Abstand zur SystemBar.

### Skizze der neuen mobilen Startseite

```text
+-----------------------------+
|  [<] ARMSTRONG         [MM] |  <-- SystemBar (kompakt, h-10)
+-----------------------------+
|                             |
|  [icon] Finanzen          > |
|  [icon] Immobilien        > |
|  [icon] Kontakte          > |
|  [icon] Dokumente         > |
|  [icon] Posteingang       > |
|  [icon] Sparen            > |
|  [icon] Versicherungen    > |
|  [icon] Fahrzeuge         > |
|  [icon] Haustiere         > |
|                             |
+-----------------------------+
| [mic] [+] Nachricht... [>] |  <-- Nur Eingabezeile, kein Toggle
+-----------------------------+
```

### Technische Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/MobileBottomBar.tsx` | Module/Chat Toggle-Block (Zeilen 117-145) komplett entfernen. Props `mobileHomeMode` und `onModeChange` aus Interface und Destrukturierung entfernen. |
| `src/components/portal/MobileHomeModuleList.tsx` | Greeting-Block (Zeilen 53-59) entfernen. Top-Padding der Modul-Liste anpassen (`pt-3` statt kein Padding). |
| Eltern-Komponente (PortalLayout o.ae.) | `mobileHomeMode`-State und zugehoerige Props-Weitergabe bereinigen, falls der Chat-Modus-Wechsel dort gesteuert wird. |

