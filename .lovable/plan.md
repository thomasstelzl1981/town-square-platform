
# Zone 1 KI-Office: Marketing-Automatisierungswaffe — Vollständiger Entwicklungsplan

## Executive Summary

Transformation des Zone 1 KI-Office von einem einfachen E-Mail-Client zu einer vollwertigen Marketing-Automatisierungsplattform mit:
- **Serien-E-Mail-Engine** für automatisierte Drip-Kampagnen
- **Konversations-Threading** für zusammenhängende E-Mail-Verläufe
- **KI-gestützter Antwort-Assistent** für schnelle, professionelle Reaktionen
- **Kontakt-Recherche & Enrichment** via Apollo/Firecrawl Integration
- **Segment-basiertes Targeting** nach Kontakt-Kategorien

---

## Aktuelle Analyse

### Vorhandene Infrastruktur
| Komponente | Status | Bewertung |
|------------|--------|-----------|
| admin_outbound_emails | ✅ Vorhanden | Basis-Versand funktioniert |
| admin_inbound_emails | ✅ Vorhanden | Empfang via Webhook |
| contacts (scope=zone1_admin) | ✅ Vorhanden | CRUD funktioniert |
| sot-admin-mail-send | ✅ Vorhanden | Resend-Integration |
| sot-contact-enrichment | ✅ Vorhanden | KI-Signatur-Extraktion |
| sot-apollo-search | ✅ Vorhanden | Apollo API-Integration |
| CommunicationHub.tsx | ⚠️ Skeleton | Nur Placeholder-Daten |

### Defizite
1. **Keine Serien-E-Mails** — Nur Einzelversand möglich
2. **Kein Konversations-Threading** — E-Mails nicht verknüpft
3. **Keine KI-Antwort-Hilfe** — Manuelle Antworten erforderlich
4. **Keine Segmentierung** — Keine Zielgruppen-Definition
5. **Keine Templates** — Jede E-Mail von Null
6. **Keine Kampagnen-Steuerung** — Kein Scheduling

---

## Implementierungsplan (8 Phasen)

### Phase 1: Datenbank-Erweiterung — Fundament

**Neue Tabellen:**

```sql
-- E-Mail-Templates für wiederverwendbare Inhalte
CREATE TABLE admin_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  category TEXT, -- 'onboarding', 'sales', 'follow_up', 'newsletter'
  variables JSONB DEFAULT '[]', -- [{name: 'VORNAME', description: '...'}]
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- E-Mail-Sequenzen (Drip-Kampagnen)
CREATE TABLE admin_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'manual', 'contact_created', 'tag_added'
  trigger_config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  target_categories TEXT[], -- ['Partner', 'Eigentümer', 'Makler']
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sequenz-Schritte (E-Mails in einer Serie)
CREATE TABLE admin_email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES admin_email_sequences ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  template_id UUID REFERENCES admin_email_templates,
  subject_override TEXT, -- Optional: Überschreibt Template-Subject
  body_override TEXT,    -- Optional: Überschreibt Template-Body
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  send_condition TEXT, -- 'always', 'if_not_replied', 'if_not_opened'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kontakt-Einschreibungen in Sequenzen
CREATE TABLE admin_email_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES admin_email_sequences ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'unsubscribed'
  current_step INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(sequence_id, contact_id)
);

-- E-Mail-Threading für Konversationen
CREATE TABLE admin_email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts,
  subject TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open', 'awaiting_reply', 'closed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Verknüpfung: Thread -> E-Mails
ALTER TABLE admin_outbound_emails ADD COLUMN thread_id UUID REFERENCES admin_email_threads;
ALTER TABLE admin_outbound_emails ADD COLUMN sequence_step_id UUID REFERENCES admin_email_sequence_steps;
ALTER TABLE admin_inbound_emails ADD COLUMN thread_id UUID REFERENCES admin_email_threads;

-- Kontakt-Tags für Segmentierung
CREATE TABLE admin_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contact_id, tag)
);

-- Recherche-Aufträge für Apollo/Firecrawl
CREATE TABLE admin_research_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'apollo_search', 'firecrawl_scrape', 'company_enrich'
  query_params JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  results_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

### Phase 2: Konversations-Threading — Zusammenhängende Darstellung

**Datei: `src/pages/admin/ki-office/AdminKiOfficeEmail.tsx`**

**Änderungen:**
- Refactoring von Tab-basierter Ansicht zu **3-Panel-Layout**:
  - Links: Thread-Liste (gruppiert nach Kontakt)
  - Mitte: Konversationsverlauf
  - Rechts: Kontakt-Details + Quick-Actions
- Automatische Thread-Gruppierung via `In-Reply-To` Header
- Ungelesene Badges pro Thread
- Schnellfilter: Alle | Offen | Wartet auf Antwort | Abgeschlossen

**Komponenten:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  KI-Office E-Mail                        [+ Neu] [Sequenzen ▼] │
├────────────────┬────────────────────────────┬───────────────────┤
│ THREADS        │ KONVERSATION               │ KONTAKT-DETAILS   │
│                │                            │                   │
│ 🔵 Max Müller  │ ← Von: max@firma.de        │ Max Müller        │
│    Betreff...  │   15.02.2026 14:32         │ Partner           │
│                │   "Guten Tag, ich..."      │ max@firma.de      │
│    Hans Meyer  │                            │ +49 170 123...    │
│    Re: Anfr... │ → An: max@firma.de         │                   │
│                │   15.02.2026 15:01         │ ─────────────────│
│ 🔵 Firma ABC   │   "Vielen Dank für..."     │ QUICK ACTIONS     │
│    Koopera...  │                            │ [📧 Antworten]    │
│                │ ← Von: max@firma.de        │ [🤖 KI-Antwort]   │
│                │   16.02.2026 09:15         │ [📋 In Sequenz]   │
│                │   "Ich habe noch..."       │ [🏷️ Tag hinzuf.]  │
│                │                            │                   │
│                │ ────────────────────────── │ TAGS              │
│                │ [KI-Antwort generieren]    │ #partner          │
│                │ [Schnellantwort...]        │ #hamburg          │
└────────────────┴────────────────────────────┴───────────────────┘
```

