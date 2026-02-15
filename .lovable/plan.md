

# Vorsorge und Testament — Neues Sektions-Layout

## Zusammenfassung

Die bisherige Widget-basierte Seite (2 Kacheln mit Dialog-Popups) wird durch ein **sektionsbasiertes Inline-Layout** ersetzt. Der gesamte Inhalt ist direkt auf der Seite sichtbar — keine Dialoge mehr.

---

## Neues Seitenlayout

```text
+----------------------------------------------------------+
| ModulePageHeader: Vorsorge & Testament                   |
+----------------------------------------------------------+
|                                                          |
| SEKTION 1: Patientenverfügung & Vorsorgevollmacht        |
| ─────────────────────────────────────────────────         |
|                                                          |
| WidgetGrid (Personen aus household_persons):              |
| +----------------+ +----------------+ +----------------+ |
| | Max Mustermann | | Anna Muster    | | Kind Muster    | |
| | (Hauptperson)  | |                | |                | |
| | [ausgewählt]   | |                | |                | |
| +----------------+ +----------------+ +----------------+ |
|                                                          |
| Inline-Bereich (immer offen):                            |
| ┌──────────────────────────────────────────────────────┐ |
| │ Formular: Teil A (Patientenverfügung)                │ |
| │ - Name, Geburtsdatum, Adresse (vorbefüllt)          │ |
| │ - Situationen (Checkboxen)                           │ |
| │ - Lebensverlängernde Maßnahmen                       │ |
| │ - Konkrete Maßnahmen                                 │ |
| │ - Organspende                                        │ |
| │ - Persönliche Werte                                  │ |
| │                                                      │ |
| │ Formular: Teil B (Vorsorgevollmacht)                 │ |
| │ - Bevollmächtigte Person                             │ |
| │ - Umfang der Vollmacht                               │ |
| │ - Einschränkungen                                    │ |
| │                                                      │ |
| │ [PDF herunterladen]  [Drucken]  [Scan hochladen]     │ |
| └──────────────────────────────────────────────────────┘ |
|                                                          |
| SEKTION 2: Testament                                     |
| ─────────────────────────────────────────────────         |
|                                                          |
| WidgetGrid (4 Vorlagen):                                 |
| +----------------+ +----------------+                    |
| | Vorlage 1/4    | | Vorlage 2/4    |                    |
| | Alleinerbe     | | Mehrere Erben  |                    |
| | [ausgewählt]   | |                |                    |
| +----------------+ +----------------+                    |
| +----------------+ +----------------+                    |
| | Vorlage 3/4    | | Vorlage 4/4    |                    |
| | Vor-/Nacherb-  | | Berliner       |                    |
| | schaft         | | Testament      |                    |
| +----------------+ +----------------+                    |
|                                                          |
| Inline-Bereich (immer offen, zeigt gewählte Vorlage):    |
| ┌──────────────────────────────────────────────────────┐ |
| │ Vorlagentext der gewählten Variante                  │ |
| │ (Voller juristischer Text mit Platzhaltern           │ |
| │  zum Abschreiben per Hand)                           │ |
| │                                                      │ |
| │ Hinweis-Box: "Nur handschriftlich gültig!"           │ |
| │                                                      │ |
| │ [PDF anzeigen]  [Drucken]  [Scan hochladen]          │ |
| └──────────────────────────────────────────────────────┘ |
+----------------------------------------------------------+
```

---

## Aenderung 1: VorsorgedokumenteTab.tsx — Komplett-Umbau

**Bisheriges Verhalten entfernen:**
- 2 WidgetCells mit onClick -> Dialog entfernen
- LegalDocumentDialog-Aufrufe entfernen

**Neues Layout:**

### Sektion 1 — Patientenverfuegung
- Sektionsüberschrift: `h2` mit "Patientenverfügung & Vorsorgevollmacht"
- `WidgetGrid` mit einer `WidgetCell` pro Person aus `household_persons`
  - Jede Kachel zeigt: Vorname + Nachname, Rolle (z.B. "Hauptperson"), Avatar
  - Ausgewählte Person bekommt `ring-2 ring-primary`
  - Status-Badge (Emerald/Rot) je nachdem ob `legal_documents` für diese Person existiert
- Darunter **immer offen** (kein Dialog): Das komplette Formular aus `LegalDocumentDialog` (renderEdit + renderPreview Logik), aber inline statt im Dialog
  - Felder `name`, `geburtsdatum`, `adresse` werden aus der gewählten `household_person` vorbefüllt
  - Personenwechsel: Formulardaten werden auf die neue Person aktualisiert, gespeicherte Daten aus `legal_documents` geladen
  - Am Ende: Buttons "PDF herunterladen", "Drucken", "Scan hochladen" (Upload-Bereich direkt darunter, kein separater Step)

