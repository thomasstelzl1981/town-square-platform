
# Magic Intake Center — Komplettanalyse und Verbesserungsplan

## Ist-Zustand: Was haben wir?

Die aktuelle Seite `/portal/dms/intake` besteht aus 5 Bloecken:

1. **Page Header** — Titel + einzeiliger Untertitel
2. **IntakeHowItWorks** — 3 Karten (Kategorie waehlen, Upload, KI analysiert)
3. **IntakeEntityPicker + IntakeUploadZone** — 2-Step-Selektion + Dropzone
4. **IntakeChecklistGrid** — Statische Liste benoetigter Dokumente (immer 0%)
5. **IntakeRecentActivity** — Letzte 5 Uploads aus `documents`

## Identifizierte Schwachstellen

### 1. Seite wirkt "zu komprimiert" — kein Storytelling
- Der Header ist ein einzeiliger Satz. Es fehlt eine visuelle Hero-Section, die dem Nutzer sofort vermittelt: "Das ist ein Premium-Feature, das dir Arbeit abnimmt."
- IntakeHowItWorks zeigt 3 generische Schritte ohne emotionalen Kontext (kein Zeitersparnis-Versprechen, keine Kosteninfo).

### 2. Datenraum-Auslese fehlt komplett
- Die `StorageExtractionCard` (Datenraum fuer Armstrong aktivieren) existiert bereits als Komponente und wird im Posteingang und in den Einstellungen genutzt — aber NICHT im Magic Intake Center.
- Das ist der wichtigste Automatisierungs-Hebel: Der Kunde aktiviert einmalig die Datenraum-Extraktion, und Armstrong kann danach ALLE Dokumente lesen, ohne manuellen Upload.

### 3. Kosten/Credit-Transparenz fehlt
- Nirgends auf der Intake-Seite wird erklaert, was der Service kostet (Credits pro Dokument, Preis pro Credit).
- Die StorageExtractionCard hat einen Kostenvoranschlag-Flow — dieser muss prominent in die Seite integriert werden.

### 4. ChecklistGrid zeigt immer 0% — kein Live-Fortschritt
- `IntakeChecklistGrid` zeigt statisch `0 von X vorhanden` ohne je die DB zu pruefen.
- Es fehlt ein Query gegen `documents` + `document_links` um zu zaehlen, welche Dokument-Typen bereits vorhanden sind.

### 5. Kein Multi-File-Upload
- Die Dropzone akzeptiert `maxFiles: 1`. Fuer ein "Magic Intake" das Arbeit abnehmen soll, sollte Batch-Upload moeglich sein.

### 6. Keine Verbindung zwischen Upload und Checkliste
- Wenn ein Dokument hochgeladen wird, aktualisiert sich die Checkliste nicht automatisch.

### 7. MagicIntakeCard (Finanzierung) ist isoliert
- `src/components/finanzierung/MagicIntakeCard.tsx` erstellt eine Finanzierungsakte, aber nutzt nicht die IntakeTab-Pipeline. Es ist ein separater Flow.

---

## Verbesserungsplan (7 Massnahmen)

### Massnahme 1: Hero-Section mit Value Proposition ersetzen
**Was**: Den komprimierten Header + IntakeHowItWorks durch eine grosszuegige Hero-Section ersetzen.

**Neue Struktur**:
- Grosse Ueberschrift: "Magic Intake Center"
- Untertitel mit konkretem Nutzenversprechen (Zeitersparnis)
- 3 Value-Proposition-Karten (aehnlich wie in StorageExtractionCard):
  - "Kein manuelles Abtippen" — KI liest und befuellt
  - "Alle Kategorien" — Immobilie, Fahrzeug, PV, Versicherung, etc.
  - "Volle Kostenkontrolle" — Sie sehen vorher, was es kostet
- Darunter: visueller Prozess-Flow als horizontale Schrittleiste (nicht 3 separate Karten)

### Massnahme 2: StorageExtractionCard in IntakeTab einbetten
**Was**: Die bestehende `StorageExtractionCard` als Block 2 in die IntakeTab-Seite einbauen — zwischen Hero und manuellem Upload.

**Warum**: Das ist der "Autopilot"-Modus. Nutzer sollen zuerst sehen: "Sie koennen den gesamten Datenraum auf einmal aktivieren" — und nur wenn sie einzelne Dokumente manuell hochladen wollen, scrollen sie weiter.