---

### Phase 3: Template-System — Wiederverwendbare E-Mails

**Neue Datei: `src/pages/admin/ki-office/AdminKiOfficeTemplates.tsx`**

**Features:**
- Template-Editor mit Live-Vorschau
- Variable-System: `{{VORNAME}}`, `{{FIRMA}}`, `{{KATEGORIE}}`
- Kategorien: Onboarding, Sales, Follow-Up, Newsletter
- Klonen & Bearbeiten
- A/B-Test Varianten (Phase 2)

**UI-Design:**
- Split-View: Liste links, Editor rechts
- Rich-Text-Editor für body_html
- Variable-Picker als Dropdown
- Test-Versand an eigene Adresse

---

### Phase 4: Serien-E-Mail-Engine — Drip-Kampagnen

**Neue Datei: `src/pages/admin/ki-office/AdminKiOfficeSequenzen.tsx`**

**Features:**
- Sequenz-Builder mit visueller Timeline
- Schritt-Konfiguration: Template, Delay, Bedingung
- Trigger-Typen: Manuell, Bei Kontakt-Erstellung, Bei Tag-Hinzufügen
- Zielgruppen-Filter nach Kategorie
- Echtzeit-Statistiken: Gesendet, Geöffnet, Beantwortet, Abgemeldet

