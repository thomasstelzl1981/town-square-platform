

# Armstrong Chatbot Optimierungsstrategie

## Ausgangslage

Armstrong ist technisch solide (3.500+ Zeilen Edge Function, 200+ Actions, 12 Magic Intake Module), hat aber drei kritische UX-Schwachstellen:

1. **Statische Begruessung** -- Immer derselbe generische Text, egal welches Modul aktiv ist
2. **Keyword-basierte Intent-Erkennung** -- `classifyIntent()` nutzt 80+ hartcodierte Keywords; natuerliche Sprache wird oft falsch klassifiziert
3. **Keine visuellen Shortcuts** -- User muss per Freitext kommunizieren, kein Chip-System fuer haeufige Actions

## Empfohlene Strategie: 4 Schritte, aufeinander aufbauend

Basierend auf den Dossiers und dem aktuellen Code empfehle ich eine pragmatische 4-Schritt-Umsetzung. Wir verzichten bewusst auf Tool-Use/MCP (Phase 3+5 aus dem Dossier) -- das ist ein spaeterer Architektursprung. Stattdessen konzentrieren wir uns auf die Massnahmen mit dem groessten UX-Impact bei geringstem Aufwand.

---

### Schritt 1: Kontextsensitive Begruessung

**Datei:** `src/hooks/useArmstrongAdvisor.ts`

**Was:** Das statische `WELCOME_MESSAGE` durch eine Funktion `getWelcomeMessage(moduleCode, entityType)` ersetzen, die modulspezifische Begruessungen mit sofort klickbaren Action-Vorschlaegen liefert.

**Beispiel:**
- MOD-04 (Immobilien): "Willkommen in deinem Immobilien-Portfolio. Ich kann sofort helfen mit: Dokument hochladen, KPI berechnen, Datenqualitaet pruefen"
- MOD-07 (Finanzierung): "Ich bin bereit fuer deine Finanzierung. Selbstauskunft befuellen, Checkliste anzeigen, Bereitschaft pruefen"
- Default: "Hallo! Ich bin Armstrong -- dein KI-Assistent fuer Immobilien und Finanzen."

Die Funktion wird ueberall aufgerufen wo `WELCOME_MESSAGE` heute referenziert wird (Init, clearConversation, selectAction-Reset).

**Impact:** Sofortiger AHA-Effekt -- User sieht, dass Armstrong den Kontext kennt.

---

### Schritt 2: Action-Chip-Bar (Quick Actions)

**Neue Datei:** `src/components/armstrong/ArmstrongChipBar.tsx`
**Integration:** `src/components/chat/ChatPanel.tsx`

**Was:** Eine horizontale Leiste mit 2-4 klickbaren Chips ueber dem Eingabefeld, die je nach aktivem Modul die haeufigsten Actions zeigen.

**Chip-Definitionen:**
- MOD-04: Immobilie aus Dokument | KPI berechnen | Daten pruefen
- MOD-07: Selbstauskunft befuellen | Checkliste | Bereitschaft pruefen
- MOD-08: Simulation starten | Mandat aus Dokument | Favoriten analysieren
- MOD-11/12/13/18: jeweils 1-2 modulspezifische Chips
- Default: keine Chips (leeres Array)

**Klick-Verhalten:** Chip-Klick ruft `selectAction()` mit dem jeweiligen Action-Code auf -- kein Tippen, kein Intent-Problem.

**Impact:** Loest das Intent-Erkennungsproblem fuer die haeufigsten Use Cases zu ~70% ohne jede Backend-Aenderung.

---

### Schritt 3: Unified System Prompt

**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`

**Was:** Die 5 fragmentierten Prompt-Bloecke (ARMSTRONG_CORE_IDENTITY, buildContextBlock, plus weitere verstreute Anweisungen) durch eine einzige Funktion `buildUnifiedSystemPrompt()` ersetzen.

**Struktur des neuen Prompts:**
1. Identitaet (wer ist Armstrong)
2. Aktuelle Situation (Zone, Modul, Pfad, Entity)
3. Persoenlichkeit (professionell, direkt, Deutsch)
4. Prioritaeten (Sicherheit > Kontext > Actions > Sprache)
5. Verfuegbare Actions (Top 5 fuer aktuelles Modul)
6. Magic Intake Regel (proaktiv vorschlagen bei Dokumenten)
7. Web-Recherche Status

Alle Parameter kommen aus dem bestehenden Request-Body -- keine neuen Datenquellen noetig.

**Impact:** Konsistenteres Verhalten, weniger Halluzinationen, klare Prioritaeten bei Widerspruechen.

---

### Schritt 4: Proaktiver Document-Upload-Flow

**Datei:** `src/hooks/useArmstrongDocUpload.ts` (oder wo der Upload-Handler sitzt)

**Was:** Nach erfolgreichem Dokument-Upload erkennt eine `detectDocumentIntent(filename, extractedText)` Funktion automatisch den wahrscheinlichsten Dokumenttyp und schlaegt die passende Magic Intake Action als Confirmation-Dialog vor.

**Erkennungslogik:**
- Dateiname enthaelt "Kaufvertrag" oder Text enthaelt "Grundbuch" --> MOD-04 Magic Intake
- "Selbstauskunft" / "Gehalt" / "Netto" --> MOD-07 Magic Intake
- "Versicherung" / "Polizzennummer" --> MOD-18 Magic Intake
- "Mietvertrag" / "Mieter" --> MOD-20 Magic Intake
- usw. fuer MOD-17 (Fahrzeuge), MOD-19 (PV), MOD-11 (Finanzierung)

**Fallback:** Kein erkannter Typ --> normales Verhalten, User tippt selbst.

**Impact:** Magic Intake wird deutlich haeufiger genutzt, da Armstrong proaktiv die richtige Action vorschlaegt.

---

## Was bewusst NICHT in dieser Runde umgesetzt wird

| Massnahme | Grund |
|---|---|
| LLM-Vorklassifikation statt Keywords (Phase 2.1) | Erfordert zusaetzlichen API-Call pro Nachricht, Kosten und Latenz steigen. Chip-Bar loest 70% des Problems kostenlos. |
| Tool-Use / Function Calling (Phase 3) | Fundamentaler Architekturumbau, 2-3 Wochen Aufwand. Sinnvoll als naechster grosser Schritt NACH diesen Quick Wins. |
| MCP Server (Phase 5) | Langfristiges Ziel, abhaengig von Tool-Use als Vorstufe. |
| ElevenLabs TTS Reaktivierung | Unabhaengig von diesen UX-Fixes, kann separat erfolgen. |

---

## Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung |
|---|---|
| `src/hooks/useArmstrongAdvisor.ts` | `WELCOME_MESSAGE` durch `getWelcomeMessage()` ersetzen |
| `src/components/armstrong/ArmstrongChipBar.tsx` | Neue Komponente: modulspezifische Action-Chips |
| `src/components/chat/ChatPanel.tsx` | ChipBar-Integration ueber dem Eingabefeld |
| `supabase/functions/sot-armstrong-advisor/index.ts` | `buildUnifiedSystemPrompt()` statt fragmentierter Bloecke |
| `src/hooks/useArmstrongDocUpload.ts` | `detectDocumentIntent()` fuer proaktiven Upload-Flow |

## Reihenfolge

Schritt 1 und 2 sind voneinander unabhaengig und koennen parallel umgesetzt werden. Schritt 3 ist ein Backend-only-Change. Schritt 4 baut auf dem bestehenden Upload-Hook auf.

