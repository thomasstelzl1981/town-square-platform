

# Redesign Widget-Kacheln MOD-18 Finanzanalyse

## Ziel

Alle Kacheln in MOD-18 werden auf das standardisierte Widget-Kachel-System (`WidgetGrid` + `WidgetCell`, 4-Spalten, quadratisch) umgestellt — identisch mit dem PV-Anlagen-Tab (Screenshot-Referenz). Personenkarten wechseln vom quadratischen `RecordCard`-Format auf das horizontale `ManagerVisitenkarte`-Design.

---

## Ist-Zustand vs. Soll-Zustand

```text
KOMPONENTE              IST (RecordCard)              SOLL (Widget CE)
+---------------------+---------------------------+--------------------------+
| Grid-Layout         | RECORD_CARD.GRID          | WidgetGrid (4-col)       |
|                     | 2 Spalten, gap-6          | 4 Spalten, aspect-square |
+---------------------+---------------------------+--------------------------+
| Entity-Kacheln      | RecordCard (closed)       | WidgetCell + Card        |
| (Konten, Vers.,     | aspect-square, 2-col      | aspect-square, 4-col     |
|  Vorsorge, Abos)    |                           | wie PV-Anlagen           |
+---------------------+---------------------------+--------------------------+
| Personen-Kacheln    | RecordCard (closed)       | ManagerVisitenkarte      |
| (Uebersicht,        | Quadratisch, Avatar       | Horizontal, Business-    |
|  Investment, PV)    |                           | Card mit Gradient        |
+---------------------+---------------------------+--------------------------+
| CTA "Hinzufuegen"   | RECORD_CARD.CLOSED        | WidgetCell + dashed Card |
|                     | 2-col Grid                | 4-col Grid, zentriert    |
+---------------------+---------------------------+--------------------------+
| Open State          | RECORD_CARD.OPEN          | Inline unterhalb Grid    |
|                     | col-span-2                | Volle Breite (wie PV)    |
+---------------------+---------------------------+--------------------------+
```

---

## Betroffene Dateien (7 Tabs)

### 1. UebersichtTab.tsx (Personen + Konten)

**Block A — Personen im Haushalt:**
- `RECORD_CARD.GRID` ersetzen durch horizontale Liste
- Jede Person wird als `ManagerVisitenkarte`-aehnliche Card dargestellt (nicht quadratisch)
- Gradient-Farbe: Primary Blue fuer Hauptperson, Neutral fuer andere
- Zeigt: Name, Rolle, Geburtsdatum, E-Mail, Telefon als kompakte Visitenkarte
- Klick oeffnet weiterhin den Inline-Bearbeitungsmodus (unterhalb, volle Breite)

**Block B — Konten:**
- `WidgetGrid` bereits vorhanden — keine Aenderung am Grid noetig
- Kacheln bereits im WidgetCell-Format — nur kleinere Angleichung an PV-Stil (Badges oben, KPIs unten)

### 2. InvestmentTab.tsx (Personen-Auswahl)

- `RECORD_CARD.GRID` mit `RecordCard` ersetzen durch horizontale Visitenkarten-Leiste
- Jede Person als kompakte Visitenkarte im `ManagerVisitenkarte`-Stil
- Aktive Person bekommt `ring-2 ring-primary` Highlight
- Depot-Status ("Aktiv" / "Kein Depot") als Badge in der Visitenkarte

### 3. SachversicherungenTab.tsx (Versicherungen)

- `RECORD_CARD.GRID` ersetzen durch `WidgetGrid`
- Jede Versicherung als `WidgetCell` + `Card` im PV-Anlagen-Stil:
  - Oben: Badges (Kategorie, Status)
  - Mitte: Titel (Versicherer — Kategorie), Policen-Nr.
  - Unten: KPI-Zeilen (Beitrag, Beginn)
- CTA "Versicherung hinzufuegen" als `WidgetCell` mit dashed Border
- Open State: Inline unterhalb des Grids (volle Breite, nicht col-span-2)

### 4. VorsorgeTab.tsx (Vorsorgevertraege)

