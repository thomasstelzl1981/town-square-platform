

# Akquise-Mandat: 4-Kachel-Workflow + Separater Workbench-Reiter

## Uebersicht

Der Workflow wird auf **zwei separate Ansichten** aufgeteilt:

1. **Mandate-Seite** (`AkquiseMandate.tsx`): Erfassung, Profil, Kontaktrecherche, E-Mail-Versand (4-Kachel-Grid + Zwischen-Sektionen)
2. **Mandat-Workbench** (`AkquiseMandateDetail.tsx`): Objekteingang, Analyse, Delivery — mit Mandat-Widgets oben zum Wechseln

---

## Ansicht 1: Mandate-Seite (AkquiseMandate.tsx) — Kompletter Umbau

### Kunden-Zeile (oberhalb Kachel 1+2)

Eingabefeld fuer Kundenname (Vorname/Nachname) ODER "Aus Kontaktbuch waehlen"-Button. Gewaehlter/eingegebener Name fliesst in die KI-Extraction und das Ankaufsprofil ein.

### Kachel 1+2: 2-Spalten-Grid (DESIGN.FORM_GRID.FULL)

**Kachel 1 (links) — KI-Erfassung (INPUT):**
- Freitext-Textarea (bleibt wie bisher)
- Optionale Steuerfelder darunter: Preisspanne, Region, Asset-Fokus, Zielrendite, Ausschluesse
- Diese Felder sind Steuerparameter, die die KI beruecksichtigt
- Button "Ankaufsprofil generieren"

**Kachel 2 (rechts) — Ankaufsprofil (OUTPUT):**
- **Kompletter Umbau**: Aktuell ist hier ein Eingabeformular — wird ersetzt durch ein **Anzeige-Dokument**
- Vor Generierung: Grauer Platzhalter ("Profil wird nach KI-Analyse hier angezeigt")
- Nach Generierung: Strukturierte Darstellung als Read-Only-Dokument:
  - Firmenname/Kontakt
  - Suchgebiet
  - Asset-Fokus
  - Investitionsrahmen (Preisspanne)
  - Renditeerwartung
  - Ausschlusskriterien
  - Freitext-Zusammenfassung (dieses Feld bleibt **editierbar** als Textarea)
- Alle Eingabefelder, Checkboxen und Formular-Elemente werden aus dieser Kachel **entfernt** — die Daten kommen ausschliesslich aus der KI-Extraction (Kachel 1) + Kunden-Zeile

### PDF-Vorschau-Sektion (Vollbreite, zwischen Kachel-Paar 1 und Kachel-Paar 2)

- Vollbreiten-Card mit DIN-A4-Vorschau des Ankaufsprofils im hochwertigen CI-Design
- Nutzt `jsPDF` (bereits installiert) fuer PDF-Generierung
- Buttons: "Als PDF exportieren" und "Drucken"
- Zeigt das Profil als gestaltetes Dokument (Logo, Firmendaten, strukturierte Tabelle)

### "Ankaufsprofil anlegen" Button

- Erstellt das Mandat in der Datenbank (Mandat-ID: ACQ-XXXX)
- Erstellt den Datenraum
- Aktiviert die unteren Sektionen (Kachel 3+4)
- Speichert das PDF

### Kachel 3+4: 2-Spalten-Grid (DESIGN.FORM_GRID.FULL)

Beide Kacheln sind initial ausgegraut (opacity-40, pointer-events-none) bis ein Mandat erstellt wurde.

**Kachel 3 (links) — Kontaktrecherche:**
- Die bestehende `SourcingTab`-Logik wird inline integriert (kompaktere Darstellung)
- Kompakte Kontaktliste mit Checkboxen zum Auswaehlen
- Buttons: Apollo, Apify/Portal-Scraper, Manuell (oeffnen weiterhin ihre Dialoge)
- Die separaten Stats-Cards (4 Stueck) werden entfernt — Zaehler stattdessen als kleine Badges im Card-Header
- Ausgewaehlte Kontakte (checked) werden automatisch als Empfaenger in Kachel 4 uebernommen

