

# Mobile UI/UX Redesign — "Immo-Wallet" Experience

## Vision

Die mobile Zone 2 wird von einer Desktop-Verkleinerung zu einer eigenstaendigen App-Erfahrung umgebaut. Der Startbildschirm wird ein ganzseitiger Armstrong-Chat (wie ChatGPT Mobile / Lovable Mobile), mit den 5 Area-Buttons direkt ueber der Eingabeleiste. Alle Module bleiben erreichbar, aber die Darstellung wird fuer Mobile radikal reduziert.

---

## Ist-Zustand (Probleme)

| Problem | Ort | Impact |
|---------|-----|--------|
| Dashboard zeigt Widget-Grid mit Globe, Wetter, Drag-and-Drop auf Mobile | `PortalDashboard.tsx` | Ueberladener Startbildschirm, kein App-Feeling |
| MobileBottomNav schwebt mit 5 grossen Kreisen + ArmstrongInputBar darunter = 2 fixierte Leisten | `PortalLayout.tsx` Z.138-142 | Viel Platz verschwendet, doppelte Navigation |
| Armstrong-Chat ist ein Bottom-Sheet (80vh), nicht ganzseitig | `ArmstrongSheet.tsx` | Chat-Erfahrung fragmentiert |
| Tabellen/Charts werden 1:1 vom Desktop uebernommen | Diverse Module | Horizontaler Overflow, schlecht lesbar |
| Kein Voice-Button in der Haupteingabe | `ArmstrongInputBar.tsx` | ElevenLabs-Feature nicht mobil nutzbar |
| `pb-28` padding im Content-Bereich fuer die beiden Bottom-Bars | `PortalLayout.tsx` Z.124 | Viel toter Raum |

---

## Soll-Zustand

### Startbildschirm (Dashboard / Home)

```text
+------------------------------------------+
|  SystemBar (48px, wie bisher)            |
+------------------------------------------+
|                                          |
|     Ganzseitiger Armstrong Chat          |
|     (rahmenlos, kein Header,             |
|      Messages fliessen von oben          |
|      nach unten, wie ChatGPT)            |
|                                          |
|     "Wie kann ich Ihnen helfen?"         |
|     (Wenn leer: Armstrong-Logo +         |
|      Begruessung)                        |
|                                          |
+------------------------------------------+
|  [Base] [Miss] [Ops] [Serv] [Home]      |
|  (5 Glass-Buttons, horizontal)           |
+------------------------------------------+
|  [Mic] [  Nachricht eingeben...  ] [->]  |
|  (Input-Bar mit Voice + Send)            |
+------------------------------------------+
```

**Kernprinzip:** Kein Widget-Grid, keine Kacheln, kein Globe, kein Wetter auf dem Startbildschirm. Stattdessen: Armstrong als primaere Interaktionsflaeche.

### Modul-Ansichten (wenn Area-Button gedrueckt)

Die Area-Buttons navigieren wie bisher zu `/portal/area/:key`, aber die Module werden mobil-optimiert angezeigt:
- Tabellen werden durch Card-Stacks ersetzt (bereits teilweise via `MobileCardView`)
- Charts werden auf einfache KPI-Zahlen reduziert oder auf eine kompakte Inline-Darstellung
- Zurueck-Button fuehrt immer zum Chat-Home

---

## Technischer Umsetzungsplan

### Schritt 1: Neues Mobile-Home — `MobileHomeChatView`

Neue Komponente `src/components/portal/MobileHomeChatView.tsx`:
- Nutzt den existierenden `useArmstrongAdvisor` Hook
- Nutzt den existierenden `useArmstrongVoice` Hook
- Rendert Messages via `MessageRenderer` (wie `ChatPanel`)
- Rahmenloser Vollbild-Chat: `flex-1 overflow-y-auto` fuer den Nachrichten-Bereich
- Input-Bar unten: `[VoiceButton] [Input] [SendButton]`
- 5 Glass-Buttons als horizontale Leiste direkt UEBER der Input-Bar

### Schritt 2: `PortalLayout.tsx` — Mobile Branch umbauen

Aktuell (Z.116-150):
```
SystemBar
main (Outlet) + pb-28
MobileBottomNav (schwebende Kreise)
ArmstrongInputBar (ganz unten)
ArmstrongSheet (Bottom-Sheet)
```

Neu:
```
SystemBar
if (isDashboard):
  MobileHomeChatView (ganzseitig, integrierte Nav + Input)
else:
  main (Outlet) mit reduziertem padding
  Kompakte Bottom-Bar (5 Mini-Buttons + Input)
```

### Schritt 3: Integrierte Bottom-Bar fuer Modul-Ansichten

