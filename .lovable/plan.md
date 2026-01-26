

# Reparaturplan: MOD-02 KI Office mit Funktionen verbinden

## Ausgangslage

Das aktuelle `OfficePage.tsx` ist eine leere Hülle ohne Sub-Routes und ohne Funktionen. Gemäß MOD-02 Dokumentation benötigt das Modul:

| Sub-Route | Funktion | Status |
|-----------|----------|--------|
| `/portal/ki-office` | Dashboard | Fehlt |
| `/portal/ki-office/email` | E-Mail-Client (3-Panel) | Fehlt |
| `/portal/ki-office/brief` | KI-Briefgenerator | Fehlt |
| `/portal/ki-office/kontakte` | Kontakt-CRUD | Fehlt |
| `/portal/ki-office/kalender` | Termine | Fehlt |

## Implementierungsstrategie

Wir verwenden das bewährte Pattern aus StammdatenPage und DMSPage mit `useLocation()` für Sub-Route-Erkennung.

---

## Phase 1: Datei-Struktur erstellen

### Neue Dateien

```
src/pages/portal/office/
├── EmailTab.tsx         - 3-Panel E-Mail-Client
├── BriefTab.tsx         - KI-Briefgenerator (Armstrong)
├── KontakteTab.tsx      - Kontakt-Liste + CRUD
├── KalenderTab.tsx      - Termin-Übersicht
└── index.ts             - Exports
```

### OfficePage.tsx umbauen

Nach dem gleichen Pattern wie DMSPage:

```tsx
const renderSubPage = () => {
  if (currentPath.endsWith('/email')) return <EmailTab />;
  if (currentPath.endsWith('/brief')) return <BriefTab />;
  if (currentPath.endsWith('/kontakte')) return <KontakteTab />;
  if (currentPath.endsWith('/kalender')) return <KalenderTab />;
  return null; // Dashboard
};
```

---

## Phase 2: EmailTab (3-Panel E-Mail-Client)

### Layout wie DMS Storage (3-Panel):

```
┌─────────────┬─────────────────────────────┬──────────────┐
│   ORDNER    │       MAIL-LISTE            │    DETAIL    │
│             │                             │              │
│ ○ Eingang   │ ▪ Subject 1  - 14:30       │  Von: ...    │
│ ○ Gesendet  │ ▪ Subject 2  - gestern     │  An: ...     │
│ ○ Entwürfe  │ ▪ Subject 3  - 22.01.      │  Betreff:... │
│ ○ Papierkorb│                             │  ----------  │
│             │                             │  Body...     │
│ [+ Ordner]  │                             │              │
└─────────────┴─────────────────────────────┴──────────────┘
```

### Ordner-Sidebar (links)

- Eingang (Inbox)
- Gesendet
- Entwürfe
- Papierkorb
- Archiviert
- [+ Ordner erstellen]

### Features Phase 1

- Ordner-Navigation (statisch, da keine IMAP-Integration in Phase 1)
- Mock-Daten für E-Mail-Liste zur UI-Demonstration
- "Account verbinden"-Button (Placeholder für IMAP/Gmail/Exchange)
- Layout vorbereitet für echte Integration

### Datenmodell (Phase 2 - zukünftig)

```sql
-- Noch NICHT implementieren, nur UI vorbereiten
CREATE TABLE mail_accounts (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES profiles(id),
  provider text, -- 'imap', 'gmail', 'outlook'
  email_address text,
  sync_status text DEFAULT 'pending',
  last_sync_at timestamptz
);
```

---

## Phase 3: BriefTab (KI-Briefgenerator - Kernfeature)

### Workflow (gemäß Dokumentation)

```
[1. Empfänger] → [2. Prompt] → [3. KI-Draft] → [4. Edit] → [5. PDF] → [6. Senden]
```

### UI-Layout

