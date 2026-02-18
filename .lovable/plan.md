
# Armstrong Expanded Panel: Redesign — Schmaler, Hoeher, Glaeser, Einheitliche Icons, Willkommensnachricht

## Ausgangslage

Der expandierte Armstrong-Panel (`ArmstrongContainer.tsx`, Zeile 249-548) hat aktuell:
- Breite: `w-[680px]` (breit) / `w-[420px]` (schmal) — zu breit
- Hoehe: `h-[70vh] max-h-[800px]` — zu niedrig
- Background: `bg-background/95` — fast undurchsichtig
- Icons: Verschiedene Icons an verschiedenen Stellen:
  - **SystemBar**: `Rocket` (Desktop-Toggle)
  - **ArmstrongInputBar**: `MessageCircle` (Mobile)
  - **ChatPanel / ArmstrongContainer Header + Empty State**: `Globe`
- Empty State: Fester Text "Wie kann ich helfen?" mit Emoji-Zeile — wirkt statisch und nicht interaktiv

## Aenderungen

### 1. Panel-Dimensionen anpassen (`ArmstrongContainer.tsx`)

**Breite 25% schmaler:**
- `w-[680px]` (wide) wird zu `w-[510px]`
- `w-[420px]` (normal) wird zu `w-[315px]`

**Hoehe 25% hoeher:**
- `h-[70vh]` wird zu `h-[87.5vh]`
- `max-h-[800px]` wird zu `max-h-[1000px]`

### 2. Glaesernes Design

Der Panel-Container bekommt ein durchscheinendes Glas-Design:
- `bg-background/95` wird zu `bg-background/70 backdrop-blur-2xl`
- Border: `border-white/15 dark:border-white/10`
- Die bestehende `backdrop-blur-2xl` bleibt

Der Header-Bereich wird ebenfalls subtil angepasst: `border-b border-white/10` statt `border-border/30`

### 3. Einheitliches Icon: `Rocket` ueberall

Alle Armstrong-bezogenen Icons werden auf `Rocket` vereinheitlicht:

| Stelle | Vorher | Nachher |
|--------|--------|---------|
| SystemBar (Desktop-Toggle) | `Rocket` | `Rocket` (bleibt) |
| ArmstrongInputBar (Mobile) | `MessageCircle` | `Rocket` |
| ArmstrongContainer Header | `Globe` | `Rocket` |
| ArmstrongContainer Empty State | `Globe` | `Rocket` |
| ArmstrongContainer Loading Indicator | `Globe` | `Rocket` |
| ChatPanel Header (bottomsheet) | `Globe` | `Rocket` |
| ChatPanel Empty State | `Globe` | `Rocket` |
| ChatPanel Loading Indicator | `Globe` | `Rocket` |

### 4. Willkommensnachricht beim Oeffnen

Wenn der Panel geoeffnet wird und keine Nachrichten vorhanden sind, wird automatisch eine Willkommensnachricht als Assistant-Message eingefuegt. Diese erscheint als regulaere Chat-Nachricht (nicht als statischer Text):

**Text der Willkommensnachricht:**
> Hallo! Ich bin Armstrong, dein persoenlicher Assistent. Ich kann dir bei vielen Aufgaben helfen:
>
> - **Fragen stellen** — Ich erklaere dir alles rund um dein System
> - **Dokumente analysieren** — Haenge ein Dokument an und ich lese es fuer dich
> - **Daten zuordnen** — Gib mir Informationen und ich helfe dir, sie richtig einzuordnen
> - **Texte erstellen** — Briefe, E-Mails oder Zusammenfassungen
>
> Frag mich einfach, was du wissen moechtest!

**Implementierung:**
- In `useArmstrongAdvisor.ts`: Eine neue Funktion `getWelcomeMessage()` die eine `ChatMessage` mit `role: 'assistant'` zurueckgibt
- Die `messages`-Liste wird bei Initialisierung mit der Willkommensnachricht vorbelegt (sofern leer)
- Die Willkommensnachricht bekommt eine spezielle `id: 'welcome'`, damit sie beim `clearConversation` nicht als echte History zaehlt
- Der bisherige statische Empty-State-Block (Zeile 363-374 in ArmstrongContainer, Zeile 303-319 in ChatPanel) wird entfernt, da die Willkommensnachricht als regulaere Chat-Bubble gerendert wird

### 5. Empty State bereinigen

Der statische Empty-State mit Globe-Icon und Emoji-Text wird komplett entfernt aus:
- `ArmstrongContainer.tsx` (Zeile 363-374)
- `ChatPanel.tsx` (Zeile 303-319)

Da die Willkommensnachricht immer vorhanden ist, gibt es keinen "leeren" Zustand mehr.

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| `src/components/portal/ArmstrongContainer.tsx` | Dimensionen (schmaler+hoeher), Glas-Background, Rocket statt Globe, Empty State entfernen |
| `src/components/portal/ArmstrongInputBar.tsx` | `MessageCircle` durch `Rocket` ersetzen |
| `src/components/chat/ChatPanel.tsx` | `Globe` durch `Rocket` ersetzen, Empty State entfernen |
| `src/hooks/useArmstrongAdvisor.ts` | Willkommensnachricht bei leerer Conversation automatisch einfuegen |

## Reihenfolge

1. `useArmstrongAdvisor.ts` — Willkommensnachricht-Logik
2. `ArmstrongContainer.tsx` — Dimensionen, Glas, Icons, Empty State entfernen
3. `ArmstrongInputBar.tsx` — Icon vereinheitlichen
4. `ChatPanel.tsx` — Icon vereinheitlichen, Empty State entfernen
