

# Magic Intake: KI-gestuetzte Schnellerfassung

## Konzept

Der Magic Intake ist ein **Schnellstart-Workflow** ganz oben auf der Finanzierungsakte-Seite. Der Manager gibt Vorname, Nachname und E-Mail ein und klickt "Magic Intake aktivieren". Daraufhin wird:

1. Ein **echter Finanzierungsfall** angelegt (`finance_request` mit Status `draft`, `applicant_profile` mit Name + E-Mail)
2. Eine **Public-ID** generiert (SOT-F-XXXXXXXX)
3. Ein **DMS-Ordnerbaum** erstellt (storage_nodes fuer MOD_11)
4. Ein **Widget** im Dashboard erzeugt (Fall erscheint unter "Faelle in Bearbeitung")
5. Die Seite **scrollt nach unten** zum Datenraum (CaseDocumentRoom)

Der Manager sieht dann den bekannten Datenraum mit den ~24 Ordnern und kann per Drag-and-Drop die Kundenunterlagen in die richtigen Ordner ablegen. Der Fortschritt wird ueber die bestehende Ampel-Anzeige (DocumentReadinessIndicator) sichtbar.

**Kein doppeltes Upload-UI** — der Datenraum IST die Upload-Flaeche.

## Layout-Aenderung

```text
VORHER (volle Breite):
+--- Objekt aus Marktplatz uebernehmen ──────────────────────────────────+
| [Suchfeld]                                                              |
+-------------------------------------------------------------------------+

NACHHER (50/50 Split):
+--- Magic Intake ──────────────────+ +--- Objekt aus Marktplatz ────────+
| Vorname: [___________]            | | [Suchfeld ID/Ort/Strasse]       |
| Nachname: [___________]           | |                                  |
| E-Mail: [___________]             | |                                  |
|                                    | |                                  |
| [✨ Magic Intake aktivieren]      | |                                  |
+------------------------------------+ +----------------------------------+
```

## Detaillierter Ablauf nach Klick "Magic Intake aktivieren"

### Schritt 1: Finanzierungsfall anlegen (Backend)

Identisch zur bestehenden Logik in `GenerateCaseCard.handleGenerate`, aber mit minimalen Daten:

```typescript
// 1. finance_request anlegen
const { data: fr } = await supabase
  .from('finance_requests')
  .insert({
    tenant_id: activeTenantId,
    created_by: user?.id,
    status: 'draft',           // <-- NICHT ready_for_submission
    purpose: 'kauf',           // Default
  })
  .select('id, public_id')
  .single();

// 2. applicant_profile anlegen (nur Name + E-Mail)
await supabase
  .from('applicant_profiles')
  .insert({
    tenant_id: activeTenantId,
    finance_request_id: fr.id,
    profile_type: 'self_disclosure',
    party_role: 'primary',
    first_name: intakeFirstName,
    last_name: intakeLastName,
    email: intakeEmail,
  });

// 3. Storage-Ordner anlegen (wie bisher)
const { data: folder } = await supabase
  .from('storage_nodes')
  .insert({
    tenant_id: activeTenantId,
    name: fr.public_id,
    node_type: 'folder',
    module_code: 'MOD_11',
  })
  .select('id')
  .single();

// 4. Ordner mit Request verknuepfen
await supabase
  .from('finance_requests')
  .update({ storage_folder_id: folder.id })
  .eq('id', fr.id);
```

### Schritt 2: UI-Umschaltung

Nach Anlage:
- Die MagicIntakeCard zeigt Erfolgsstatus mit Public-ID
- Die Seite scrollt automatisch nach unten zum **GenerateCaseCard**, das jetzt im `created`-State angezeigt wird
- Der Datenraum (CaseDocumentRoom) ist sofort sichtbar und bereit fuer Uploads
- Die Selbstauskunft-Felder (formData) werden mit Vorname/Nachname/E-Mail vorausgefuellt

### Schritt 3: KI-Analyse (Phase 2 — spaeter)

Sobald Dokumente in den Datenraum hochgeladen werden, koennen diese optional per KI analysiert und in die Selbstauskunft-Felder uebertragen werden. Dies ist eine **separate Erweiterung** und NICHT Teil der initialen Umsetzung.

## Neue Komponente: MagicIntakeCard.tsx

```text
Platzierung: src/components/finanzierung/MagicIntakeCard.tsx

Props:
  - onCaseCreated: (data: { requestId: string, publicId: string, firstName: string, lastName: string, email: string }) => void

Interner State:
  - firstName, lastName, email (Eingabefelder)
  - state: 'idle' | 'creating' | 'created'

UI:
  - Sparkles-Icon + "Magic Intake" Header
  - 3 Input-Felder (Vorname, Nachname, E-Mail)
  - Button "Magic Intake aktivieren" (disabled wenn Felder leer)
  - Nach Erfolg: Grünes Badge mit Public-ID

Logik:
  - Klick → handleCreate() → supabase-Inserts (s.o.) → onCaseCreated callback
  - Parent (FMFinanzierungsakte) empfängt Daten, setzt formData, scrollt zum Datenraum
```

