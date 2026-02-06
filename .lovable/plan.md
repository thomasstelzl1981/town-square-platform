

# MOD-07 Dokumente: Vollständige Unterlagen-Checkliste

## IST-STAND-ANALYSE

### Aktuelle Implementierung (DokumenteTab.tsx)

**Probleme:**
1. **Hardcoded Kategorien** — Die 4 statischen Kategorien (Identität, Einkommen, Vermögen, Verpflichtungen) decken nicht die vollständige PDF-Checkliste ab
2. **Kein echter Upload** — Der Upload-Bereich zeigt nur "Phase 5" Platzhalter
3. **Keine Trennung** — Bonitätsunterlagen (permanent) vs. Objektunterlagen (pro Anfrage) werden nicht unterschieden
4. **Keine DMS-Integration** — Keine Verknüpfung zur `storage_nodes`-Hierarchie
5. **Keine MOD-04 Integration** — Objektunterlagen aus dem Portfolio werden nicht automatisch gezogen

### PDF-Unterlagenliste (unterlagenaufstellung_zur_Selbstauskunft.pdf)

**Zwei Hauptbereiche:**

| Bereich | Scope | Storage |
|---------|-------|---------|
| **Persönliche Unterlagen + Bonität** | Antragsteller (permanent) | `/finanzierung/bonitaetsunterlagen/` |
| **Objektunterlagen** | Pro Anfrage | `/finanzierung/anfragen/{request_id}/04_Objekt/` |

**Vollständige Checkliste:**

```text
PERSÖNLICHE UNTERLAGEN + BONITÄT:
├── Identität
│   └── Personalausweiskopien
├── Einkommen (Angestellte)
│   ├── Gehaltsabrechnungen (3 Monate)
│   ├── Gehaltsabrechnung Dezember
│   ├── Einkommensteuerbescheid
│   └── PKV-Nachweis (falls zutreffend)
├── Einkommen (Selbstständige) ← NEU
│   ├── Jahresabschlüsse (3 Jahre)
│   ├── BWA mit Summen/Saldenliste
│   ├── Einkommensteuererklärung
│   ├── Einkommensteuerbescheide (2 Jahre)
│   └── Handelsregisterauszug / Gesellschaftsvertrag
├── Vermögen
│   ├── Konto-/Depotauszüge
│   ├── Rückkaufswerte Lebensversicherung
│   ├── Jahreskontoauszug Bausparguthaben
│   └── Schenkungsnachweise
├── Verpflichtungen
│   ├── Darlehensverträge + Kontoauszüge
│   ├── Ratenkredite / Leasing
│   ├── Bürgschaften
│   └── Unterhaltsurteile / Scheidung
├── Altersvorsorge
│   └── Renteninformation

OBJEKTUNTERLAGEN:
├── Exposé
├── Grundbuchauszug (max. 3 Monate)
├── Kaufvertrag / Entwurf
├── Wohnflächenberechnung
├── Grundriss mit Maßangaben
├── Schnittzeichnung (bei Häusern)
├── Baubeschreibung
├── Energieausweis (min. 1 Jahr gültig)
├── Lageplan / Flurkarte
├── Farbfotos (Vorder-/Rückseite)
├── Teilungserklärung (bei ETW)
└── Kostenaufstellung (bei Neubau/Sanierung)
```

### Vorhandene Infrastruktur

| Komponente | Status | Nutzbar |
|------------|--------|---------|
| `useSmartUpload` Hook | ✅ Vorhanden | Ja — unterstützt objectType + nodeId |
| `storage_nodes` mit FINANCE Scope | ✅ Vorhanden | Ja — Template FINANCE_REQUEST_V1 existiert |
| `document_links` mit object_type | ✅ Vorhanden | Ja — 'applicant_profile' + 'finance_request' |
| DatenraumTab (MOD-04) | ✅ Vorhanden | Ja — Tree-Rendering wiederverwendbar |
| Trigger für Request-Folder | ✅ Vorhanden | Ja — trg_create_finance_request_folders |

---

## SOLL-ARCHITEKTUR

