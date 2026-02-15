
# Armstrong Investment Engine Coach + Slideshow-Begleitung — Master Pack v1

## Uebersicht

Armstrong erhaelt ein neues Coach-System fuer Investment Engine Seiten (MOD-08/MOD-09) und die Fullscreen-Slideshow. Der Coach liefert pro Slide eine kurze, empathische Coaching-Message, begleitet Nutzer durch die Investment Engine und fuehrt subtil zur Simulation/CTA. Gleichzeitig entsteht eine indirekte Berater-Schulung.

## Architektur

Das System besteht aus 4 Schichten:

1. **Knowledge Base Eintraege** — Coaching-Texte und Guardrails als KB-Items in der Datenbank
2. **Action Manifest** — 20+ neue Coach-Actions im `armstrongManifest.ts`
3. **Edge Function** — Coach-Handler im `sot-armstrong-advisor` mit spezialisiertem System-Prompt
4. **Frontend Events** — Event-System in SlideshowViewer und Investment-Seiten, das Armstrong triggert

---

## Teil 1: Knowledge Base Eintraege (Datenbank)

Es werden ~15 KB-Items in die `knowledge_base` Tabelle eingefuegt (via SQL Migration). Diese enthalten das gesamte Coach-Wissen:

| Titel | Kategorie | Inhalt |
|-------|-----------|--------|
| `ARM Coach: Globale Guardrails` | `system` | Style-Regeln: max 220 Zeichen, kein Renditeversprechen, keine Steuerberatung, langsames Schreiben, empathischer Ton |
| `ARM Coach: Investment Engine Einfuehrung` | `system` | Rahmen-Erklaerung, EK/zVE-Logik, Marktplatz vs Mandat |
| `ARM Coach: Verkaufspraesentation S1-S8` | `sales` | Alle 8 Slide-Coaching-Texte fuer Verkaufspraesentation |
| `ARM Coach: Rendite S1-S7` | `sales` | Alle 7 Slide-Coaching-Texte fuer Rendite |
| `ARM Coach: Steuervorteil S1-S6` | `sales` | Alle 6 Slide-Coaching-Texte fuer Steuervorteil |
| `ARM Coach: Verwaltung S1-S7` | `sales` | Alle 7 Slide-Coaching-Texte fuer Verwaltung/Software |
| `ARM Coach: Einwandbehandlung Schulden` | `sales` | Coaching-Antwort fuer Schulden-Bedenken |
| `ARM Coach: Einwandbehandlung Risiko` | `sales` | Coaching-Antwort fuer Risiko-Bedenken |
| `ARM Coach: MSV Erklaerung` | `system` | Mietsonderverwaltung kurz erklaert |
| `ARM Coach: Plattform-Features Ueberblick` | `system` | Portfolio, DMS, Finanzierung, KI — was die Software kann |

---

## Teil 2: Action Manifest Erweiterung

20 neue Actions im `armstrongManifest.ts`, alle `readonly`, `free`, `low risk`:

### Coach Lifecycle Actions (5)

| Action Code | Trigger | Beschreibung |
|-------------|---------|-------------|
| `ARM.INV.COACH.AUTO_START` | Engine/Presentation sichtbar | Begruessung + QuickActions |
| `ARM.INV.COACH.DISMISS` | User klickt "Coach ausblenden" | Setzt 24h Dismiss-Flag |
| `ARM.INV.COACH.RESUME` | User sagt "Coach an" | Reaktiviert den Coach |
| `ARM.INV.COACH.PAUSE_FOR_USER` | User stellt Frage waehrend Slideshow | Pausiert Narration 30s |
| `ARM.INV.COACH.TO_SIMULATION` | CTA-Klick oder CTA-Slide | Leitet zur Simulation |

### Slide Coaching Actions (28)

| Praefix | Praesentation | Slides |
|---------|--------------|--------|
| `ARM.INV.COACH.VERKAUF.S1-S8` | Verkaufspraesentation | 8 |
| `ARM.INV.COACH.RENDITE.S1-S7` | Rendite erklaert | 7 |
| `ARM.INV.COACH.STEUER.S1-S6` | Steuervorteil | 6 |
| `ARM.INV.COACH.SOFT.S1-S7` | Verwaltung/Software | 7 |

### Engine On-Page Actions (8)

| Action Code | Trigger | Beschreibung |
|-------------|---------|-------------|
| `ARM.INV.COACH.ENGINE.INTRO` | Engine sichtbar, keine Slideshow | Fuehrungsangebot |
| `ARM.INV.COACH.ENGINE.FRAME_START` | QuickAction "Rahmen starten" | EK/Puffer erfragen |
| `ARM.INV.COACH.ENGINE.FRAME_NEXT` | Nach EK/Puffer | Netto/Ziel erfragen |
| `ARM.INV.COACH.ENGINE.PATH_CHOICE` | Nach Frame | Marktplatz vs Mandat |
| `ARM.INV.COACH.ENGINE.MSV_EXPLAIN` | QuickAction "MSV erklaert" | MSV-Kurz-Erklaerung |
| `ARM.INV.COACH.ENGINE.TO_SIMULATION` | QuickAction "Zur Simulation" | Simulation-CTA |
| `ARM.INV.COACH.ENGINE.OBJECTION_DEBT` | Angst vor Schulden | Einwandbehandlung |
| `ARM.INV.COACH.ENGINE.OBJECTION_RISK` | Risiko-Bedenken | Einwandbehandlung |

Alle Actions werden mit `module: 'MOD-08'`, `zones: ['Z2', 'Z3']` und `ui_entrypoints: ['/portal/investments', '/portal/vertriebspartner', '/kaufy', '/sot']` registriert.

---

## Teil 3: Edge Function Erweiterung

