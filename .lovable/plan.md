

# MOD-12 Mandate-Seite: Vollstaendiger Workflow nach FM-Vorbild

## Problem

Die aktuelle Mandate-Seite zeigt nur ein simples Formular (Name, Region, Asset-Fokus, Preis). Der eigentliche Akquise-Workflow (KI-Erfassung, Ankaufsprofil, Kontaktrecherche, E-Mail-Versand, Objekteingang) ist versteckt in der Detail-Ansicht (`AkquiseMandateDetail.tsx`) und erst nach manueller Mandats-Erstellung sichtbar. Das widerspricht dem FM-Muster, wo der gesamte Flow von oben nach unten auf einer Seite durchlaufen wird.

## Loesung: Mandate-Seite als durchlaufender Workflow

Die Mandate-Seite wird — wie die Finanzierungsakte im FM — zu einer langen, kontinuierlichen Seite umgebaut. Der Nutzer arbeitet sich von oben nach unten durch alle Phasen. Das Mandat wird erst an einem logischen Punkt (nach der Profil-Generierung) tatsaechlich in der Datenbank angelegt und erhaelt dann seine ID.

```text
/portal/akquise-manager/mandate
+=========================================+
| Sektion A: Meine Mandate (Widgets)      |
| [ACQ-0012] [ACQ-0013] oder Placeholder  |
+-----------------------------------------+
|                                         |
| NEUES MANDAT — Workflow                 |
|                                         |
| 1. KI-gestuetzte Erfassung              |
|    [Freitext-Textarea]                  |
|    "Was sucht Ihr Mandant?"             |
|    → KI analysiert und extrahiert       |
|                                         |
| 2. Ankaufsprofil generieren             |
|    [Generiertes Profil anzeigen]        |
|    Asset-Fokus, Region, Preis, Rendite  |
|    Editierbar — Feinjustierung          |
|                                         |
|    >>> MANDAT ERSTELLEN BUTTON <<<      |
|    (Hier wird die ID vergeben)          |
|                                         |
| — Ab hier: mandateId vorhanden —        |
|                                         |
| 3. Kontaktrecherche (SourcingTab)       |
|    Apollo, Apify, Firecrawl, Manuell    |
|                                         |
| 4. E-Mail-Versand (OutreachTab)         |
|    Queue, Templates, Massenversand      |
|                                         |
| 5. Objekteingang (InboundTab)           |
|    Eingegangene Angebote                |
|                                         |
| 6. Analyse & Kalkulation (AnalysisTab)  |
|    Bestand/Aufteiler                    |
|                                         |
| 7. Delivery (DeliveryTab)               |
|    Praesentation an Mandanten           |
+=========================================+
```

## Aenderungen im Detail

### 1. AkquiseMandate.tsx — Kompletter Umbau

**Sektion A: Meine Mandate** (bleibt wie bisher)
- WidgetGrid mit MandateCaseCards
- Klick oeffnet Detail-Ansicht
- Placeholder wenn leer

**Sektion B: Neues Mandat — Durchlaufender Workflow**

**Phase 1 — KI-gestuetzte Erfassung:**
- Grosse Textarea: "Beschreiben Sie, was Ihr Mandant sucht"
- Beispiel-Platzhalter: "Family Office sucht MFH in Rhein-Main, 2-5 Mio, min. 4% Rendite, kein Denkmalschutz"
- Button "Ankaufsprofil generieren" → ruft KI auf (Armstrong/Gemini)
- Die KI extrahiert strukturierte Daten: Kontaktname, Region, Asset-Fokus, Preisspanne, Rendite, Ausschluesse

**Phase 2 — Ankaufsprofil aufbereiten:**
- Generiertes Profil als editierbare Card anzeigen (vorausgefuellt aus KI-Ergebnis)
- Felder: Kontaktname, Region, Asset-Fokus (Checkboxen), Preis min/max, Zielrendite, Ausschluesse, Notizen
- Der Nutzer kann korrigieren und ergaenzen
- **"Mandat erstellen"**-Button am Ende dieser Sektion
- Erst hier: `useCreateAcqMandate()` wird aufgerufen, DB-ID + Public-ID (ACQ-XXXX) vergeben
- Das Widget erscheint sofort oben in Sektion A

**Phase 3-7 — Operative Workflow-Sektionen (nach Mandats-Erstellung):**
- Werden erst sichtbar/aktiv, nachdem das Mandat erstellt wurde
- Nutzen die bestehenden Komponenten mit der neuen mandateId:
  - Schritt 3: `<SourcingTab mandateId={id} />`
  - Schritt 4: `<OutreachTab mandateId={id} />`
  - Schritt 5: `<InboundTab mandateId={id} />`
  - Schritt 6: `<AnalysisTab mandateId={id} />`
  - Schritt 7: `<DeliveryTab mandateId={id} />`
- Getrennt durch `<Separator />` und nummerierte `SectionHeader` (wie in MandateDetail)

### 2. Mandate-Switcher im Workflow

Wenn ein Mandat erstellt wurde, erscheint oben ein Dropdown/Select um zwischen Mandaten zu wechseln. Beim Wechsel laden die Workflow-Sektionen die Daten des gewaehlten Mandats. So kann der Manager auf einer Seite bleiben und zwischen seinen Mandaten navigieren — wie beim Objekteingang, wo man alle Eingaenge sieht oder nach Mandat filtern kann.

### 3. AkquiseMandateDetail.tsx — Vereinfachung

Die Detail-Seite bleibt als Fallback bestehen (fuer direkte Links, Dashboard-Klicks), aber der primaere Arbeitsplatz wird die Mandate-Seite. Langfristig koennte die Detail-Seite auf `/mandate?id=XYZ` redirecten.

## Technische Details

### KI-Freitext-Analyse
- Neuer Edge Function Call oder Armstrong-Action
- Input: Freitext-Beschreibung
- Output: Strukturiertes JSON (client_name, region, asset_focus[], price_min, price_max, yield_target, exclusions)
- Fallback: Wenn KI nicht verfuegbar, bleibt das manuelle Formular aktiv

### State-Management
- `activeMandate` State: null (neues Mandat) oder bestehende mandateId
- Phase-Tracking: `workflowPhase: 'capture' | 'profile' | 'active'`
- Nach Erstellung: workflowPhase wechselt zu 'active', alle Tabs werden sichtbar

### Bestehende Komponenten wiederverwendet
- `SourcingTab`, `OutreachTab`, `InboundTab`, `AnalysisTab`, `DeliveryTab` — unveraendert
- `SectionHeader` — aus MandateDetail extrahieren in shared Component
- `MandateCaseCard` — fuer die Widget-Darstellung oben
- `AkquiseStepper` — optional als Fortschrittsanzeige

### Dateien die geaendert/erstellt werden
1. **REWRITE:** `src/pages/portal/akquise-manager/AkquiseMandate.tsx` (kompletter Workflow)
2. **NEU:** Shared `SectionHeader` Komponente (aus MandateDetail extrahiert)
3. **MINIMAL EDIT:** `AkquiseMandateDetail.tsx` (SectionHeader-Import anpassen)
4. **Optional:** Edge Function fuer KI-Freitext-Analyse des Ankaufsprofils