### DokumenteTab Neuaufbau

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           MOD-07 DOKUMENTE TAB                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  GESAMTSTATUS                                                                   │ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  65% — 12 von 18 Dokumenten hochgeladen                  │ │
│  │  [🔔 Erinnerungen aktivieren] [Fehlende anzeigen]                               │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────────────────┐│
│  │  📂 BONITÄTSUNTERLAGEN          │  │  📋 CHECKLISTE                             ││
│  │     (permanent)                 │  │                                            ││
│  │                                 │  │  Identität:                                ││
│  │  ├── 01_Identität              │  │  ✅ Personalausweis                        ││
│  │  │   └── [1 Dok]               │  │                                            ││
│  │  ├── 02_Einkommen              │  │  Einkommen:                                ││
│  │  │   ├── Gehaltsabrechnungen   │  │  ✅ Gehaltsabrechnung Jan                  ││
│  │  │   ├── Steuerbescheid        │  │  ✅ Gehaltsabrechnung Feb                  ││
│  │  │   └── [4 Dok]               │  │  ⚠️ Gehaltsabrechnung März  [Hochladen]   ││
│  │  ├── 03_Vermögen               │  │  ✅ Steuerbescheid                         ││
│  │  │   └── [2 Dok]               │  │                                            ││
│  │  └── 04_Verpflichtungen        │  │  Vermögen:                                 ││
│  │      └── [0 Dok]               │  │  ⚠️ Eigenkapitalnachweis  [Hochladen]     ││
│  │                                 │  │                                            ││
│  │ ─────────────────────────────── │  │  Objektunterlagen (Anfrage aktiv):         ││
│  │                                 │  │  ✅ Exposé (aus MOD-04)                    ││
│  │  📂 OBJEKTUNTERLAGEN            │  │  ⚠️ Grundbuchauszug  [Hochladen]          ││
│  │     (pro aktive Anfrage)        │  │  ⚠️ Energieausweis  [Hochladen]           ││
│  │                                 │  │  [📥 Aus MOD-04 übernehmen]                ││
│  │  ▼ FIN-ABCDE (Leipziger Str.)  │  │                                            ││
│  │    ├── Exposé                  │  └─────────────────────────────────────────────┘│
│  │    ├── Grundbuchauszug         │                                                 │
│  │    ├── Energieausweis          │  ┌─────────────────────────────────────────────┐│
│  │    └── Grundrisse              │  │  📤 DRAG & DROP UPLOAD ZONE                ││
│  │                                 │  │                                            ││
│  │  ▶ FIN-DEFGH (Neue Anfrage)    │  │  Dateien hier ablegen oder klicken         ││
│  │                                 │  │  Zielordner: 02_Einkommen                  ││
│  └─────────────────────────────────┘  └─────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Zweigeteilte Ansicht:**
   - Links: DMS-Tree (Bonitätsunterlagen + Objektunterlagen pro Anfrage)
   - Rechts: Dynamische Checkliste mit Status

2. **MOD-04 Integration:**
   - Button "Aus Portfolio übernehmen" — holt Objektunterlagen aus Property-Datenraum
   - Automatische Verlinkung via `document_links`

3. **Document Reminder:**
   - Toggle zum Aktivieren von E-Mail-Benachrichtigungen
   - Speichert in `user_preferences` oder neuer Tabelle `document_reminders`
   - Edge Function prüft wöchentlich auf fehlende Pflichtdokumente

4. **Smart Upload:**
   - Nutzt `useSmartUpload` mit korrektem `objectType` + `nodeId`
   - AI-Klassifikation schlägt doc_type vor

---

## TECHNISCHER IMPLEMENTIERUNGSPLAN

### Phase 1: Erweitertes Dokumenten-Schema

**Neue Tabelle: `document_checklist_items`**

