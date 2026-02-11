
# Sanierung-Modul: UX-Ueberarbeitung fuer Praesentation

## Analyse der Probleme

### 1. Startseite (SanierungTab) — zu starr, zu viele Kacheln
- **Workflow-Leiste** oben ist okay als Orientierung, aber visuell klobig
- **9 Kategorie-Kacheln** am Ende sind nutzlos — der Kunde waehlt keine Kategorie als Einstieg, sondern beschreibt sein Vorhaben frei
- **"Unzugeordnete Angebote"-Karte** ist leer und nimmt Platz weg — irrelevant fuer die Praesentation
- **Info-Hinweis-Karte** wiederholt sich (erscheint auch im Create-Dialog)
- Insgesamt: Zu viel "Dashboard" fuer ein Modul, das genau einen Flow hat

### 2. Erstelldialog (ServiceCaseCreateDialog) — zu gross, zu komplex
- 9 Kategorie-RadioButtons als Grid — der Kunde will nicht "Sanitaer" oder "Elektro" auswaehlen, sondern einfach beschreiben was gemacht werden soll
- Titel und Beschreibung sind getrennt, obwohl eine Kurzbeschreibung reicht
- "Einheit"-Auswahl mit Checkbox "Gesamtes Objekt" ist verwirrend
- Der Dialog ist ueberladen fuer den einfachen Anwendungsfall: "Ich will meine Wohnung sanieren"

### 3. Fehlender Uebergang in den Workflow
- Nach Anlage landet man wieder auf der Liste — der "Weiter zu Leistungsumfang"-Button im Dialog fuehrt nirgendwo hin (TODO-Kommentar im Code)
- Es gibt keinen fliessenden Uebergang von Anlage zu Scope-Definition zu Dienstleister-Suche

## Ueberarbeitungsvorschlag

### A. SanierungTab — Aufgeraeumt und workflow-orientiert

**Entfernt:**
- 9 Kategorie-Kacheln (komplett weg)
- "Unzugeordnete Angebote"-Karte (komplett weg)
- Info-Hinweis-Karte am Ende (komplett weg)

**Bleibt:**
- CI-Ueberschrift (gerade erst eingefuegt)
- Workflow-Leiste (kompakter, nur als schmale Fortschrittsanzeige)
- "Neuer Vorgang"-Button
- Aktive-Vorgaenge-Tabelle (bleibt, ist der Kern)

**Neu:**
- Wenn ein Vorgang in der Tabelle angeklickt wird, oeffnet sich inline (unterhalb oder als Slide-in) der Workflow-Bereich fuer genau diesen Vorgang — mit den 4 Schritten als vertikaler Stepper
- Empty State wird einladender: grosser CTA "Sanierung starten" statt trockener Tabellen-Platzhalter

### B. Erstelldialog — Radikal vereinfacht

**Neuer Flow (3 Felder statt 6+):**

```text
+-- Dialog (max-w-md, kompakt) --------------------------------+
|  Sanierung starten                                            |
|                                                               |
|  Objekt:       [Dropdown — Musterstrasse 1, Muenchen    v]   |
|  Einheit:      [Dropdown — WE-001 Erdgeschoss            v]   |
|                [x] Gesamtes Objekt (ganzes Haus)              |
|                                                               |
|  Was soll gemacht werden?                                     |
|  +----------------------------------------------------------+ |
|  | Komplettsanierung Bad und Kueche. Neue Fliesen,          | |
|  | Armaturen, Kuechenzeile. Boeden im Flur und             | |
|  | Wohnzimmer erneuern (Vinyl). Malerarbeiten alle Raeume. | |
|  +----------------------------------------------------------+ |
|  [Mikrofon]                                                   |
|                                                               |
|  Die KI erstellt aus Ihrer Beschreibung ein                   |
|  strukturiertes Leistungsverzeichnis.                         |
|                                                               |
|                        [Abbrechen]  [Weiter →]                |
+---------------------------------------------------------------+
```

**Aenderungen:**
- **Kategorie entfaellt komplett** — die KI erkennt aus der Freitextbeschreibung, ob es Sanitaer, Elektro oder Maler ist, und setzt die Kategorie automatisch
- **Titel entfaellt** — wird automatisch aus der Beschreibung generiert (erste ~60 Zeichen oder KI-Summary)
- **Beschreibung wird zum Hauptfeld** — grosses Textarea mit Diktierfunktion, Placeholder erklaert was man schreiben soll
- **Dialog ist kleiner** (max-w-md statt max-w-lg)

