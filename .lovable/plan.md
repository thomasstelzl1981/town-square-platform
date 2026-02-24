
# Optimierung Magic Intake (MOD-13) — Maximale KI-Power

## Antwort auf deine Fragen

**Publish noetig?** Ja. Die Frontend-Aenderungen (Review-Tabelle, Immobilienakten-Button) sind noch nicht live. Die Edge Function (`sot-project-intake`) ist bereits automatisch deployed. Ein Klick auf "Update" im Publish-Dialog genuegt.

**Wo testen?** Direkt auf `systemofatown.lovable.app` (oder `systemofatown.com`) nach dem Publish. Das ist die stabilste Umgebung.

---

## Identifizierte Optimierungen (6 Punkte)

### 1. KI-Modell-Upgrade: Gemini 2.5 Flash → Gemini 2.5 Pro (oder 3 Flash Preview)

**Problem:** Die Edge Function nutzt `google/gemini-2.5-flash` fuer BEIDE Extraktionen (Expose + Preisliste). Flash ist schnell, aber bei komplexen PDFs (72 Einheiten, 3 WEGs, Tabellenstrukturen) schwaecher in der Praezision.

**Loesung:**
- **Expose-Analyse:** Upgrade auf `google/gemini-2.5-pro` — hier brauchen wir maximale Dokumentverstaendnis-Qualitaet (Bilder, Tabellen, Freitext)
- **Preislisten-Parsing:** `google/gemini-2.5-flash` bleibt ausreichend (strukturierte Tabelle + Tool-Calling)
- `max_tokens` fuer Expose: Erhoehen von 2000 auf 4000 (72 Einheiten generieren mehr Output)

**Datei:** `supabase/functions/sot-project-intake/index.ts` Zeile 250 + 291

### 2. Expose-Prompt-Verbesserung fuer Aufteilungsobjekte

**Problem:** Der aktuelle System-Prompt ist generisch. Bei einem Aufteilungsobjekt wie "Menden Living" (3 WEGs, Baujahr 1980) muss die KI spezifische Felder erkennen:
- WEG-Zuordnung (welche Einheit gehoert zu welcher WEG)
- Ist-Miete vs. Soll-Miete
- Hausgeld/Instandhaltungsruecklage
- Mietrendite
- Baujahr + Modernisierungszustand

**Loesung:** System-Prompt um Aufteilungsobjekt-spezifische Felder erweitern. Tool-Calling auch fuer Expose-Extraktion einfuehren (statt Freitext-JSON), damit die Datenstruktur zuverlaessiger ist.

**Datei:** `supabase/functions/sot-project-intake/index.ts` Zeile 252-281

### 3. Preislisten-Tool: Erweiterte Felder fuer Kapitalanleger

**Problem:** Das Tool `extract_units` erfasst nur 7 Felder (unitNumber, type, area, rooms, floor, price, currentRent). Fuer ein Aufteilungsobjekt fehlen:
- `hausgeld` (Monatliches Hausgeld)
- `instandhaltung` (Instandhaltungsruecklage)  
- `nettoRendite` (Netto-Rendite in %)
- `weg` (WEG-Zuordnung, z.B. "WEG 1: Wunne 6-18")
- `mietfaktor` (Kaufpreis / Jahresmiete)

**Loesung:** Tool-Schema erweitern + entsprechende DB-Felder in `dev_project_units`. Die Review-Tabelle zeigt dann alle relevanten Kapitalanleger-KPIs.

**Datei:** `supabase/functions/sot-project-intake/index.ts` (EXTRACT_UNITS_TOOL Schema)

### 4. Zweistufige KI-Analyse (Expose zuerst, dann Preisliste MIT Kontext)

**Problem:** Expose und Preisliste werden aktuell unabhaengig voneinander analysiert. Die Preislisten-KI weiss nichts vom Expose-Kontext (z.B. dass es 3 WEGs gibt, dass es ein Aufteilungsobjekt ist).

**Loesung:** Sequenzielle Analyse:
1. Expose analysieren → Ergebnis zwischenspeichern
2. Preisliste analysieren MIT Expose-Kontext im System-Prompt: "Dieses Projekt heisst X, hat Y WEGs, Baujahr Z. Ordne die Einheiten korrekt zu."

Das verbessert die Mapping-Qualitaet deutlich.

**Datei:** `supabase/functions/sot-project-intake/index.ts` (handleAnalyze Funktion)

### 5. Review-Step: Inline-Editing der Einheiten-Tabelle

**Problem:** Aktuell kann man im Review-Step nur Projektdaten editieren und einzelne Einheiten loeschen. Man kann keine Einheiten-Werte korrigieren (z.B. falsche Flaeche, falscher Preis).

**Loesung:** Jede Zelle in der Einheiten-Tabelle wird editierbar (Click-to-Edit). Ausserdem:
- "Einheit hinzufuegen" Button fuer fehlende Einheiten
- Spalte "WEG" hinzufuegen (fuer Aufteilungsobjekte)
- Summenzeile am Ende der Tabelle

**Datei:** `src/pages/portal/projekte/ProjekteDashboard.tsx` (Review-Step)

### 6. Validierung vor Projekt-Erstellung

**Problem:** Aktuell kann man ein Projekt ohne Plausibilitaetspruefung erstellen. Keine Warnung bei:
- Einheiten ohne Preis
- Doppelte Einheitennummern
- Unplausible Werte (z.B. 1 m² Wohnung fuer 500.000 EUR)

**Loesung:** Validierungslogik VOR dem "Projekt anlegen" Button:
- Warnung bei fehlenden Pflichtfeldern
- Warnung bei Preisabweichungen > 50% vom Durchschnitt
- Warnung bei doppelten Einheitennummern
- Blocking-Error wenn Projektname leer

**Datei:** `src/pages/portal/projekte/ProjekteDashboard.tsx`

---

## Technischer Implementierungsplan

### Dateien die geaendert werden:

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-project-intake/index.ts` | Modell-Upgrade auf Pro fuer Expose; erweiterte Tool-Schema-Felder; sequenzielle Analyse mit Kontext-Weitergabe; erweiterter System-Prompt fuer Aufteilungsobjekte |
| `src/pages/portal/projekte/ProjekteDashboard.tsx` | Inline-Editing in Einheiten-Tabelle; Validierungslogik vor Erstellung; erweiterte Spalten (WEG, Hausgeld, Rendite); Einheit-hinzufuegen Button; Summenzeile |

### Keine neuen Dateien noetig
### Kein DB-Schema-Aenderung noetig (die zusaetzlichen Felder wie hausgeld werden vorerst nur im Review-Step gezeigt und als intake_data JSON gespeichert)

### Sicherheit
- Keine neuen RLS-Policies noetig
- Keine neuen Secrets noetig (LOVABLE_API_KEY vorhanden)
- KI-Kosten steigen leicht durch Pro-Modell (ca. 3-5x Kosten pro Expose-Analyse), aber Qualitaet ist fuer den Money-Making-Prozess kritisch

---

## Zusammenfassung

Der Magic Intake wird von einem "gut genug"-Tool zu einem **Profi-Werkzeug** fuer Bautraeger und Aufteilungsobjekte. Die wichtigsten Upgrades:
1. Staerkstes KI-Modell fuer Expose-Verstaendnis
2. Kontext-uebergreifende Analyse (Expose informiert Preisliste)
3. Vollstaendige Kapitalanleger-Felder (Hausgeld, Rendite, WEG)
4. Editierbare Einheiten-Tabelle im Review
5. Plausibilitaetspruefung vor Erstellung