```sql
CREATE TABLE document_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  checklist_type text NOT NULL, -- 'applicant' | 'request'
  category text NOT NULL, -- 'identity' | 'income' | 'assets' | 'liabilities' | 'property'
  doc_type text NOT NULL, -- 'DOC_PAYSLIP' | 'DOC_TAX_ASSESSMENT' etc.
  label text NOT NULL,
  is_required boolean DEFAULT false,
  for_employment_type text, -- NULL = alle, 'employed' | 'self_employed'
  sort_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed standard checklist from PDF
INSERT INTO document_checklist_items (tenant_id, checklist_type, category, doc_type, label, is_required, for_employment_type, sort_index) VALUES
-- Identity
('00000000-0000-0000-0000-000000000000', 'applicant', 'identity', 'DOC_ID_CARD', 'Personalausweiskopie', true, NULL, 1),
-- Income (Employed)
('00000000-0000-0000-0000-000000000000', 'applicant', 'income', 'DOC_PAYSLIP', 'Gehaltsabrechnung (3 Monate)', true, 'employed', 10),
('00000000-0000-0000-0000-000000000000', 'applicant', 'income', 'DOC_PAYSLIP_DEC', 'Gehaltsabrechnung Dezember', true, 'employed', 11),
('00000000-0000-0000-0000-000000000000', 'applicant', 'income', 'DOC_TAX_ASSESSMENT', 'Einkommensteuerbescheid', true, 'employed', 12),
-- Income (Self-Employed)
('00000000-0000-0000-0000-000000000000', 'applicant', 'income', 'DOC_ANNUAL_STATEMENT', 'Jahresabschlüsse (3 Jahre)', true, 'self_employed', 20),
('00000000-0000-0000-0000-000000000000', 'applicant', 'income', 'DOC_BWA', 'BWA mit Summen-/Saldenliste', true, 'self_employed', 21),
...etc
```

**Neue Tabelle: `document_reminders`**

```sql
CREATE TABLE document_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  finance_request_id uuid REFERENCES finance_requests(id),
  reminder_type text NOT NULL, -- 'weekly' | 'on_missing' | 'disabled'
  last_sent_at timestamptz,
  next_reminder_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id, finance_request_id)
);
```

### Phase 2: UI-Komponenten

**Neue Dateien:**

```text
src/components/finanzierung/
├── FinanceDocumentsManager.tsx       # Hauptkomponente (ersetzt alten DokumenteTab-Inhalt)
├── DocumentChecklistPanel.tsx        # Rechte Seite: Checkliste mit Status
├── FinanceStorageTree.tsx            # Linke Seite: DMS-Tree für Finanzierung
├── DocumentReminderToggle.tsx        # Toggle für Erinnerungen
└── MOD04DocumentPicker.tsx           # Dialog: Dokumente aus MOD-04 übernehmen
```

**FinanceDocumentsManager.tsx (Pseudocode):**

```typescript
export function FinanceDocumentsManager() {
  const { data: applicantProfile } = useQuery(['applicant-profile']);
  const { data: activeRequest } = useQuery(['active-finance-request']);
  const { data: storageNodes } = useQuery(['finance-storage-nodes']);
  const { data: checklist } = useQuery(['document-checklist']);
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-6">
      {/* Left: Storage Tree */}
      <FinanceStorageTree 
        bonitaetNodes={storageNodes.filter(n => n.scope_hint === 'FINANCE' && !n.request_id)}
        requestNodes={storageNodes.filter(n => n.scope_hint === 'FINANCE' && n.request_id)}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />
      
      {/* Right: Checklist + Upload */}
      <div className="space-y-4">
        <DocumentReminderToggle requestId={activeRequest?.id} />
        <DocumentChecklistPanel 
          checklist={checklist}
          onUploadClick={(docType) => setSelectedNodeId(nodeForDocType(docType))}
        />
        <UploadZone nodeId={selectedNodeId} />
      </div>
    </div>
  );
}
```

### Phase 3: MOD-04 Dokumenten-Übernahme

**MOD04DocumentPicker.tsx:**

Wenn eine Anfrage auf einem MOD-04 Property basiert (`object_source = 'mod04_property'`), kann der Benutzer:

1. Dokumente aus dem Property-Datenraum auswählen
2. Diese werden automatisch in die Anfrage-Ordner kopiert/verlinkt
3. `document_links` werden erstellt mit `object_type = 'finance_request'`