Der bestehende `sot-armstrong-advisor` erhaelt einen neuen Coach-Handler-Zweig:

### Neuer System-Prompt (Coach-Modus)

```text
Du bist Armstrong im Coach-Modus. Deine Aufgabe:
- Max 1-2 Saetze pro Output (<= 220 Zeichen, ideal <= 140)
- Langsam schreiben (simulate_typing = true)
- Keine Prozent-/Renditeversprechen, keine konkreten Zahlen
- Keine Steuerberatung, keine Objekt-/Lageempfehlungen
- Fokus: Prinzip + Struktur + Simulation
- Ton: ruhig, empathisch, souveraen, emotional (nicht aggressiv)
- Bei Wiederholung: nur "Kurz-Reminder ..."
- Leitmotiv: "Prinzip erklaeren, nicht druecken."
```

### Coach-Action Dispatcher

Der Edge Function bekommt einen neuen Switch-Block fuer alle `ARM.INV.COACH.*` Actions:
- Liest den passenden KB-Eintrag (Slide-Text) aus der Datenbank
- Gibt den vordefinierten Coaching-Text zurueck (kein LLM-Call fuer Slide-Coaching, nur fuer freie Fragen)
- Bei User-Fragen waehrend Coach: LLM-Call mit Coach-System-Prompt + KB-Kontext

### Intent-Erweiterung

Neue Keywords in `classifyIntent()`:
- "coach", "begleite", "fuehre mich", "erklaer mir" → Coach-Intent
- Slideshow-bezogene Begriffe → Coach-Intent

---

## Teil 4: Frontend Event-System

### SlideshowViewer Erweiterung

Der `SlideshowViewer.tsx` feuert Events bei Slide-Wechsel:

```text
Events:
- PRESENTATION_OPENED {presentationKey}
- PRESENTATION_SLIDE_CHANGED {presentationKey, slideIndex}
- PRESENTATION_CLOSED {presentationKey}
```

Implementierung via `window.dispatchEvent(new CustomEvent(...))` — Armstrong lauscht ueber einen `useEffect` im `ArmstrongSheet` oder ChatPanel.

### Investment Engine Seiten

Die MOD-08/MOD-09 Seiten feuern:
- `INVESTMENT_ENGINE_VISIBLE {route, moduleKey}`
- `INVESTMENT_SIMULATION_STARTED`
- `INVESTMENT_SIMULATION_COMPLETED`

### Coach-Hook: `useArmstrongCoach`

Ein neuer Hook der:
1. Auf Coach-Events lauscht
2. Den Dismiss-Status prueft (localStorage: `arm_coach_dismissed_until`)
3. Automatisch `sendMessage()` mit der passenden Coach-Action aufruft
4. QuickActions bereitstellt (Erklaarung starten, Zur Simulation, Coach ausblenden)

---

## Teil 5: MVP Modules Erweiterung

`MVP_MODULES` in der Edge Function und im Hook wird um `'MOD-09'` erweitert (fuer Immomanager-Kontext).

---

## Dateien

### Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/hooks/useArmstrongCoach.ts` | Coach-Event-Listener, Auto-Start-Logik, Dismiss-Management |
| `src/constants/armstrongCoachMessages.ts` | Statische Coach-Texte als Frontend-Fallback (fuer Offline/Fast-Path) |

### Geaenderte Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/armstrongManifest.ts` | ~40 neue Coach-Actions (Lifecycle + Slides + Engine) |
| `supabase/functions/sot-armstrong-advisor/index.ts` | Coach-Handler, Coach-System-Prompt, neue Action-Dispatcher, MVP_MODULES += MOD-09 |
| `src/components/shared/slideshow/SlideshowViewer.tsx` | CustomEvent-Dispatch bei open/slide-change/close |
| `src/hooks/useArmstrongAdvisor.ts` | MVP_MODULES += 'MOD-09' |
| `src/components/chat/ChatPanel.tsx` | Coach-QuickActions anzeigen wenn Coach aktiv |

### DB-Migration

SQL-Insert von ~15 Knowledge Base Eintraegen in `knowledge_base` Tabelle mit:
- `category: 'sales'` oder `'system'`
- `is_public: true`
- `keywords: ['coach', 'investment', 'slideshow', ...]`
- Vollstaendige Coaching-Texte wie im Master Pack spezifiziert

---

## Technische Details

### Event-Flow (Slideshow)

```text
User oeffnet Slideshow
  → SlideshowViewer dispatcht PRESENTATION_OPENED
  → useArmstrongCoach empfaengt Event
  → Prueft: arm_coach_dismissed_until < now?
  → Ja: sendMessage("ARM.INV.COACH.AUTO_START")
  → Armstrong antwortet: "Ich begleite dich kurz..."
  
User wechselt Slide
  → PRESENTATION_SLIDE_CHANGED {key, index}
  → useArmstrongCoach mappt: key=verkaufspraesentation + index=2 → ARM.INV.COACH.VERKAUF.S3
  → sendMessage mit action_request
  → Edge Function gibt KB-Text zurueck (kein LLM-Call)
```

### Event-Flow (Investment Engine)

```text
User navigiert zu /portal/investments/suche
  → INVESTMENT_ENGINE_VISIBLE
  → useArmstrongCoach prueft Dismiss
  → sendMessage("ARM.INV.COACH.ENGINE.INTRO")
  → Armstrong: "Soll ich dich kurz fuehren?"
  → QuickActions: [Rahmen starten, Marktplatz vs Mandat, MSV erklaert, Zur Simulation]
```

### Dismiss-Logik

```text
localStorage key: arm_coach_dismissed_until
Value: ISO timestamp (now + 24h)
Pruefung: Bei jedem Auto-Start-Trigger
Reset: Wenn User "Coach an" sagt → localStorage entfernen
```
