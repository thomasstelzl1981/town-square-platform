

## Armstrong Mobile UX — Input Bar + Bottom-Sheet fuer alle 3 Websites

### Ist-Zustand

| Website | Armstrong Komponente | Mobile UX | Knowledge/Edge Fn |
|---------|---------------------|-----------|-------------------|
| **Kaufy** | `KaufyArmstrongWidget` | Riesiger Orb (128px) + 85vh Sheet | sot-armstrong-advisor, website="kaufy", Streaming, Voice, Quick Replies |
| **SoT** | `ArmstrongWidget` (generisch) | Kleine Bubble "Fragen?" + 350x450px Fenster | sot-armstrong-advisor, website="sot", Kein Streaming, kein Voice |
| **FutureRoom** | `ArmstrongWidget` (generisch) | Kleine Bubble "Fragen?" + 350x450px Fenster | sot-armstrong-advisor, website="futureroom", Kein Streaming, kein Voice |

Alle drei nutzen denselben Edge Function `sot-armstrong-advisor` mit brand-spezifischem Kontext und Knowledge Base — das funktioniert korrekt.

### Problem auf Mobile

1. **Kaufy**: Der 128px Orb verdeckt Inhalte. Eine `KaufyInputBar` existiert bereits (`src/components/zone3/kaufy/KaufyInputBar.tsx`), wird aber nirgends eingebunden
2. **SoT/FutureRoom**: Die generische `ArmstrongWidget`-Bubble oeffnet ein kleines 350x450px Fenster fixed bottom-right — kein Bottom-Sheet, schlecht bedienbar auf Mobile
3. Kein Swipe-to-Close, kein nativer Mobile-Flow

### Loesung: Einheitliches Mobile-Pattern

**Auf Mobile (< 768px):**
- Floating Orb/Bubble wird durch eine **fixierte Input-Bar am unteren Bildschirmrand** ersetzt (wie Zone 2 `ArmstrongInputBar`)
- Tap auf die Bar oeffnet ein **50vh Bottom-Sheet** mit dem Chat
- Swipe-down oder X schliesst das Sheet
- Auf Desktop bleibt alles wie bisher (Orb bei Kaufy, Bubble bei SoT/FutureRoom)

### Aenderungen

#### 1. `KaufyArmstrongWidget.tsx` — Orb durch InputBar auf Mobile ersetzen

- Import `KaufyInputBar` (existiert bereits)
- Im Orb-Mode: wenn `isMobile`, statt des grossen Orbs die `KaufyInputBar` rendern
- Click auf InputBar setzt `mode = 'expanded'`
- Expanded Mode auf Mobile bleibt 85vh Bottom-Sheet (schon implementiert)
- Ergebnis: Orb nur noch Desktop, InputBar auf Mobile

#### 2. `ArmstrongWidget.tsx` — Generische Komponente mobile-tauglich machen

Groessere Aenderung noetig, da die generische Komponente kein Mobile-Konzept hat:

- Import `useIsMobile` Hook
- **Mobile Orb-State**: Statt der kleinen "Fragen?"-Bubble eine fixierte Input-Bar am unteren Rand anzeigen (analog zu `ArmstrongInputBar` Pattern)
- **Mobile Expanded-State**: Statt dem 350x450px Fenster ein Bottom-Sheet (Vaul `<Drawer>` oder manuelles 50vh Panel) mit dem Chat rendern
- Desktop bleibt unveraendert (Bubble + Floating Panel)
- Swipe-down zum Schliessen (wenn Sheet/Drawer verwendet)

#### 3. `KaufyInputBar.tsx` — Kleine Anpassung

- Die Komponente existiert und ist gut. Evtl. `safe-area-inset-bottom` pruefen (ist schon drin)
- Keine grosse Aenderung noetig

### Technische Details

```text
Mobile Flow (alle 3 Websites):

[Seite laden]
    |
    v
[Input-Bar fixiert am unteren Rand]
  "Frag Armstrong..." | Arrow-Icon
    |
    v (Tap)
[Bottom-Sheet 50vh oeffnet sich]
  - Chat-Header mit Brand-Name
  - Nachrichten-Bereich
  - Quick Actions (wenn leer)
  - Input-Feld + Send-Button
    |
    v (Swipe down / X)
[Zurueck zur Input-Bar]
```

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/zone3/kaufy2026/KaufyArmstrongWidget.tsx` | Mobile: Orb durch KaufyInputBar ersetzen |
| `src/components/zone3/ArmstrongWidget.tsx` | Mobile: Bubble durch InputBar + Bottom-Sheet ersetzen |

Beide Dateien liegen ausserhalb der Modul-Pfade — keine Freeze-Pruefung noetig.

### Was NICHT geaendert wird

- Desktop-Verhalten bleibt identisch
- Edge Function / Knowledge Base / Streaming-Logik bleibt unveraendert
- Die drei Layouts (`SotLayout`, `FutureRoomLayout`, `Kaufy2026Layout`) bleiben unveraendert — die Widgets regeln das intern
