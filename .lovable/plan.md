
# Implementierungsplan: Module 2-10 mit Funktionen verbinden

## Ausgangslage

Phase 0 (Shared Components) und Phase 1 (MOD-01 Stammdaten) sind abgeschlossen. Das Routing-Pattern aus StammdatenPage funktioniert korrekt und muss auf die restlichen 9 Module übertragen werden.

## Strategie: Modul-für-Modul-Reparatur

Jedes Modul wird nach demselben bewährten Pattern wie MOD-01 implementiert:
1. Page mit useLocation() für Sub-Route-Erkennung
2. 4 Sub-Tab-Komponenten mit echten Formularen/Listen
3. Anbindung an bestehende Datenbank-Tabellen und Edge Functions

---

## Phase 2: MOD-03 DMS (höchste Priorität - Edge Functions vorhanden)

### Dateien erstellen:
- `src/pages/portal/dms/StorageTab.tsx` - 3-Panel-Layout mit Ordner-Baum, Dokument-Liste, Upload
- `src/pages/portal/dms/PosteingangTab.tsx` - Inbound-Items aus Caya
- `src/pages/portal/dms/SortierenTab.tsx` - Queue mit Accept/Reject
- `src/pages/portal/dms/EinstellungenTab.tsx` - Extraction Toggle, Connectors
- `src/pages/portal/dms/index.ts` - Exports

### DMSPage.tsx umbauen:
```tsx
const renderSubPage = () => {
  if (currentPath.endsWith('/storage')) return <StorageTab />;
  if (currentPath.endsWith('/posteingang')) return <PosteingangTab />;
  if (currentPath.endsWith('/sortieren')) return <SortierenTab />;
  if (currentPath.endsWith('/einstellungen')) return <EinstellungenTab />;
  return null;
};
```

### Datenanbindung:
- Edge Function `sot-dms-upload-url` für Upload
- Edge Function `sot-dms-download-url` für Download
- Tabelle `documents` für Dokument-Liste

---

## Phase 3: MOD-02 KI Office

### Dateien erstellen:
- `src/pages/portal/office/EmailTab.tsx` - 3-Panel E-Mail-Client (Phase 1: Account verbinden UI)
- `src/pages/portal/office/BriefTab.tsx` - KI-Briefgenerator mit ContactPicker
- `src/pages/portal/office/KontakteTab.tsx` - Kontakt-Liste CRUD
- `src/pages/portal/office/KalenderTab.tsx` - Termin-Übersicht
- `src/pages/portal/office/index.ts`

### Datenanbindung:
- Tabelle `contacts` für Kontakte
- Neue Tabelle `letter_drafts` für Brief-Entwürfe (DB-Migration erforderlich)

---

## Phase 4: MOD-04 Immobilien

### Dateien erstellen:
- `src/pages/portal/immobilien/KontexteTab.tsx` - Vermieter-Kontexte
- `src/pages/portal/immobilien/PortfolioTab.tsx` - DataTable mit 13 Spalten
- `src/pages/portal/immobilien/SanierungTab.tsx` - Service Cases
- `src/pages/portal/immobilien/BewertungTab.tsx` - Bewertungs-Jobs
- `src/pages/portal/immobilien/index.ts`

### Datenanbindung:
- Edge Function `sot-property-crud`
- Tabellen `properties`, `units`, `property_features`

---

## Phase 5: MOD-05 bis MOD-10 (Business-Module)

Jedes Modul erhält 4 Sub-Tab-Komponenten nach demselben Pattern:

| Modul | Sub-Tabs | Haupt-Tabellen |
|-------|----------|----------------|
| MOD-05 MSV | Dashboard, Listen, Mieteingang, Vermietung | leases, units, rent_payments |
| MOD-06 Verkauf | Objekte, Aktivitäten, Anfragen, Vorgänge | listings, listing_publications |
| MOD-07 Finanzierung | Fälle, Dokumente, Export, Status | finance_cases, finance_parties |
| MOD-08 Investments | Suche, Favoriten, Mandat, Simulation | investment_favorites |
| MOD-09 Vertriebspartner | Objektkatalog, Auswahl, Beratung, Netzwerk | partner_listings |
| MOD-10 Leads | Inbox, Meine Leads, Pipeline, Werbung | leads, deals |

---

## Technische Details

### Sub-Page-Routing-Pattern (Template für alle Module):

```tsx
// [Module]Page.tsx
import { useLocation } from 'react-router-dom';
import { SubTabNav } from '@/components/shared';

const [Module]Page = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const subTiles = [
    { title: 'Tab1', route: '/portal/[module]/tab1' },
    { title: 'Tab2', route: '/portal/[module]/tab2' },
    // ...
  ];

  const renderSubPage = () => {
    if (currentPath.endsWith('/tab1')) return <Tab1Component />;
    if (currentPath.endsWith('/tab2')) return <Tab2Component />;
    return null; // Dashboard
  };

  const subPageContent = renderSubPage();
  const isOnSubPage = subPageContent !== null;

  return (
    <div className="space-y-6">
      {isOnSubPage ? (
        <div className="p-6 space-y-6">
          <ModuleHeader />
          <SubTabNav tabs={subTiles} />
          {subPageContent}
        </div>
      ) : (
        <ModuleDashboard subTiles={subTiles} />
      )}
    </div>
  );
};
```

### Erforderliche Datenbank-Migrationen:

```sql
-- Für MOD-02 KI Office
CREATE TABLE IF NOT EXISTS letter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  recipient_contact_id uuid REFERENCES contacts(id),
  subject text,
  body text,
  status text DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Für MOD-03 DMS (Ordnerstruktur)
CREATE TABLE IF NOT EXISTS storage_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  parent_id uuid REFERENCES storage_nodes(id),
  name text NOT NULL,
  node_type text DEFAULT 'folder',
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE letter_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON letter_drafts 
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant isolation" ON storage_nodes 
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));
```

---

## Implementierungs-Reihenfolge

| Schritt | Modul | Geschätzter Aufwand | Priorität |
|---------|-------|---------------------|-----------|
| 1 | MOD-03 DMS | 2 Stunden | P0 - Edge Functions vorhanden |
| 2 | MOD-02 KI Office | 2 Stunden | P0 - Komplexe UI |
| 3 | MOD-04 Immobilien | 1.5 Stunden | P0 - Core Business |
| 4 | MOD-05 MSV | 1 Stunde | P1 |
| 5 | MOD-06 Verkauf | 1.5 Stunden | P1 |
| 6 | MOD-07 Finanzierung | 1 Stunde | P1 |
| 7 | MOD-08 Investments | 1 Stunde | P2 |
| 8 | MOD-09 Vertriebspartner | 1 Stunde | P2 |
| 9 | MOD-10 Leads | 1 Stunde | P2 |

**Gesamtaufwand: ca. 12 Stunden**

---

## Ergebnis nach Abschluss

- Alle 10 Module mit funktionalen Sub-Tabs
- 40+ Sub-Pages mit echten Formularen und Datenlisten
- Edge Functions angebunden (DMS, Property, Listing)
- Einheitliches UI-Pattern über alle Module
- RLS-geschützte Daten mit Tenant-Isolation

---

## Nächster Schritt

Mit Genehmigung beginne ich mit **Phase 2 (MOD-03 DMS)**, da:
1. Edge Functions `sot-dms-upload-url` und `sot-dms-download-url` bereits existieren
2. Die `documents` Tabelle bereits vorhanden ist
3. DMS ist ein zentrales Feature für alle anderen Module
