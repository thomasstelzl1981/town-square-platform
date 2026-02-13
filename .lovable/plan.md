

# Sanierung-Akte: Homogenes Inline-Layout mit CI-Kontrolle

## Analyse des Ist-Zustands

Die Sanierungsakte hat aktuell folgende Probleme:

1. **"Neue Sanierung" (ServiceCaseCreateInline)** oeffnet ein voellig anderes Layout als eine bestehende Akte (SanierungDetailInline) — nicht homogen
2. **SanierungDetail** nutzt eigene SectionHeader-Nummern (1-4) mit Separators — nicht CI-konform (SectionCard existiert als Standard)
3. **ScopeDefinitionPanel** hat redundanten Header ("Leistungsumfang definieren" + Adresse), obwohl der uebergeordnete Detail-Header bereits alles zeigt
4. **ScopeDefinitionPanel** hat eine "Zurueck zu Grunddaten"-Schaltflaeche, die konzeptionell keinen Sinn ergibt (es gibt keine separate "Grunddaten"-Seite)
5. **Kein 2-Spalten-Layout** — Leistungsverzeichnis-Eingabe und Kostenschaetzung sind untereinander statt nebeneinander
6. **Dienstleister-Suche** hat 3 separate Cards (Suche, Manuell, Ausgewaehlte) — verschwendet vertikalen Platz
7. **Ausschreibung** und **Angebotsvergleich** sind einzelne volle Breite — koennten als Side-by-Side zusammenstehen

## Neue Struktur

### Prinzip: Einheitlicher Flow fuer "Neu" und "Bearbeiten"

Klick auf "Neue Sanierung" oder eine bestehende Akte oeffnet **dasselbe** Inline-Layout unter den Widgets.

```text
+---------------------------------------------+
| [+ Neue]  [Fall A]  [Fall B]  [Fall C]      |  Widgets (immer sichtbar)
+---------------------------------------------+

Akte (inline):
+---------------------------------------------+
| Header: Titel + Status + Tender-ID          |
| Stepper: 1 — 2 — 3 — 4                     |
+---------------------------------------------+
|                                             |
| Abschnitt 1: Leistungsumfang               |
| +---------------------+-------------------+ |
| | Beschreibung &      | Kostenschaetzung  | |
| | LV-Generator (KI)   | (3-Spalten:       | |
| |                      | Min/Mittel/Max)   | |
| +---------------------+-------------------+ |
| | Leistungsverzeichnis (volle Breite)      | |
| +------------------------------------------+ |
|                                             |
| Abschnitt 2: Dienstleister & Ausschreibung |
| +---------------------+-------------------+ |
| | Dienstleister-Suche | Ausschreibung/    | |
| | + Ausgewaehlte      | E-Mail-Vorschau   | |
| +---------------------+-------------------+ |
|                                             |
| Abschnitt 3: Angebote & Vergabe            |
| +------------------------------------------+ |
| | Angebotsvergleich (volle Breite)         | |
| +------------------------------------------+ |
+---------------------------------------------+
```

## Aenderungen

### 1. `src/pages/portal/immobilien/SanierungTab.tsx` — Vereinheitlichung

- Klick auf "Neue Sanierung" erstellt sofort einen neuen Case (Status `draft`) und setzt `selectedCaseId` auf die neue ID
- Kein separates `ServiceCaseCreateInline` mehr — die Akte oeffnet sich sofort im selben Layout
- Entfernen des `showCreateForm`-States

### 2. `src/components/sanierung/SanierungDetail.tsx` — Komplettes Redesign

**Header**: Kompakter, CI-konformer Header mit Schliessen-Button (X statt Pfeil-zurueck)

**Stepper**: Bleibt, aber ohne umgebende `space-y-6` — integriert in den Header-Bereich

**Abschnitt 1 — Leistungsumfang** (SectionCard):
- 2-Spalten-Layout (FORM_GRID): Links Beschreibung + KI-Generator, Rechts Kostenschaetzung
- Darunter volle Breite: Leistungsverzeichnis-Tabelle
- ScopeDefinitionPanel entkernen: Redundanten Header, "Zurueck"-Button und "Weiter zu Dienstleister"-Navigation entfernen
- "Beschreibung fuer Ausschreibung" wandert als Unter-Abschnitt hinter das LV

**Abschnitt 2 — Dienstleister & Ausschreibung** (SectionCard):
- 2-Spalten-Layout: Links Dienstleister-Suche (Suche + Ausgewaehlte zusammengefasst in einer Card), Rechts E-Mail-Vorschau (TenderDraftPanel)
- "Manuell hinzufuegen" wird als kompakte Zeile unter der Suchliste eingebettet, nicht als eigene Card

**Abschnitt 3 — Angebote & Vergabe** (SectionCard):
- Volle Breite, bleibt im Wesentlichen gleich
- Header-Card und Vergabe-Card zusammenfassen — weniger Cards, mehr Inhalt

**CI-Kontrolle**:
- Alle Sektions-Ueberschriften nutzen `SectionCard` statt eigene SectionHeader-Nummerierung
- Cards nutzen `DESIGN.CARD.CONTENT` / `DESIGN.CARD.SECTION`
- Keine ad-hoc `<Separator />` zwischen Sektionen — Spacing erfolgt ueber `SPACING.SECTION`
- Tabellen-Wrapper nutzen `TABLE.WRAPPER`

### 3. `src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx` — Verschlankung

- Eigenen Header entfernen (Titel + Adresse sind bereits im Detail-Header)
- `onBack`/`onNext` Props entfernen — keine Navigation mehr
- Footer-Aktionsleiste ("Zurueck zu Grunddaten" / "Weiter zu Dienstleister") entfernen
- "Weitere Optionen" Collapsible bleibt als optionaler Bereich
- Speichern-Button wird in den Detail-Header integriert

### 4. `src/components/portal/immobilien/sanierung/tender/ProviderSearchPanel.tsx` — Kompaktierung

- Suche und Ausgewaehlte in einer zusammenhaengenden Card zusammenfassen
- "Manuell hinzufuegen" als Inline-Toggle statt separate Card

### 5. `src/components/portal/immobilien/sanierung/ServiceCaseCreateInline.tsx` — Entfaellt

- Datei wird nicht mehr importiert und kann perspektivisch entfernt werden
- Stattdessen: Klick auf "Neue Sanierung" erstellt via `useCreateServiceCase` direkt einen Draft-Case
- Ein leeres Objekt-Auswahl-Modal oder Inline-Dropdown erscheint nur kurz, um Property auszuwaehlen, dann oeffnet sich sofort die leere Akte

### 6. Keine Datenbank-Aenderungen

Rein visuelles Refactoring, keine Schema- oder RLS-Aenderungen.

## Entfernte / vereinfachte Elemente

| Vorher | Nachher |
|--------|---------|
| Separate SectionHeader mit Nummern (1-4) | SectionCard mit Icon und Titel |
| 4 Separators zwischen Sektionen | SPACING.SECTION |
| ScopeDefinitionPanel: eigener Header + Footer | Entkernt, nur Inhalt |
| 3 Cards fuer Dienstleister (Suche/Manuell/Ausgewaehlte) | 1 zusammengefasste Card |
| ServiceCaseCreateInline als eigene Komponente | Direkte Case-Erstellung + identisches Akte-Layout |
| Alles untereinander (1-spaltig) | 2-Spalten wo sinnvoll (Scope+Kosten, Dienstleister+Ausschreibung) |

