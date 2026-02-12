
# Neue Kachel: "Finanzierungsfall generieren" + PDF-Vorschau + Datenraum

## Uebersicht

Am Ende der Finanzierungsakte (FMFinanzierungsakte.tsx) wird eine neue Kachel eingefuegt, die den Uebergang vom "Formularentwurf" zum "echten Fall" darstellt. Der Manager klickt einen Button, daraufhin wird ein `finance_request`-Datensatz in der Datenbank angelegt, eine Public-ID generiert und eine PDF-Vorschau des Finanzierungsantrags angezeigt. Ausserdem oeffnet sich der Dokumentenraum mit Ordnerstruktur und Drag-and-Drop Upload.

---

## 1. Kachel "Finanzierungsfall generieren"

**Anfangszustand (kompakt):**
```text
+--- Finanzierungsfall generieren -----------------------------------------+
| [Sparkles] Finanzierungsakte fertigstellen                               |
| Basierend auf der aktuellen Selbstauskunft und dem Darlehensantrag kann   |
| die Finanzierung fuer [Max Mustermann] beantragt werden.                 |
| Hier koennen Sie jetzt die Finanzierungsakte fertig erstellen.           |
|                                                                          |
|                    [Finanzierungsfall anlegen]                            |
+--------------------------------------------------------------------------+
```

- Der Kundenname wird aus `formData.first_name` + `formData.last_name` dynamisch gelesen
- Der Button ist nur aktiv, wenn Mindestfelder befuellt sind (Name, Darlehenssumme, Objekt)

**Nach Klick (expandiert):**
```text
+--- Finanzierungsakte SOT-FR-A8B3C2D1 -----------------------------------+
| [CheckCircle] Fall erfolgreich angelegt                                  |
|                                                                          |
| +--- PDF-Vorschau (links 60%) ---+--- Datenraum (rechts 40%) ----------+ |
| | [PDF Preview]                  | [Ordnerstruktur]                    | |
| | Finanzierungsantrag            | 01_Identitaet          [0/2]       | |
| | Max Mustermann                 | 02_Einkommen           [0/3]       | |
| | SOT-FR-A8B3C2D1                | 03_Vermoegen           [0/1]       | |
| |                                | 04_Verpflichtungen     [0/1]       | |
| | [Antragsteller]                | 05_Objektunterlagen    [0/4]       | |
| | Name: Max Mustermann           |                                     | |
| | ...                            | [--- Drag & Drop Zone ---]          | |
| |                                | Fortschritt: 0/11 (0%)             | |
| | [Download PDF] [Per E-Mail]    | [==================] 0%            | |
| +--------------------------------+-------------------------------------+ |
+--------------------------------------------------------------------------+
```

---

## 2. Ablauf beim Klick auf "Finanzierungsfall anlegen"

1. **Datensatz erstellen**: INSERT in `finance_requests` mit allen Eckdaten aus dem Formular (Kaufpreis, Darlehenssumme, Objektdaten, Verwendungszweck)
2. **Applicant Profile erstellen**: INSERT in `applicant_profiles` mit den Selbstauskunft-Daten, verknuepft mit dem neuen `finance_request_id`
3. **Property Assets speichern**: Falls Immobilienvermoegen vorhanden, INSERT in `applicant_property_assets`
4. **Public-ID wird automatisch vom bestehenden Trigger generiert** (Prefix FR)
5. **Storage-Folder erstellen**: Ein `storage_nodes`-Eintrag vom Typ `folder` mit `module_code = 'MOD_11'` wird angelegt und in `finance_requests.storage_folder_id` gespeichert
6. **Status**: Der neue Fall wird mit Status `ready_for_submission` angelegt
7. **Navigation**: Der Fall erscheint automatisch unter "Einreichung" im Menue

---

## 3. PDF-Vorschau (Phase 1: HTML-basiert)

Statt sofort eine vollstaendige KI-generierte PDF zu bauen (das kommt in der Einreichung), wird hier eine strukturierte HTML-Vorschau gerendert, die alle erfassten Daten zusammenfasst:

- **Antragsteller-Block**: Name, Adresse, Geburtsdatum, Beschaeftigung, Einkommen
- **Mitantragsteller-Block** (falls vorhanden)
- **Finanzierungsobjekt-Block**: Adresse, Typ, Flaeche, Baujahr, Kaufpreis
- **Finanzierungs-Eckdaten**: Darlehenssumme, Eigenkapital, Nebenkosten, Verwendungszweck
- **Kapitaldienstfaehigkeit**: Einnahmen/Ausgaben-Zusammenfassung, Ergebnis
- **Immobilienvermoegen** (falls vorhanden)

Diese Vorschau kann per Button als PDF heruntergeladen werden (jsPDF ist bereits als Dependency vorhanden).

---

## 4. Datenraum (Dokumenten-Upload)

Rechts neben der PDF-Vorschau wird eine kompakte Version der bestehenden `FinanceStorageTree` und `FinanceUploadZone` eingebettet:

- Ordnerstruktur analog zur MOD-07 Checkliste (Bonitaets- + Objektunterlagen)
- Drag-and-Drop Upload via bestehendem `FileDropZone`-Component
- Fortschrittsanzeige (Progress-Bar) mit Zaehler "X von Y Pflichtdokumenten"
- Dokumente werden ueber `document_links` mit dem neuen `finance_request` verknuepft

---

## 5. Technische Umsetzung

### Neue Dateien

| Datei | Inhalt |
|---|---|
| `src/components/finanzierung/GenerateCaseCard.tsx` | Hauptkachel mit Button, expandiertem Zustand, Split-Layout |
| `src/components/finanzierung/FinanceApplicationPreview.tsx` | HTML-basierte PDF-Vorschau aller Antragsdaten |
| `src/components/finanzierung/CaseDocumentRoom.tsx` | Kompakter Datenraum mit Ordnerstruktur + Upload + Fortschritt |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `FMFinanzierungsakte.tsx` | GenerateCaseCard am Ende einfuegen (vor dem Spacer), alle Formulardaten als Props uebergeben |

### Datenbank

Keine neuen Tabellen noetig -- alle benoetigten Tabellen existieren bereits:
- `finance_requests` (mit `public_id`, `storage_folder_id`, `status`)
- `applicant_profiles` (mit `finance_request_id`)
- `applicant_property_assets`
- `storage_nodes` (fuer Ordnerstruktur)
- `document_links` + `documents` (fuer Uploads)

Es muss lediglich sichergestellt werden, dass der `generate_public_id`-Trigger fuer `finance_requests` existiert (Prefix `FR`). Falls nicht vorhanden, wird ein Migrations-Script erstellt.

### Detaillierter Ablauf in GenerateCaseCard

```text
Zustand: idle -> generating -> created

[idle]: Button "Finanzierungsfall anlegen" sichtbar
[generating]: Spinner, Button deaktiviert
[created]: Kachel expandiert, zeigt PDF-Vorschau + Datenraum
           Public-ID in der Ueberschrift
           "Einreichung oeffnen"-Link
```

**Insert-Logik (vereinfacht):**
1. `supabase.from('finance_requests').insert({...}).select().single()` -- gibt ID + public_id zurueck
2. `supabase.from('applicant_profiles').insert({...finance_request_id})` -- Hauptantragsteller
3. Falls Co-Antragsteller: zweiter Insert mit `linked_primary_profile_id`
4. Falls Property Assets: Batch-Insert in `applicant_property_assets`
5. `supabase.from('storage_nodes').insert({name: public_id, node_type: 'folder', module_code: 'MOD_11'})` -- Wurzelordner
6. Update `finance_requests.storage_folder_id` mit dem neuen Ordner

### PDF-Vorschau (FinanceApplicationPreview)

- Reines React-Component mit Print-optimiertem CSS
- Strukturiert in Sektionen: Antragsteller, Objekt, Finanzierung, Kapitaldienstfaehigkeit
- "Download PDF"-Button nutzt `jsPDF` (bereits installiert) oder `window.print()` als Fallback
- Spaeter (Einreichung/MOD-11 Phase 2) wird hier die KI-generierte Beschreibung des Finanzierungsfalls eingebaut

### CaseDocumentRoom

- Wiederverwendet die bestehende Ordnerstruktur aus `FinanceStorageTree` (BONITAET_FOLDERS + REQUEST_FOLDERS)
- Integriert `FileDropZone` fuer Drag-and-Drop
- Zeigt Progress-Bar mit Pflichtdokumenten-Zaehler
- Upload-Dateien werden im `tenant-documents` Bucket gespeichert und ueber `document_links` verknuepft