**Aenderung**:
- `IntakeTab.tsx`: Import und Einbettung von `StorageExtractionCard` mit `tenantId` aus `useAuth()`
- Ueberschrift: "Automatische Datenraum-Auslese" als Section-Header

### Massnahme 3: Credit/Kosten-Info-Block hinzufuegen
**Was**: Neuer Block `IntakePricingInfo` der transparent erklaert:
- 1 Credit = 1 Dokument-Analyse
- Preis pro Credit (z.B. 0,25 EUR)
- Beispielrechnung: "20 Dokumente = 5,00 EUR"
- Link zum Credit-Guthaben

**Platzierung**: Zwischen StorageExtractionCard und manuellem Upload-Bereich.

### Massnahme 4: IntakeChecklistGrid mit Live-Fortschritt
**Was**: Die Checkliste soll den tatsaechlichen Stand aus der Datenbank laden.

**Implementierung**:
- Neuer Hook `useIntakeChecklistProgress` der fuer jede required_doc-Kategorie in `storageManifest` prueft, ob ein passender `documents`-Eintrag existiert (ueber `document_links` + `storage_nodes`)
- Fortschrittsbalken und Check-Icons werden dynamisch aktualisiert
- Bereits vorhandene Dokumente bekommen ein gruenes Haekchen statt grauem Kreis

### Massnahme 5: Multi-File-Upload ermoeglichen
**Was**: `IntakeUploadZone` auf `maxFiles: 10` erweitern mit einer Dateiliste und Fortschrittsanzeige pro Datei.

**Implementierung**:
- Dropzone: `maxFiles: 10`
- Dateiliste unterhalb der Dropzone mit individuellem Status (uploading/parsing/done/error)
- Sequenzielle Verarbeitung ueber die bestehende `intake()`-Pipeline

### Massnahme 6: Seitenlayout aufloesen — mehr Weissraum
**Was**: Die Seite grosszuegiger gestalten mit klaren visuellen Trennern zwischen den Bloecken.

**Neue Block-Reihenfolge**:
1. Hero-Section (Value Proposition + Prozess-Flow)
2. Datenraum-Auslese (StorageExtractionCard) — der Autopilot-Weg
3. Credit-Info (IntakePricingInfo) — Kostentransparenz
4. Manueller Upload (EntityPicker + UploadZone) — der manuelle Weg
5. Dokument-Checkliste (mit Live-Fortschritt) — was fehlt noch?
6. Letzte Aktivitaet (IntakeRecentActivity)

### Massnahme 7: Verbindung zwischen Upload-Erfolg und Checkliste
**Was**: Nach erfolgreichem Upload (`intakeProgress.step === 'done'`) die Checkliste automatisch refreshen.

**Implementierung**:
- IntakeTab haelt einen `refreshKey`-State
- Nach Upload-Erfolg wird `refreshKey` inkrementiert
- IntakeChecklistGrid bekommt `refreshKey` als Prop und re-fetcht bei Aenderung

---

## Technische Details

### Dateien die geaendert werden

| Datei | Aenderung |
|---|---|
| `src/pages/portal/dms/IntakeTab.tsx` | Neue Block-Reihenfolge, StorageExtractionCard einbetten, refreshKey-State |
| `src/components/dms/IntakeHowItWorks.tsx` | Komplett ueberarbeiten: Hero-Section mit Value Props + Prozess-Schrittleiste |
| `src/components/dms/IntakeUploadZone.tsx` | Multi-File-Support (maxFiles: 10), Dateiliste mit Status |
| `src/components/dms/IntakeChecklistGrid.tsx` | Live-Fortschritt via neuem Hook, refreshKey-Prop |

### Neue Dateien

| Datei | Inhalt |
|---|---|
| `src/components/dms/IntakePricingInfo.tsx` | Credit-Kosten-Erklaerung mit Beispielrechnung |
| `src/hooks/useIntakeChecklistProgress.ts` | DB-Query fuer vorhandene Dokumente pro required_doc-Typ |

### Keine Aenderungen an

- Routing, Manifests, Datenbank-Schema
- `useDocumentIntake.ts` (Pipeline bleibt unveraendert)
- `StorageExtractionCard.tsx` (wird nur eingebettet, nicht geaendert)
- `MagicIntakeCard.tsx` (Finanzierung) — bleibt separater Flow fuer MOD-07