## Aenderungen in FMFinanzierungsakte.tsx

1. **Layout-Split**: Marktplatz-Suchkachel wird auf 50% (rechts), MagicIntakeCard auf 50% (links)
2. **onCaseCreated Callback**:
   - Setzt `formData.first_name`, `formData.last_name`, `formData.email`
   - Setzt internen State `caseCreated = true` mit `requestId` + `publicId`
   - Scrollt per `ref.current.scrollIntoView()` zum GenerateCaseCard / Datenraum
3. **GenerateCaseCard**: Wenn `caseCreated`, uebergibt `requestId` + `publicId` direkt → zeigt sofort den `created`-State mit Datenraum

## Dashboard-Integration

Der neu angelegte Fall mit Status `draft` erscheint automatisch im Dashboard unter "Faelle in Bearbeitung" (sofern der Dashboard-Filter korrekt ist — Status `draft` ist NICHT in `SUBMITTED_STATUSES`).

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/finanzierung/MagicIntakeCard.tsx` (NEU) | Eingabe Vorname/Nachname/E-Mail + Case-Anlage |
| `src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx` | Layout-Split oben, onCaseCreated Handler, Auto-Scroll |
| `src/components/finanzierung/GenerateCaseCard.tsx` | Neuer Prop `initialCreatedState` fuer direkten created-Modus |

## Keine Datenbank-Aenderungen

Nutzt die bestehenden Tabellen `finance_requests`, `applicant_profiles`, `storage_nodes`. Der Status `draft` existiert bereits.


# Dashboard vs. Einreichung: Klare Datentrennung

## Problem

Aktuell zeigen Dashboard und Einreichung teilweise dieselben Faelle. Die Abgrenzung ist unklar:
- Dashboard zeigt ALLE `cases` (inkl. bereits eingereichte)
- Einreichung filtert auf `READY_STATUSES` (inkl. `ready_for_submission` UND `submitted_to_bank` UND `completed`)

## Neue Regel

| Tile | Zeigt | Filter-Logik |
|---|---|---|
| **Dashboard** "Faelle in Bearbeitung" | Faelle, die noch NICHT eingereicht sind | Status NOT IN (`submitted_to_bank`, `completed`, `rejected`, `archived`) |
| **Einreichung** | Alle Faelle, die eingereicht wurden ODER bereit zur Einreichung sind | Status IN (`ready_for_submission`, `ready_to_submit`, `submitted_to_bank`, `completed`) |

Sobald ein Fall eingereicht wird (`submitted_to_bank`), verschwindet er aus dem Dashboard und erscheint nur noch in der Einreichung mit der vollstaendigen Dokumentation (wann, bei wem, wie).

## Aenderungen

### 1. FMDashboard.tsx — Filter einbauen

Zeile 116: `cases.map(...)` wird ersetzt durch gefilterte Liste:

```typescript
const SUBMITTED_STATUSES = ['submitted_to_bank', 'completed', 'rejected', 'archived'];

const activeCases = cases.filter(c => {
  const status = getRequestStatus(c);
  return !SUBMITTED_STATUSES.includes(status);
});
```

- Sektion "Faelle in Bearbeitung" zeigt nur `activeCases`
- Header-Zaehler passt sich an: `activeCases.length` statt `cases.length`
- "Letzte Aktivitaeten"-Widget filtert ebenfalls nur auf aktive Faelle

### 2. FMEinreichung.tsx — Alle eingereichten Faelle zeigen

Die bestehende `READY_STATUSES`-Filterung bleibt korrekt. Zusaetzlich wird die Einreichungsliste um Dokumentation erweitert:

- Jede Case-Card zeigt ein kleines Badge mit dem Einreichungsstatus (z.B. "2 Banken, gesendet am 12.02.")
- Die Submission-Logs werden pro Fall in Step 4 angezeigt (bereits implementiert)

### 3. Header-Beschreibung anpassen

**Dashboard:**
```
"{n} Fälle in Bearbeitung — noch nicht eingereicht."
```

**Einreichung:**
```
"{n} Einreichungen — Dokumentation aller Bank-Einreichungen."
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMDashboard.tsx` | Filter auf aktive Faelle (nicht eingereicht), Header-Text anpassen |
| `FMEinreichung.tsx` | Header-Text anpassen, Badge mit Einreichungs-Info pro Case-Card |

## Keine Datenbank-Aenderungen

Reine Frontend-Filterlogik.
