
# Armstrong Redesign: Floating Overlay + Arbeitsvisualisierung

## Kernproblem

Aktuell ist Armstrong im Desktop-Modus ein **inline Stripe** (`w-[304px]`) rechts im Layout. Wenn er sich oeffnet, verschiebt sich die gesamte Seite nach links. Ausserdem fehlt eine Chat-Texteingabe im Stripe — nur Voice + Upload sind vorhanden.

---

## Neues Konzept: Floating Overlay Panel

Armstrong wird vom inline Layout-Element zu einem **schwebenden Overlay** umgebaut — aehnlich wie Intercom, ChatGPT-Sidebar oder Lovable selbst.

### Vorteile

- Seite bleibt zentriert, kein Layout-Shift
- Armstrong kann von ueberall geoeffnet werden ohne den Kontext zu stoeren
- Zweispaltiges Layout moeglich bei groesseren Bildschirmen
- Konsistent mit dem Orb-Konzept (schwebt bereits, bleibt schwebend)

### Layout-Architektur

```text
+-------------------------------------------------------------+
|  SystemBar                                                   |
+-------------------------------------------------------------+
|  TopNavigation                                               |
+-------------------------------------------------------------+
|                                                              |
|                    Main Content                              |
|                    (bleibt immer zentriert)                   |
|                                                              |
|                                          +------------------+|
|                                          |  Armstrong       ||
|                                          |  Floating Panel  ||
|                                          |  (overlay, z-50) ||
|                                          |                  ||
|                                          |  Links: Steps    ||
|                                          |  Rechts: Chat    ||
|                                          +------------------+|
+-------------------------------------------------------------+
```

### Zwei-Spalten-Modus (ab 1280px Viewport)

Wenn der Viewport breit genug ist, oeffnet sich Armstrong als zweispaltiges Panel:

```text
+------------------------------------------+
| ARMSTRONG                        [_] [x] |
+------------------------------------------+
|  Arbeitsschritte    |  Chat-Verlauf      |
|                     |                    |
|  [ok] Dokument      |  User: Analysiere  |
|       empfangen     |  diesen Vertrag    |
|  [ok] PDF wird      |                    |
|       analysiert    |  Armstrong: Ich    |
|  [..] Daten werden  |  habe 12 Felder    |
|       extrahiert    |  erkannt...        |
|  [ ] Datensatz      |                    |
|       anlegen       |                    |
|                     |                    |
+------------------------------------------+
| [Clip] [______Input______] [Send] [Mic]  |
+------------------------------------------+
```

Bei schmaleren Viewports (unter 1280px) wird es einspaltig: Die Arbeitsschritte erscheinen dann **inline im Chat** als aufklappbarer Block innerhalb der Assistant-Nachricht.

---

## Arbeitsvisualisierung: ThinkingSteps

### Was der User sieht

Wenn Armstrong arbeitet (Magic Intake, Research, Draft), werden die einzelnen Arbeitsschritte live angezeigt:

| Schritt | Status |
|---------|--------|
| Dokument empfangen | Abgeschlossen |
| PDF wird analysiert (3 Seiten) | Abgeschlossen |
| Daten werden extrahiert | Aktiv (Spinner) |
| Fahrzeug in Portfolio anlegen | Ausstehend |
| Ergebnis zusammenfassen | Ausstehend |

Jeder Schritt hat einen Status: `pending`, `active`, `completed`, `error`.

### Warum das wichtig ist

Da Credits berechnet werden, muss der User sehen, welche Arbeit Armstrong leistet. Das schafft Vertrauen und Transparenz — der User versteht, wofuer er bezahlt.

### Technische Umsetzung

**Simulierte Steps waehrend `isLoading`:** Da der Backend-Call kein Streaming unterstuetzt, werden die Steps client-seitig mit Timeouts progressiv angezeigt. Wenn die Response kommt, werden die finalen Steps aus der Backend-Antwort uebernommen.

**Backend:** Der `sot-armstrong-advisor` gibt im Response ein optionales `thinking_steps` Array zurueck, das die tatsaechlich durchgefuehrten Schritte dokumentiert.

---

## Technische Aenderungen