- Gleiche Umstellung wie SachversicherungenTab:
  - `RECORD_CARD.GRID` wird zu `WidgetGrid`
  - Jeder Vertrag als `WidgetCell` + `Card`
  - KPI-Zeilen: Beitrag, Person, Vertragsart
  - CTA + Open State analog

### 5. KrankenversicherungTab.tsx (KV)

- `RECORD_CARD.GRID` ersetzen durch `WidgetGrid`
- Jede KV-Karte als `WidgetCell` + `Card`
- Oben: Badges (DEMO, PKV/GKV)
- Mitte: Personenname, Versicherer
- Unten: Monatsbeitrag
- Open State: Inline unterhalb

### 6. AbonnementsTab.tsx (Abos)

- `RECORD_CARD.GRID` ersetzen durch `WidgetGrid`
- Jedes Abo als `WidgetCell` + `Card`
- Oben: Status-Badge
- Mitte: Abo-Name, Kategorie
- Unten: Betrag / Frequenz
- CTA + Open State analog

### 7. VorsorgedokumenteTab.tsx (Vorsorge und Testament)

- Personen-RecordCards (Sektion 1) werden zu horizontalen Visitenkarten
- Testament-Vorlagen nutzen bereits `WidgetGrid` + `WidgetCell` — keine Aenderung noetig

---

## Visitenkarten-Design fuer Personen

Abgeleitet von `ManagerVisitenkarte`, aber angepasst fuer Haushaltsmitglieder:

```text
+----------------------------------------------------------+
| [==== Gradient-Leiste (2px) ============================] |
| [Avatar]  Max Mustermann                    [Bearbeiten] |
|           HAUPTPERSON                                     |
|           max@email.de                                    |
|           +49 123 456 789                                 |
|           Musterstr. 1, 80333 Muenchen                    |
|           [Hauptperson] [Depot aktiv]                     |
+----------------------------------------------------------+
```

- Gradient: Primary Blue fuer Hauptperson, Slate fuer Partner, Amber fuer Kinder
- Nicht quadratisch, sondern horizontal (volle Grid-Breite oder 1/2)
- Responsive: Auf Mobile wird die Karte einzeilig gestapelt

---

## Technische Details

### Imports-Aenderungen in allen 7 Dateien:
- Entfernen: `RecordCard`, `RECORD_CARD` (wo Entity-Widgets betroffen)
- Hinzufuegen: `WidgetGrid`, `WidgetCell`, `Card`, `CardContent`
- Fuer Personen: Neues `PersonVisitenkarte`-Pattern (inline oder als shared Component)

### Neues Shared Component (optional):
- `PersonVisitenkarte` — Spezialisierung der ManagerVisitenkarte fuer Haushaltsmitglieder
- Props: person, isSelected, onClick, badges, gradient
- Wiederverwendbar in UebersichtTab, InvestmentTab, VorsorgedokumenteTab

### Open-State-Pattern:
- Statt `RECORD_CARD.OPEN` mit `col-span-2` im Grid:
- Inline-Sektion UNTERHALB des `WidgetGrid` (wie PV-Anlagen: `viewMode === 'detail'`)
- Mit "Schliessen"-Button oben rechts
- Alle Formularfelder bleiben identisch — nur das Layout-Wrapping aendert sich

### Kachel-Inhalt (PV-Stil):
```text
+---------------------------+
| [Badge: Kategorie] [Aktiv]|
|                           |
| Versicherer — Haftpflicht |
| Policen-Nr. 12345         |
|                           |
| Beitrag      45,00 EUR/Mo |
| Beginn       01.01.2024   |
+---------------------------+
```

---

## Nicht betroffen

- `WidgetGrid` und `WidgetCell` Shared Components bleiben unveraendert
- `RecordCard` Komponente selbst bleibt bestehen (wird weiterhin in anderen Modulen genutzt)
- `designManifest.ts` bleibt unveraendert
- Daten-Layer (Queries, Mutations, Supabase) bleiben komplett unveraendert
- Demo-Daten-Engine bleibt unveraendert