**Kachel 4 (rechts) — E-Mail-Fenster (INLINE, kein Dialog):**
- Die bestehende `OutreachTab`-Logik wird inline integriert
- Statt Dialog: Ein echtes E-Mail-Compose-Fenster direkt in der Kachel:
  - **An:** Chips/Badges der in Kachel 3 ausgewaehlten Kontakte
  - **Betreff:** Input, vorbefuellt mit Mandatscode
  - **Body:** Textarea, editierbar, vorbefuellt mit Anschreiben-Template
  - **Anhang:** Automatisch das Ankaufsprofil-PDF (Anzeige als Chip mit Dateiname)
  - **[Senden]** Button — nutzt bestehende `useSendOutreach` / `sot-acq-outbound` Edge Function
- Darunter: Kompakte Liste der zuletzt gesendeten E-Mails mit Status-Badges

### Dokumentations-Sektion (Vollbreite, unter Kachel 3+4)

- Vollbreiten-Card mit der kompletten E-Mail-Versandhistorie
- Nutzt die bestehende `useAcqOutboundMessages`-Query
- Tabelle mit Spalten: Empfaenger, Betreff, Gesendet am, Status (Badge)

---

## Ansicht 2: Mandat-Workbench (AkquiseMandateDetail.tsx) — Anpassung

Diese Seite existiert bereits unter `/portal/akquise-manager/mandate/:mandateId`. Die aktuelle Seite hat bereits Sektionen 1-7 alle auf einer Seite. **Aenderungen:**

### Oben: Mandat-Widgets zum Switchen

- `WidgetGrid` mit `MandateCaseCard`-Widgets aller aktiven Mandate
- Klick auf eine Karte laedt das entsprechende Mandat in die Detail-Ansicht
- Aktives Mandat ist visuell hervorgehoben (Border-Highlight)

### Sektionen (nur 5-7, da 1-4 auf der Mandate-Seite leben)

**Sektion 5 — Objekteingang:**
- Bleibt wie bisher (`InboundTab`)

**Sektion 6 — Analyse & Kalkulation (Bestand + Aufteiler nebeneinander):**
- Bereits umgebaut: `AnalysisTab` zeigt `BestandCalculation` und `AufteilerCalculation` im `DESIGN.FORM_GRID.FULL` nebeneinander
- GeoMap und KI-Analyse als Full-Width-Cards darunter

**Sektion 7 — Delivery:**
- Bleibt wie bisher (`DeliveryTab`)

---

## Datenfluss

```text
Ansicht 1: Mandate-Seite
=========================
Kunden-Zeile (Name / Kontaktbuch)
    |
    v
Kachel 1 (Freitext + Steuerfelder)
    |  KI-Extraction (sot-acq-profile-extract)
    v
Kachel 2 (Ankaufsprofil — Ausgabe, editierbar)
    |  jsPDF
    v
PDF-Vorschau (DIN A4, CI-konform)
    |  "Ankaufsprofil anlegen" → Mandat-ID + Datenraum
    v
Kachel 3 (Kontaktrecherche) → Kachel 4 (E-Mail-Compose + PDF-Anhang)
    |
    v
Dokumentation (E-Mail-Versand-Liste)

=== Navigation zum Mandat ===

Ansicht 2: Mandat-Workbench (/mandate/:mandateId)
==================================================
Mandat-Widgets (Switcher)
    |
    v
5. Objekteingang → 6. Analyse (Bestand | Aufteiler) → 7. Delivery
```

---

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| `AkquiseMandate.tsx` | Kompletter Umbau: Kunden-Zeile, 4-Kachel-Grid, PDF-Vorschau, Doku-Sektion. Sektionen 5-7 entfernen. |
| `AkquiseMandateDetail.tsx` | Mandat-Widgets oben zum Switchen. Sektionen 1-4 entfernen, nur 5-7 behalten. |
| `SourcingTab.tsx` | Sub-Komponenten und Dialoge bleiben — Kachel 3 nutzt die Logik inline |
| `OutreachTab.tsx` | Hooks und Templates bleiben — Kachel 4 nutzt die Logik inline |
| `AnalysisTab.tsx` | Keine Aenderung (bereits umgebaut: Bestand+Aufteiler nebeneinander) |

---

## Offene Punkte (bewusst offen gelassen)

- **Kontaktbuch in Zone 1**: Wird als separates Feature geplant. Kachel 3 nutzt vorerst `acq_contact_staging` und Apollo/Apify.
- **Recherche-Engine (Apollo/Apify-Strategie)**: Bleibt wie implementiert, wird spaeter optimiert.
- **PDF CI-Design**: Grundlage wird mit jsPDF gelegt; finales Corporate Design wird iterativ verfeinert.