```typescript
async function copyPropertyDocsToRequest(propertyId: string, requestId: string) {
  // 1. Hole relevante Dokumente aus MOD-04
  const { data: propertyDocs } = await supabase
    .from('document_links')
    .select('document_id, documents(*)')
    .eq('object_type', 'property')
    .eq('object_id', propertyId)
    .in('documents.doc_type', ['DOC_EXPOSE_BUY', 'DOC_LAND_REGISTER', 'DOC_ENERGY_CERT', 'DOC_FLOORPLAN']);
  
  // 2. Erstelle neue Links für die Anfrage
  for (const doc of propertyDocs) {
    await supabase.from('document_links').insert({
      tenant_id: activeTenantId,
      document_id: doc.document_id,
      object_type: 'finance_request',
      object_id: requestId,
      node_id: getRequestFolderNode(requestId, '04_Objekt'),
      link_status: 'active',
      source_link_id: doc.id, // Referenz zur Original-Verknüpfung
    });
  }
}
```

### Phase 4: Document Reminder Edge Function

**Edge Function: `finance-document-reminder`**

```typescript
Deno.serve(async (req) => {
  // 1. Hole alle aktiven Reminder
  const { data: reminders } = await supabase
    .from('document_reminders')
    .select('*, finance_requests(*), users(*)')
    .eq('reminder_type', 'weekly')
    .lte('next_reminder_at', new Date().toISOString());
  
  for (const reminder of reminders) {
    // 2. Prüfe fehlende Dokumente
    const missing = await getMissingDocuments(reminder.finance_request_id);
    
    if (missing.length > 0) {
      // 3. Sende E-Mail
      await sendReminderEmail(reminder.users.email, missing);
      
      // 4. Update next_reminder_at
      await supabase
        .from('document_reminders')
        .update({ 
          last_sent_at: new Date().toISOString(),
          next_reminder_at: addDays(new Date(), 7).toISOString() 
        })
        .eq('id', reminder.id);
    }
  }
});
```

---

## DATEIEN DIE GEÄNDERT WERDEN

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/finanzierung/DokumenteTab.tsx` | **UMBAU** — Nutzt neue FinanceDocumentsManager |
| `src/components/finanzierung/FinanceDocumentsManager.tsx` | **NEU** — Hauptkomponente |
| `src/components/finanzierung/DocumentChecklistPanel.tsx` | **NEU** — Checkliste mit Status |
| `src/components/finanzierung/FinanceStorageTree.tsx` | **NEU** — DMS-Tree für Finanzierung |
| `src/components/finanzierung/DocumentReminderToggle.tsx` | **NEU** — Toggle für Erinnerungen |
| `src/components/finanzierung/MOD04DocumentPicker.tsx` | **NEU** — Dialog für MOD-04 Import |
| `src/components/finanzierung/index.ts` | **UPDATE** — Neue Exporte |
| `supabase/functions/finance-document-reminder/` | **NEU** — Edge Function für Reminder |
| **Migration** | Neue Tabellen: `document_checklist_items`, `document_reminders` |

---

## ACCEPTANCE CRITERIA

### Dokumenten-Checkliste
- [ ] Vollständige Checkliste gemäß PDF angezeigt
- [ ] Status-Icons (✅ vorhanden, ⚠️ fehlt) pro Dokument
- [ ] Unterscheidung Angestellte vs. Selbstständige

### DMS-Integration
- [ ] Bonitätsunterlagen in permanentem Tree
- [ ] Objektunterlagen pro Anfrage
- [ ] Upload landet im korrekten node_id
- [ ] document_links werden erstellt

### MOD-04 Integration
- [ ] Button "Aus Portfolio übernehmen" funktioniert
- [ ] Dokumente werden verlinkt (nicht kopiert)
- [ ] Exposé, Grundbuch etc. werden erkannt

### Document Reminder
- [ ] Toggle zum Aktivieren vorhanden
- [ ] Einstellung wird gespeichert
- [ ] E-Mail wird bei fehlenden Dokumenten gesendet

### UI/UX
- [ ] Elegantes, technisches Design
- [ ] Drag & Drop Upload funktioniert
- [ ] Mobile-responsive
- [ ] Gesamtfortschritt als Progress Bar

---

## GESCHÄTZTE DAUER

| Phase | Umfang | Dauer |
|-------|--------|-------|
| Phase 1 | DB-Migration (2 Tabellen + Seed) | 0.5 Tag |
| Phase 2 | UI-Komponenten (5 Dateien) | 2-3 Tage |
| Phase 3 | MOD-04 Integration | 1 Tag |
| Phase 4 | Document Reminder Edge Function | 1 Tag |
| **Gesamt** | | **4-5 Tage** |

