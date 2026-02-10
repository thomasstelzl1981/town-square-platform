
# Recherchemodul — MOD-02 KI Office Integration

## Zusammenfassung

Ein 3-Kachel-Recherche-Feature wird als dritter Tab innerhalb der bestehenden Widgets-Seite (`/portal/office/widgets`) integriert. Es bietet kostenlose Webrecherche, kostenpflichtige Kontaktrecherche (Apollo) und eine Uebernahme-Funktion ins zentrale Kontaktbuch mit Credit-Verbrauch.

---

## 1. Navigation (kein neues Modul)

Recherche wird als **dritter Tab** in der bestehenden `WidgetsTab.tsx` eingebaut:

```text
Tabs in /portal/office/widgets:
  [Systemwidgets] [Aufgaben] [Recherche]   <-- NEU
```

Kein neuer Manifest-Eintrag noetig. Die WidgetsTab hat bereits eine Tabs-Komponente mit 2 Tabs — wir fuegen einen dritten hinzu.

---

## 2. UI-Komponenten (3 Kacheln im Recherche-Tab)

### Layout
Desktop: 3 Kacheln nebeneinander (`grid grid-cols-1 lg:grid-cols-3 gap-4`)
Mobile: gestapelt

### Kachel 1 — Allgemeine Recherche (Free)
- Textarea: "Was moechtest du recherchieren?"
- Optional: Dropdown "Recherche-Ziel" (Markt, Firma, Person, Objekt, News, Tech, Sonstiges)
- Button: "Suchen (Free)" mit Search-Icon
- Ergebnis-Bereich: Markdown-Summary + Quellenliste + Stichpunkte
- Empty State: Erklaerungstext + Beispieleingaben

### Kachel 2 — Profi-Kontaktrecherche (Pro)
- Eingabefelder: Firma/Domain, Branche, Rolle, Region, Keywords
- KI-Assist Button: "Schlage Filter vor" (Stub)
- Button: "Kontakte suchen (Pro)" mit Users-Icon
- Info: "Max. 25 Kandidaten pro Suche"
- Ergebnis-Zaehler: "X Kandidaten gefunden → Kachel 3"
- Empty State (kein Apollo-Key): "Pro-Integration nicht aktiv" + Hinweis

### Kachel 3 — Gefundene Kontakte (Uebernahme)
- Tabelle/Liste der ContactCandidates mit:
  - Checkbox pro Zeile
  - Name, Rolle, Firma, Ort, E-Mail (masked), Confidence-Badge
  - Status-Badge (new/reviewed/imported/rejected)
  - "Details"-Button (oeffnet Preview-Drawer)
- Bulk-Aktion: "Ausgewaehlte uebernehmen (n Credits)"
- Credit-Bestaetigung vor Import (Modal)
- Duplikat-Warnung wenn aehnliche contacts existieren
- Empty State: "Keine Treffer. Starte eine Pro-Suche."

### Neue Dateien
- `src/pages/portal/office/ResearchTab.tsx` — Container mit 3 Kacheln
- `src/pages/portal/office/components/ResearchFreeCard.tsx`
- `src/pages/portal/office/components/ResearchProCard.tsx`
- `src/pages/portal/office/components/ResearchCandidatesTray.tsx`
- `src/pages/portal/office/components/CandidatePreviewDrawer.tsx`
- `src/pages/portal/office/components/CreditConfirmModal.tsx`

---

## 3. Datenmodell (3 neue Tabellen + credit_ledger)

### 3.1 research_sessions
```sql
CREATE TABLE research_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  mode text NOT NULL CHECK (mode IN ('free','pro_contacts')),
  query_text text NOT NULL,
  query_json jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  created_at timestamptz DEFAULT now()
);
-- RLS: tenant_id via memberships
```

### 3.2 research_results
```sql
CREATE TABLE research_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text,
  summary_md text,
  sources_json jsonb DEFAULT '[]',
  entities_json jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
-- RLS: tenant_id via memberships
```

### 3.3 contact_candidates
```sql
CREATE TABLE contact_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text,
  first_name text,
  last_name text,
  role text,
  company text,
  domain text,
  location text,
  email text,
  phone text,
  source_json jsonb DEFAULT '{}',
  confidence numeric(3,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','imported','rejected')),
  imported_contact_id uuid REFERENCES contacts(id),
  created_at timestamptz DEFAULT now()
);
-- RLS: tenant_id via memberships
```

### 3.4 credit_ledger (NEU)
Die bestehende `billing_usage` ist ein Aggregat-Zaehler, kein Ledger. Fuer Einzel-Transaktionen brauchen wir:

```sql
CREATE TABLE credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  kind text NOT NULL,
  amount integer NOT NULL,
  ref_type text,
  ref_id uuid,
  created_at timestamptz DEFAULT now()
);
-- kind: 'contact_import', 'research_pro', etc.
-- amount: negativ = Verbrauch, positiv = Aufladung
-- RLS: tenant_id via memberships (SELECT only, INSERT via RPC)
```

---

## 4. Edge Functions (Stubs)

### 4.1 sot-research-free
- Empfaengt: `{ query_text, research_target? }`
- Erstellt `research_sessions` (mode='free')
- Ruft Firecrawl auf (Web-Suche/Scrape) — Stub: returns mock data
- Ruft Lovable AI auf (Summarize/Extract) — Stub: returns mock summary
- Speichert `research_results`
- Returniert: `{ session_id, result }`

### 4.2 sot-research-pro-contacts
- Empfaengt: `{ company, domain, role, region, keywords, limit=25 }`
- Erstellt `research_sessions` (mode='pro_contacts')
- Ruft Apollo API auf — Stub: returns mock candidates
- Speichert `contact_candidates`
- Returniert: `{ session_id, candidates[] }`

### 4.3 sot-contacts-import
- Empfaengt: `{ candidate_ids[] }`
- Prueft Credits (credit_ledger balance >= n)
- Duplikatpruefung (email/company fuzzy)
- Upserted in `contacts`
- Schreibt `credit_ledger` Eintraege (-1 pro Kontakt)
- Updated `contact_candidates.status` = 'imported'
- Returniert: `{ contacts[], credits_consumed, duplicates_skipped }`

---

## 5. Armstrong Actions (4 neue)

In `armstrongManifest.ts` unter MOD-02 hinzufuegen:

| Action Code | Titel | Risk | Cost | Execution |
|---|---|---|---|---|
| ARM.MOD02.RESEARCH_FREE | Allgemeine Recherche | low | free | execute |
| ARM.MOD02.RESEARCH_PRO | Profi-Kontaktrecherche | low | credits | execute_with_confirmation |
| ARM.MOD02.IMPORT_CANDIDATES | Kontakte uebernehmen | low | credits | execute_with_confirmation |
| ARM.MOD02.DEDUPE_SUGGEST | Duplikatpruefung | low | free | execute |

---

## 6. Integration Registry

Firecrawl und Apollo sind bereits registriert. Nur IPFI muss hinzugefuegt werden:

```sql
INSERT INTO integration_registry (code, name, type, status, description, secret_ref)
VALUES ('IPFI', 'IPFI Recherche', 'api', 'pending_setup', 'Auxiliary research provider', 'IPFI_API_KEY');
```

---

## 7. Demo-Daten (Seed)

2 Beispiel-Sessions + 10 Beispiel-Candidates damit die UI sofort lebt:

- Free Session: "Marktanalyse Eigentumswohnungen Leipzig 2026" mit Summary + 5 Quellen
- Pro Session: "Hausverwaltungen Muenchen, GF" mit 10 Kandidaten (verschiedene Status: new, reviewed, imported)

Werden als statische Demo-Daten im Frontend gehalten (wie bei WidgetsTab), spaeter durch React Query ersetzt.

---

## 8. Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| `src/pages/portal/office/WidgetsTab.tsx` | Dritter Tab "Recherche" hinzufuegen |
| `src/pages/portal/office/ResearchTab.tsx` | NEU — 3-Kachel Container |
| `src/pages/portal/office/components/ResearchFreeCard.tsx` | NEU — Kachel 1 |
| `src/pages/portal/office/components/ResearchProCard.tsx` | NEU — Kachel 2 |
| `src/pages/portal/office/components/ResearchCandidatesTray.tsx` | NEU — Kachel 3 |
| `src/pages/portal/office/components/CandidatePreviewDrawer.tsx` | NEU — Detail-Drawer |
| `src/pages/portal/office/components/CreditConfirmModal.tsx` | NEU — Credit-Bestaetigung |
| `src/manifests/armstrongManifest.ts` | 4 neue Actions (Research + Import) |
| `supabase/functions/sot-research-free/index.ts` | NEU — Edge Function Stub |
| `supabase/functions/sot-research-pro-contacts/index.ts` | NEU — Edge Function Stub |
| `supabase/functions/sot-contacts-import/index.ts` | NEU — Edge Function Stub |
| DB Migration | 3 Tabellen + credit_ledger + RLS |
| DB Migration | IPFI Integration Registry Eintrag |