**Sequenz-Ablauf:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  SEQUENZ: Partner-Onboarding                      [▶ Aktivieren]│
├─────────────────────────────────────────────────────────────────┤
│  Trigger: Bei Tag "neuer_partner"                               │
│  Zielgruppen: Partner, Makler                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ Schritt │    │ Schritt │    │ Schritt │    │ Schritt │      │
│  │    1    │───▶│    2    │───▶│    3    │───▶│    4    │      │
│  │ Sofort  │    │ +3 Tage │    │ +7 Tage │    │ +14 Tage│      │
│  │         │    │ if !rep │    │ if !rep │    │ always  │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│   Willkommen    Follow-Up 1    Follow-Up 2    Abschluss        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  STATISTIKEN                                                    │
│  Eingeschrieben: 45 | Aktiv: 32 | Abgeschlossen: 10 | Abge.: 3 │
└─────────────────────────────────────────────────────────────────┘
```

**Edge Function: `sot-admin-sequence-runner`**
- Scheduled via Cron (alle 15 Min)
- Prüft `next_send_at` für alle aktiven Enrollments
- Evaluiert Bedingungen (if_not_replied, if_not_opened)
- Sendet via bestehender `sot-admin-mail-send`
- Aktualisiert Enrollment-Status

---

### Phase 5: KI-Antwort-Assistent — Armstrong für E-Mails

**Neue Datei: `src/components/admin/ki-office/AIReplyAssistant.tsx`**

**Features:**
- "KI-Antwort generieren" Button in jeder Konversation
- Kontext-Injection: Bisheriger Thread + Kontakt-Daten + KB-Wissen
- 3 Antwort-Optionen: Kurz, Ausführlich, Verkaufsorientiert
- Ein-Klick-Übernahme in Compose-Dialog
- Bearbeiten vor Senden möglich

**Integration mit Armstrong:**
```typescript
// Neue Armstrong-Action für Zone 1
{
  action_code: "ARM.Z1.DRAFT_EMAIL_REPLY",
  title_de: "E-Mail-Antwort entwerfen",
  zones: ["Z1"],
  module: "KI-Office",
  execution_mode: "draft_only",
  input_schema: {
    thread_id: "uuid",
    tone: "kurz" | "ausfuehrlich" | "verkauf"
  }
}
```

---

### Phase 6: Kontakt-Recherche & Enrichment — Lead-Generierung

**Neue Datei: `src/pages/admin/ki-office/AdminKiOfficeRecherche.tsx`**

**Features:**
- Apollo-Suche direkt aus Zone 1
- Suchkriterien: Branche, Region, Titel, Firmengröße
- Ergebnis-Preview mit Enrichment-Daten
- Bulk-Import in Kontakte
- Firecrawl-Integration für Website-Scraping

**Workflow:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  KONTAKT-RECHERCHE                                              │
├─────────────────────────────────────────────────────────────────┤
│  SUCHKRITERIEN                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Branche: [Immobilienmakler ▼]                              │ │
│  │ Region:  [Hamburg, Schleswig-Holstein ▼]                   │ │
│  │ Titel:   [Geschäftsführer, Inhaber ▼]                      │ │
│  │ Firma:   [mind. 5 Mitarbeiter ▼]                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [🔍 Suche starten]                                             │
├─────────────────────────────────────────────────────────────────┤
│  ERGEBNISSE (47 gefunden)                    [☑ Alle auswählen] │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ☑ Max Mustermann | Mustermakler GmbH | Hamburg             │ │
│  │   📧 max@mustermakler.de | 📱 +49 40 123456               │ │
│  │ ☑ Erika Beispiel | Norddeutsche Immobilien | Kiel          │ │
│  │   📧 erika@ndi.de | 📱 +49 431 789012                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  [📥 47 Kontakte importieren] [📋 In Sequenz einschreiben]      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 7: Erweiterte Kontaktverwaltung — Segmentierung

**Datei: `src/pages/admin/ki-office/AdminKiOfficeKontakte.tsx` (Erweitern)**

**Neue Features:**
- **Tag-System**: Mehrere Tags pro Kontakt
- **Dynamische Segmente**: "Alle Partner in Hamburg"
- **Bulk-Aktionen**: Mehrere Kontakte → Sequenz, Tag, E-Mail
- **Enrichment-Status**: "Angereichert", "Ausstehend", "Fehlgeschlagen"
- **Kommunikations-Historie**: Alle E-Mails zum Kontakt inline

**UI-Erweiterungen:**
- Tag-Chips in Tabelle
- Filter nach Tags
- Kontakt-Merge bei Duplikaten
- Export als CSV

---

### Phase 8: KI-Office Dashboard — Zentrale Übersicht

**Neue Datei: `src/pages/admin/ki-office/AdminKiOfficeDashboard.tsx`**

**KPIs:**
- Gesendete E-Mails (Woche/Monat)
- Öffnungsrate & Antwortrate
- Aktive Sequenzen & Einschreibungen
- Neue Kontakte via Recherche
- Top-performende Templates

**Widgets:**
- Letzte Aktivitäten (Timeline)
- Ausstehende Antworten (Action Required)
- Sequenz-Performance-Chart
- Kontakt-Wachstum

---

## Technische Architektur

### Neue Sidebar-Struktur für KI Office

```typescript
// routesManifest.ts — Zone 1 KI-Office erweitern
{ path: "ki-office", component: "AdminKiOfficeDashboard", title: "KI-Office" },
{ path: "ki-office/email", component: "AdminKiOfficeEmail", title: "E-Mail" },
{ path: "ki-office/sequenzen", component: "AdminKiOfficeSequenzen", title: "Sequenzen" },
{ path: "ki-office/templates", component: "AdminKiOfficeTemplates", title: "Templates" },
{ path: "ki-office/kontakte", component: "AdminKiOfficeKontakte", title: "Kontakte" },
{ path: "ki-office/recherche", component: "AdminKiOfficeRecherche", title: "Recherche" },
```

### Neue Edge Functions

| Function | Zweck |
|----------|-------|
| `sot-admin-sequence-runner` | Cron-Job für Serien-E-Mails |
| `sot-admin-email-ai-reply` | KI-Antwort via Armstrong |
| `sot-admin-contact-search` | Apollo-Integration für Zone 1 |
| `sot-admin-contact-import` | Bulk-Import aus Recherche |

### Cron-Schedule

```toml
# supabase/config.toml
[functions.sot-admin-sequence-runner]
verify_jwt = false
schedule = "*/15 * * * *" # Alle 15 Minuten
```

---

## Neue Dateien (Zusammenfassung)

| Datei | Beschreibung |
|-------|--------------|
| `src/pages/admin/ki-office/AdminKiOfficeDashboard.tsx` | KI-Office Dashboard |
| `src/pages/admin/ki-office/AdminKiOfficeSequenzen.tsx` | Serien-E-Mail-Builder |
| `src/pages/admin/ki-office/AdminKiOfficeTemplates.tsx` | Template-Verwaltung |
| `src/pages/admin/ki-office/AdminKiOfficeRecherche.tsx` | Kontakt-Recherche |
| `src/components/admin/ki-office/ThreadList.tsx` | Thread-Liste |
| `src/components/admin/ki-office/ConversationView.tsx` | Konversations-Ansicht |
| `src/components/admin/ki-office/AIReplyAssistant.tsx` | KI-Antwort-Hilfe |
| `src/components/admin/ki-office/SequenceBuilder.tsx` | Sequenz-Editor |
| `src/components/admin/ki-office/TemplateEditor.tsx` | Template-Editor |
| `src/components/admin/ki-office/ContactTagManager.tsx` | Tag-Verwaltung |
| `src/hooks/useAdminEmailThreads.ts` | Thread-Daten-Hook |
| `src/hooks/useAdminSequences.ts` | Sequenz-Daten-Hook |
| `supabase/functions/sot-admin-sequence-runner/index.ts` | Sequenz-Cron |
| `supabase/functions/sot-admin-email-ai-reply/index.ts` | KI-Antwort |
| `supabase/functions/sot-admin-contact-search/index.ts` | Apollo-Search Zone 1 |

---

## Zielgruppen-Fokus

Das System ist optimiert für die drei Hauptzielgruppen:

| Zielgruppe | Sequenz-Beispiele | Kategorien |
|------------|-------------------|------------|
| **Vertriebspartner** | Onboarding-Serie, Produkt-Updates, Provisionserinnerungen | Partner, Makler |
| **Immobilieneigentümer** | Verkaufs-Outreach, Bewertungsangebote, Case Studies | Eigentümer |
| **Finanzierungskunden** | Finanzierungs-Leads, Beratungsangebote, Nachfass-Sequenzen | Bank, Interessent |

---

## Akzeptanzkriterien

- [ ] Serien-E-Mails laufen automatisch nach Zeitplan
- [ ] E-Mail-Konversationen werden gruppiert dargestellt
- [ ] KI kann Antwort-Vorschläge generieren
- [ ] Kontakte können via Apollo recherchiert werden
- [ ] Bulk-Import funktioniert reibungslos
- [ ] Templates sind wiederverwendbar
- [ ] Dashboard zeigt alle relevanten KPIs
- [ ] Tags ermöglichen flexible Segmentierung