### C. Nach Anlage: Direkter Einstieg in den Workflow

Nach Klick auf "Weiter" im Dialog:
1. Der Vorgang wird in der DB angelegt (Kategorie = 'sonstige' als Default, wird spaeter von KI korrigiert)
2. Der Dialog schliesst sich
3. Der neue Vorgang wird sofort in der Tabelle angezeigt und automatisch "geoeffnet" — d.h. der Workflow-Bereich (ScopeDefinitionPanel) klappt direkt darunter auf
4. Der Nutzer arbeitet sich durch: Leistungsverzeichnis (KI) -> Dienstleister suchen -> Ausschreibung versenden

### D. Inline-Workflow statt separater Seiten

Statt den Workflow in separate Seiten/Routes aufzuteilen, wird er inline in der SanierungTab dargestellt. Wenn ein Vorgang ausgewaehlt ist, erscheint unterhalb der Tabelle ein expandierter Bereich mit einem vertikalen Stepper:

```text
Aktive Vorgaenge
+------------------------------------------------------------------+
| SAN-001 | Badsanierung komplett | Entwurf | [Chevron nach unten] |
+------------------------------------------------------------------+
| ▼ WORKFLOW                                                        |
|                                                                    |
| [●] 1. Leistungsumfang          ← aktueller Schritt               |
|     +-- KI-Analyse / Freitext / LV-Upload                         |
|     +-- Positionen bearbeiten                                      |
|     +-- Kostenschaetzung                                           |
|                                                                    |
| [○] 2. Dienstleister finden                                       |
| [○] 3. Ausschreibung versenden                                    |
| [○] 4. Angebote vergleichen                                       |
+------------------------------------------------------------------+
| SAN-002 | Kuechenumbau          | Bereit  | [Chevron nach rechts] |
+------------------------------------------------------------------+
```

---

## Technische Umsetzung

### Geaenderte Dateien (3)

**1. `src/pages/portal/immobilien/SanierungTab.tsx`**
- Kategorie-Kacheln, "Unzugeordnete Angebote"-Karte und Info-Hinweis entfernen
- Workflow-Leiste kompakter gestalten (schmaler, horizontale Dots statt breite Boxen)
- Tabellen-Rows klickbar machen: Bei Klick wird `expandedCaseId` State gesetzt
- Unterhalb der expandierten Row wird der Workflow-Stepper (ScopeDefinitionPanel + ProviderSearchPanel + TenderDraftPanel) als Collapsible-Bereich gerendert
- Empty State: Einladenderer CTA mit grossem Icon und "Erste Sanierung starten"
- `onSuccess`-Callback vom Dialog setzt `expandedCaseId` auf die neue Case-ID

**2. `src/components/portal/immobilien/sanierung/ServiceCaseCreateDialog.tsx`**
- Kategorie-RadioGroup komplett entfernen (Default: 'sonstige')
- Titel-Feld entfernen (wird aus Beschreibung generiert: erste 60 Zeichen)
- Beschreibung wird Pflichtfeld und bekommt groesseres Textarea (5 Rows)
- Dialog auf `max-w-md` verkleinern
- Neuer hilfreicher Placeholder-Text: "Beschreiben Sie, was saniert werden soll. z.B.: Komplettes Bad erneuern, neue Fliesen, Dusche statt Badewanne, neue Armaturen..."
- Einheit-Auswahl vereinfachen: Dropdown ohne Checkbox — einfach "Alle / WE-001 / WE-002"

**3. `src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx`**
- Die "Hinweis: Wohnungs- und Haussanierungen"-Karte entfernen (redundant)
- Header anpassen (kein "Schritt 2 von 4" Badge, da der Stepper das jetzt zeigt)
- Kompakter: Property-Context-Card kann entfallen wenn die Info schon im uebergeordneten Bereich steht

### Keine neuen Dateien noetig
Die bestehenden Komponenten (ScopeDefinitionPanel, ProviderSearchPanel, TenderDraftPanel) werden wiederverwendet und im Stepper-Pattern in SanierungTab eingebettet.

### Keine DB-Aenderungen noetig
Die `service_cases`-Tabelle hat bereits alles was gebraucht wird. Kategorie wird einfach als 'sonstige' angelegt und kann spaeter ueberschrieben werden.

### Umsetzung in 1 Nachricht
Alle 3 Dateien werden parallel angepasst — schlanke, fokussierte Aenderungen ohne neue Abhaengigkeiten.