Neue Komponente `src/components/portal/MobileModuleBar.tsx`:
- Kombiniert Navigation + Armstrong-Trigger in EINER Leiste
- 5 kleine Area-Icons (wie iOS Tab-Bar, aber kompakter als aktuelle 56px Kreise)
- Armstrong-Eingabe als Antippen-Trigger (oeffnet Full-Screen-Chat als Overlay)
- Hoehe: ~56px + safe-area statt aktuell ~80px (Nav) + ~48px (InputBar) = ~128px

### Schritt 4: Voice-Integration in Mobile-Input

- `VoiceButton` (existiert bereits) wird links neben dem Text-Input platziert
- Send-Button rechts
- Layout: `[Mic] [Input flex-1] [Send]`
- Nutzt `useArmstrongVoice` Hook (ElevenLabs STT bereits implementiert)

### Schritt 5: Modul-Seiten Mobile-Optimierung

Folgende Regeln werden durchgesetzt:

**Tabellen:** Auf Mobile (`useIsMobile()`) automatisch als Card-Stack rendern. Die `MobileCardView`-Komponente existiert bereits, wird aber nicht ueberall genutzt. Strategie:
- In `PageShell` oder als Wrapper-Komponente: Tabellen die breiter als Viewport sind, werden als gestapelte Karten dargestellt
- Charts (Recharts): Auf Mobile durch kompakte KPI-Zahlen oder Mini-Sparklines ersetzen
- Keine `overflow-x-auto` Tabellen mehr auf Mobile

**Horizontaler Overflow Fix:**
- Globale CSS-Regel: `body { overflow-x: hidden; }` als Sicherheitsnetz
- In `PortalLayout` mobile branch: `overflow-x-hidden` auf dem Container
- SubTabs bleiben horizontal scrollbar (das ist gewollt, funktioniert korrekt)

### Schritt 6: Armstrong Sheet entfernen (Mobile)

- `ArmstrongSheet` (Bottom-Sheet, 80vh) wird auf Mobile nicht mehr gebraucht
- Stattdessen: Wenn Armstrong in einer Modul-Ansicht geoeffnet wird, navigiert es zurueck zum Chat-Home oder zeigt einen ganzseitigen Overlay

---

## Dateien die geaendert/erstellt werden

| Aktion | Datei | Beschreibung |
|--------|-------|-------------|
| NEU | `src/components/portal/MobileHomeChatView.tsx` | Ganzseitiger Chat mit integrierten Area-Buttons + Voice |
| NEU | `src/components/portal/MobileModuleBar.tsx` | Kompakte Bottom-Bar fuer Modul-Ansichten |
| EDIT | `src/components/portal/PortalLayout.tsx` | Mobile-Branch komplett umbauen |
| EDIT | `src/pages/portal/PortalDashboard.tsx` | Mobile-Guard: Wird auf Mobile nicht gerendert (Home = Chat) |
| EDIT | `src/components/portal/MobileBottomNav.tsx` | Wird fuer Module kompakter, fuer Home entfernt |
| EDIT | `src/components/portal/ArmstrongInputBar.tsx` | In MobileHomeChatView integriert, Standalone entfaellt |
| EDIT | `src/styles/globals.css` oder Layout | `overflow-x: hidden` auf Mobile |
| OPTIONAL | Diverse Modul-Seiten | Card-Stack statt Tabelle auf Mobile |

---

## Design-Entscheidungen

1. **Keine Widgets auf Mobile-Home** — Der Chat IST das Dashboard
2. **5 Glass-Buttons bleiben** — Aber ueber dem Input, nicht als separate Nav-Leiste
3. **Voice prominent** — Mic-Button direkt neben Input, nicht versteckt im Sheet
4. **Armstrong-Sheet entfaellt** — Chat ist immer da, nicht hinter einem Sheet
5. **Module bleiben erreichbar** — Ueber Area-Buttons + Modul-Cards (wie bisher)
6. **Kein horizontales Scrollen** — Ausser bei SubTabs (gewollt)
7. **Safe-Area handling bleibt** — `env(safe-area-inset-bottom)` auf Input-Bar

---

## Risiken

| Risiko | Mitigation |
|--------|-----------|
| Armstrong-Chat-State geht verloren bei Navigation | `useArmstrongAdvisor` ist bereits ein Singleton — State bleibt erhalten |
| Module-Seiten haben inkonsistente Mobile-Layouts | Schrittweise Optimierung, erst Layout-Rahmen, dann pro Modul |
| Voice-Permission auf iOS Safari | Bereits gehandelt via `useArmstrongVoice` |