### 1. `src/components/portal/PortalLayout.tsx`

Armstrong wird aus dem `flex`-Layout entfernt. Statt als Inline-Element neben `main` wird `ArmstrongContainer` ausserhalb des Flex-Containers platziert — als Overlay.

**Vorher:**
```text
<div class="flex">
  <main>...</main>
  <ArmstrongContainer />  // inline, verschiebt Layout
</div>
```

**Nachher:**
```text
<div class="flex">
  <main>...</main>
</div>
<ArmstrongContainer />  // overlay, schwebt ueber allem
```

### 2. `src/components/portal/ArmstrongContainer.tsx`

Groesster Umbau:

- **Expanded-Modus:** Von `w-[304px] h-full` inline-Element zu `fixed right-4 bottom-4 w-[420px] h-[70vh] z-50` Overlay mit Schatten und abgerundeten Ecken
- **Zweispaltig (optional):** Ab 1280px Viewport wird `w-[680px]` mit `grid grid-cols-[240px_1fr]` — links ThinkingSteps, rechts Chat
- **Chat-Input:** Text-Eingabefeld mit Paperclip, Send-Button und Voice-Button im Footer (identisches Pattern wie `ChatPanel.tsx`)
- **Collapsed (Orb):** Bleibt unveraendert — draggable, floating, mit Mic

### 3. `src/components/chat/ThinkingSteps.tsx` (NEU)

Neue Komponente fuer die Arbeitsvisualisierung:

- Vertikale Schritt-Liste mit Icons (Check, Spinner, Circle)
- Animierte Uebergaenge von `pending` zu `active` zu `completed`
- Kompakte Darstellung (passt in 240px Spalte)
- Wiederverwendbar sowohl in der Zwei-Spalten-Ansicht als auch inline im Chat

### 4. `src/hooks/useArmstrongAdvisor.ts`

- Neuer State: `thinkingSteps: ThinkingStep[]`
- Step-Simulation waehrend `isLoading` mit progressiven Timeouts
- Mapping der finalen `thinking_steps` aus der Backend-Response
- Neues Feld `thinkingSteps` im `ChatMessage` Type

### 5. `src/components/chat/MessageRenderer.tsx`

- Nach Abschluss: ThinkingSteps werden inline in der Assistant-Nachricht angezeigt (im einspaltigen Modus)
- Aufklappbar mit Chevron — standardmaessig eingeklappt nach Abschluss

### 6. `supabase/functions/sot-armstrong-advisor/index.ts`

- `thinking_steps` Array im Response fuer Magic Intakes und Metered Actions
- Automatische Step-Generierung basierend auf Action-Typ:
  - Magic Intake: "Dokument empfangen" → "Analysiert" → "Extrahiert" → "Angelegt"
  - Research: "Kontext geladen" → "Recherchiert" → "Zusammengefasst"
  - Draft: "Vorlage geladen" → "Entwurf erstellt"

### 7. `src/hooks/usePortalLayout.tsx`

- Keine Layout-Aenderungen mehr noetig fuer `armstrongExpanded` — da Armstrong jetzt ein Overlay ist, beeinflusst der State nur die Sichtbarkeit des Panels, nicht das Layout

---

## Umsetzungsreihenfolge

1. PortalLayout anpassen (Armstrong aus flex entfernen)
2. ArmstrongContainer zu Floating Overlay umbauen + Chat-Input hinzufuegen
3. ThinkingSteps Komponente erstellen
4. Hook erweitern (thinkingSteps State + Simulation)
5. MessageRenderer Integration (inline Steps)
6. Backend: thinking_steps im Response
7. Zweispalten-Layout (ab 1280px)

---

## Zusammenfassung

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Layout | Inline Stripe, verschiebt Seite | Floating Overlay, Seite bleibt stabil |
| Breite | 304px fest | 420px (1-spaltig) / 680px (2-spaltig) |
| Chat-Input | Fehlt (nur Voice+Upload) | Vollstaendige Eingabezeile |
| Arbeitsschritte | "Armstrong denkt nach..." (Spinner) | Live-Schrittliste mit Status |
| Credits-Transparenz | Nicht sichtbar | Jeder Schritt dokumentiert und sichtbar |