```
┌──────────────────────────────────────────────────────────────┐
│  KI-BRIEFGENERATOR                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. EMPFÄNGER AUSWÄHLEN                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [Kontakt suchen...]  👤 Max Mustermann, Immobilia GmbH│    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  2. BETREFF                                                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Mieterhöhung zum 01.04.2026                          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  3. BESCHREIBEN SIE IHR ANLIEGEN (Prompt an Armstrong)       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Schreibe einen formellen Brief zur Ankündigung einer │    │
│  │ Mieterhöhung von 5% gemäß Mietspiegel...             │    │
│  │                                        [🎤 Sprache]  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  [✨ Brief generieren]                                        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  4. BRIEF BEARBEITEN                                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ [Rich Text Editor - WYSIWYG]                         │    │
│  │                                                      │    │
│  │ Sehr geehrter Herr Mustermann,                       │    │
│  │                                                      │    │
│  │ hiermit möchten wir Sie über eine Anpassung...       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  5. VERSANDKANAL                                             │
│  ○ E-Mail (Systemmail)  ○ Fax  ○ Post                       │
│                                                              │
│  [👁 PDF Vorschau]  [💾 Als Entwurf]  [📤 Senden & Bestätigen]│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Datenbank-Migration erforderlich

```sql
CREATE TABLE letter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  recipient_contact_id uuid REFERENCES contacts(id),
  subject text,
  prompt text,
  body text,
  status text DEFAULT 'draft', -- draft, ready, sent
  channel text, -- email, fax, post
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE letter_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON letter_drafts 
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));
```

### Armstrong KI-Anbindung

- Nutzt Lovable AI Gateway (google/gemini-3-flash-preview)
- Edge Function: `sot-letter-generate` (neu)
- Prompt-Template mit Absender-Identität aus `profiles` + `organizations`
- **Confirmation-First Policy**: Keine automatischen Aktionen

### Interface-Actions (aus INTERFACES.md)

| Action | Beschreibung |
|--------|--------------|
| `GetContactsForLetter` | Kontakte für Empfänger-Picker |
| `GetSenderIdentity` | Absenderdaten (Profil + Firma) |
| `CreateCommunicationEvent` | Versand protokollieren |
| `ArchiveLetterAsDMS` | Brief als PDF in MOD-03 archivieren |

---

## Phase 4: KontakteTab (Kontakt-CRUD)

### Layout

```
┌────────────────────────────────────────────────────────────┬───────────────┐
│  KONTAKTE                                     [+ Kontakt]  │    DETAIL     │
├────────────────────────────────────────────────────────────┤               │
│  [🔍 Suchen...]  [Filter: Alle ▼]                          │  👤 Max M.    │
├────────────────────────────────────────────────────────────┤               │
│  ▪ Max Mustermann      Immobilia GmbH     max@immo.de     │  Firma: ...   │
│  ▪ Anna Schmidt        Privat              anna@web.de    │  E-Mail: ...  │
│  ▪ Thomas Müller       Hausverwaltung      tm@hv.de       │  Tel: ...     │
│                                                            │  Notizen:...  │
│                                                            │               │
│                                                            │  [Bearbeiten] │
│                                                            │  [Brief schr.]│
└────────────────────────────────────────────────────────────┴───────────────┘
```

### Features

- DataTable mit `contacts`-Tabelle (existiert bereits)
- Kontakt erstellen/bearbeiten (Dialog oder Drawer)
- Kontakt-Detail mit Kommunikationshistorie
- Quick Action: "Brief schreiben" → navigiert zu `/brief` mit vorausgewähltem Kontakt

### Datenquelle

`contacts` Tabelle ist bereits vorhanden:
```typescript
{
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  public_id: string;
}
```

---

## Phase 5: KalenderTab (Termine)

### Layout

```
┌────────────────────────────────────────────────────────────┐
│  KALENDER                                    [+ Termin]    │
├────────────────────────────────────────────────────────────┤
│  [< Januar 2026 >]        [Monat] [Woche] [Tag]            │
├────────────────────────────────────────────────────────────┤
│  Mo    Di    Mi    Do    Fr    Sa    So                    │
│  ┌────┬────┬────┬────┬────┬────┬────┐                     │
│  │    │    │ 1  │ 2  │ 3  │ 4  │ 5  │                     │
│  │    │    │    │    │🔵  │    │    │                     │
│  ├────┼────┼────┼────┼────┼────┼────┤                     │
│  │ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │                     │
│  │    │🔵🔵│    │    │    │    │    │                     │
│  └────┴────┴────┴────┴────┴────┴────┘                     │
│                                                            │
│  HEUTE: 26. Januar 2026                                    │
│  ─────────────────────────────                            │
│  10:00 - Besichtigung Hauptstr. 15                        │
│  14:30 - Call mit Finanzierungsberater                    │
└────────────────────────────────────────────────────────────┘
```

### Datenbank-Migration erforderlich

```sql
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  all_day boolean DEFAULT false,
  location text,
  contact_id uuid REFERENCES contacts(id),
  property_id uuid REFERENCES properties(id),
  reminder_minutes integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON calendar_events 
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));
```

### Features Phase 1

- Monats-Ansicht mit react-day-picker (bereits installiert)
- Termin erstellen (Dialog)
- Termin mit Kontakt/Property verknüpfen
- Tagesübersicht

---

## Neue Edge Function: sot-letter-generate

Für den KI-Briefgenerator wird eine Edge Function benötigt:

```typescript
// supabase/functions/sot-letter-generate/index.ts
// Nutzt Lovable AI Gateway für Brief-Generierung
// Input: recipient, subject, prompt, sender_identity
// Output: generated_body (formatierter Brief)
```

**System-Prompt für Armstrong:**
```
Du bist ein professioneller Briefassistent für deutsche Immobilienverwaltung.
Erstelle formelle, CI-konforme Geschäftsbriefe.
Verwende Sie-Form und formelle Anrede.
Absender-Identität: {sender_identity}
Empfänger: {recipient}
```

---

## Implementierungs-Reihenfolge

| Schritt | Aktion | Priorität |
|---------|--------|-----------|
| 1 | OfficePage.tsx mit Sub-Route-Logik umbauen | P0 |
| 2 | KontakteTab - Kontakt-CRUD (existierende Tabelle) | P0 |
| 3 | BriefTab - KI-Briefgenerator mit Lovable AI | P0 |
| 4 | DB-Migration: `letter_drafts` | P0 |
| 5 | Edge Function: `sot-letter-generate` | P0 |
| 6 | EmailTab - 3-Panel UI (statisch Phase 1) | P1 |
| 7 | KalenderTab - Termin-CRUD | P1 |
| 8 | DB-Migration: `calendar_events` | P1 |

---

## Ergebnis nach Abschluss

- **E-Mail-Tab**: 3-Panel-Layout mit Ordner-Sidebar (Eingang, Gesendet, Papierkorb, Archiv)
- **Briefgenerator**: Vollständiger AI-Workflow mit Kontakt-Picker, Prompt-Eingabe, WYSIWYG-Editor, PDF-Preview
- **Kontakte**: CRUD-Interface für `contacts`-Tabelle mit Quick-Actions
- **Kalender**: Monats-/Tagesansicht mit Termin-Erstellung

---

## Technische Details

### Datenbank-Migrationen (2 Tabellen)

1. `letter_drafts` - Für Briefgenerator
2. `calendar_events` - Für Kalender

### Edge Functions (1 neu)

1. `sot-letter-generate` - KI-Briefgenerierung via Lovable AI

### Shared Components (wiederverwendet)

- `DataTable` - Für Kontakt- und Mail-Liste
- `DetailDrawer` - Für Kontakt/Mail-Details
- `EmptyState` - Leere Zustände
- `SubTabNav` - Tab-Navigation