### Sektion 2 — Testament
- Sektionsüberschrift: `h2` mit "Testament"
- `WidgetGrid` mit 4 `WidgetCells`:
  1. **Alleinerbe** — Einzeltestament mit Ersatzerbe
  2. **Mehrere Erben** — Einzeltestament mit Quoten
  3. **Vor-/Nacherbschaft** — Vor- und Nacherbschaft
  4. **Berliner Testament** — Ehegatten/Lebenspartner
- Ausgewählte Vorlage bekommt `ring-2 ring-primary`
- Darunter **immer offen**: Der volle Vorlagentext der gewählten Variante
  - Juristische Paragraphen mit Platzhaltern (___) zum Abschreiben
  - Roter Hinweiskasten: "Nur handschriftlich wirksam!"
  - Buttons: "PDF anzeigen", "Drucken", "Scan hochladen"

---

## Aenderung 2: Testament-Vorlagentexte als Inline-Anzeige

Die 4 Testament-Vorlagen aus `generateTestamentVorlagenPdf()` werden zusätzlich als **lesbarer HTML-Text** auf der Seite dargestellt (nicht nur als PDF-Download). Dafür wird eine neue Komponente `TestamentVorlageInline` erstellt, die den juristischen Text der gewählten Vorlage als strukturierten Text rendert (Paragraphen, Platzhalterzeilen).

Die Texte werden aus einer Konstanten-Datei bezogen (extrahiert aus dem bestehenden PDF-Generator), damit sie sowohl in der Inline-Ansicht als auch im PDF identisch sind.

---

## Aenderung 3: Patientenverfuegung Inline-Formular

Die Formularlogik aus `LegalDocumentDialog` (renderEdit) wird in eine neue Komponente `PatientenverfuegungInlineForm` extrahiert. Diese:
- Empfängt `personId` und `tenantId` als Props
- Lädt bestehende `legal_documents`-Daten für die Person
- Vorbefüllt Name/Geburtsdatum/Adresse aus `household_persons`
- Zeigt das vollständige Formular (Teil A + Teil B) direkt inline
- Hat am Ende drei Aktionsbuttons (PDF, Drucken, Upload)
- Auto-Save bei Personwechsel

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzanalyse/VorsorgedokumenteTab.tsx` | Komplett-Umbau: 2 Sektionen mit Widgets + Inline-Detail |
| `src/components/legal/PatientenverfuegungInlineForm.tsx` | **NEU** — Formular extrahiert aus LegalDocumentDialog |
| `src/components/legal/TestamentVorlageInline.tsx` | **NEU** — Inline-Textanzeige der 4 Testament-Vorlagen |
| `src/components/legal/testamentVorlagenTexte.ts` | **NEU** — Konstanten mit den 4 Vorlagentexten |
| `src/components/legal/LegalDocumentDialog.tsx` | Bleibt bestehen (wird aber nicht mehr von VorsorgedokumenteTab verwendet) |

**Keine DB-Migration noetig** — `legal_documents` und `household_persons` existieren bereits.

---

## Technische Details

### Personen-Widget (Sektion 1)

```text
Query: supabase.from('household_persons')
  .select('*')
  .eq('tenant_id', activeTenantId)
  .order('sort_order')

State: selectedPersonId (default: Hauptperson / is_primary=true)

Vorbefüllung:
  form.pv.name = person.first_name + ' ' + person.last_name
  form.pv.geburtsdatum = person.birth_date
  form.pv.adresse = person.street + ' ' + person.house_number + ', ' + person.zip + ' ' + person.city
```

### Testament-Vorlagen-Widgets (Sektion 2)

```text
State: selectedVariante: 1 | 2 | 3 | 4 (default: 1)

Jede Vorlage hat:
  - title: "Alleinerbe" | "Mehrere Erben" | "Vor-/Nacherbschaft" | "Berliner Testament"
  - subtitle: Kurzbeschreibung
  - content: Paragraphen-Array mit Titel + Text + Platzhaltern

PDF-Generation: Die bestehende generateTestamentVorlagenPdf() wird weiterhin
für den PDF-Download genutzt. Die Inline-Anzeige nutzt eigene Textdaten.
```

### Datenpersistenz

- Patientenverfügung: Speichert in `legal_documents` mit `document_type = 'patientenverfuegung'` + `user_id` der gewählten Person
- Testament: `document_type = 'testament'` — Scan-Upload wie bisher
- Beim Personenwechsel werden bestehende Formulardaten aus `legal_documents` geladen

