

# MOD-14 Telefonassistent — MVP Umsetzungsplan

## Ziel

Den leeren "Kommt bald"-Platzhalter unter `/portal/communication-pro/ki-telefon` durch eine vollstaendige, durchscrollbare Inline-Seite ersetzen. Kein Provider-Connect, keine externe API. Konfiguration + Persistierung + Call-Log + Test-Event-Generator.

---

## 1. Datenbank (2 Tabellen + RLS)

### Tabelle: `commpro_phone_assistants`

```sql
create table public.commpro_phone_assistants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Mein Telefonassistent',
  is_enabled boolean not null default false,
  -- Voice
  voice_provider text null,
  voice_preset_key text not null default 'professional_warm',
  voice_settings jsonb not null default '{"stability":70,"clarity":80,"speed":50}'::jsonb,
  -- Content
  first_message text not null default '',
  behavior_prompt text not null default '',
  -- Rules
  rules jsonb not null default '{"ask_clarify_once":true,"collect_name":true,"confirm_callback_number":true,"collect_reason":true,"collect_urgency":false,"collect_preferred_times":false,"max_call_seconds":120}'::jsonb,
  -- Documentation
  documentation jsonb not null default '{"email_enabled":false,"email_target":"","portal_log_enabled":true,"auto_summary":true,"extract_tasks":true,"retention_days":90}'::jsonb,
  -- Phone binding placeholder
  forwarding_number_e164 text null,
  binding_status text not null default 'pending',
  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);
alter table public.commpro_phone_assistants enable row level security;
create policy "Users manage own assistant" on public.commpro_phone_assistants
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

### Tabelle: `commpro_phone_call_sessions`

```sql
create table public.commpro_phone_call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assistant_id uuid not null references public.commpro_phone_assistants(id) on delete cascade,
  direction text not null default 'inbound',
  from_number_e164 text not null,
  to_number_e164 text null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  duration_sec int null,
  status text not null default 'logged',
  transcript_text text null,
  summary_text text null,
  action_items jsonb not null default '[]'::jsonb,
  match jsonb not null default '{"matched_type":"none","matched_id":null,"match_type":"none"}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.commpro_phone_call_sessions enable row level security;
create policy "Users manage own calls" on public.commpro_phone_call_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index idx_call_sessions_user on public.commpro_phone_call_sessions(user_id, started_at desc);
create index idx_call_sessions_assistant on public.commpro_phone_call_sessions(assistant_id, started_at desc);
```

---

## 2. Routing

Keine Aenderungen noetig. Die Route `ki-telefon` existiert bereits im Manifest (MOD-14) und in `CommunicationProPage.tsx`. Wir ersetzen lediglich den Inhalt von `KiTelefonPage.tsx`.

---

## 3. UI-Architektur (eine Seite, 7 Sections)

Die Seite wird in `KiTelefonPage.tsx` komplett neu aufgebaut. Jede Section ist eine eigene Komponente in einem neuen Ordner `src/components/communication-pro/phone-assistant/`.

### Section A: Status und Rufweiterleitung
**Komponente:** `StatusForwardingCard.tsx`
- Toggle: "Assistent aktiv" (steuert `is_enabled`)
- Read-only Feld: Weiterleitungsnummer (zeigt `forwarding_number_e164` oder Platzhalter "Wird nach Provider-Connect vergeben")
- Badge: `pending` / `active` / `error`
- Copy-Button (disabled im MVP, Tooltip "Noch nicht verfuegbar")
- Info-Box mit Rufumleitungs-Empfehlung (GSM/Carrier)

### Section B: Stimme
**Komponente:** `VoiceSettingsCard.tsx`
- Disabled Dropdown "Voice Provider (spaeter)" mit Hinweis "Connect folgt"
- 6 selektierbare Preset-Cards in einem Grid:
  - `professional_warm` (Default), `professional_crisp`, `friendly_calm`, `energetic_clear`, `serious_formal`, `soft_supportive`
- 3 Slider (Radix Slider): Stabilitaet, Klarheit, Tempo (0-100)
- Mini-Vorschau: Zeigt die `first_message` als Text-Preview ("So klingt es spaeter")

### Section C: Begruessung und Verhalten
**Komponente:** `ContentCard.tsx`
- Input: "Erste Begruessung" mit Placeholder "Hallo! Du sprichst mit dem Assistenten von {Name}. Wie kann ich helfen?"
- Textarea: "Verhalten (Kurz-Prompt)" max 2000 Zeichen mit Zeichenzaehler
- Helper-Text: "Ziel: Anliegen erfassen, Rueckrufgrund + Dringlichkeit + Kontaktdaten."

### Section D: Reaktionslogik
**Komponente:** `RulesCard.tsx`
- 6 Checkboxen (aus `rules` JSON):
  - Einmal nachfragen wenn unverstaendlich
  - Name erfassen
  - Rueckrufnummer bestaetigen
  - Grund des Anrufs erfassen
  - Dringlichkeit abfragen
  - Wunschzeiten abfragen
- Select/Dropdown: Max. Gespraechsdauer (60/120/180 Sekunden)

### Section E: Dokumentation und Benachrichtigung
**Komponente:** `DocumentationCard.tsx`
- Toggle: E-Mail Benachrichtigung (wenn aktiv: Eingabefeld `email_target`)
- Toggle: Portal-Eintrag erstellen (default ON)
- Toggle: Automatische Zusammenfassung (default ON)
- Toggle: Aufgaben extrahieren (default ON)
- Dropdown: Aufbewahrung (30/90/365 Tage)

### Section F: Test und Vorschau
**Komponente:** `TestPreviewCard.tsx`
- Button "Test-Anrufereignis erzeugen": Erstellt einen Dummy-Eintrag in `commpro_phone_call_sessions` mit `status = 'test'`, zufaelliger Nummer, kurzem Transkript, Summary und 2-4 Action-Items
- Button "Testdaten loeschen": Loescht alle Eintraege mit `status = 'test'`
- Toast-Feedback nach beiden Aktionen

### Section G: Call-Log
**Komponente:** `CallLogSection.tsx` + `CallDetailDrawer.tsx`
- Tabelle (neueste oben): Datum/Uhrzeit, Anrufernummer, Summary (1 Zeile), Status-Badge (`test`/`processed`/`logged`), Button "Details"
- Empty State: "Noch keine Anrufe dokumentiert." + Button "Test-Eintrag erzeugen"
- Detail-Drawer (Sheet/Drawer, kein Seitenwechsel):
  - Transkript (vollstaendig)
  - Zusammenfassung
  - Action-Items als Checkbox-Liste
  - CTA "Zuordnen" (MVP: UI-Placeholder, speichert in `match` JSON)

---

## 4. Hook: `usePhoneAssistant.ts`

**Datei:** `src/hooks/usePhoneAssistant.ts`

- **Auto-Create:** Beim ersten Laden pruefen, ob ein Eintrag in `commpro_phone_assistants` existiert. Falls nein: automatisch Default-Row anlegen.
- **Autosave:** Aenderungen per Debounce (500ms) speichern. "Gespeichert"-Indicator in der UI.
- **CRUD fuer Call-Sessions:** Query (neueste zuerst), Create (Test-Event), Delete (nur `status = 'test'`).
- React Query fuer beide Tabellen.

---

## 5. Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| DB | Migration: `commpro_phone_assistants` + `commpro_phone_call_sessions` + RLS |
| EDIT | `src/pages/portal/communication-pro/ki-telefon/KiTelefonPage.tsx` — Komplett neu: PageShell + 7 Sections |
| NEU | `src/components/communication-pro/phone-assistant/StatusForwardingCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/VoiceSettingsCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/ContentCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/RulesCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/DocumentationCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/TestPreviewCard.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/CallLogSection.tsx` |
| NEU | `src/components/communication-pro/phone-assistant/CallDetailDrawer.tsx` |
| NEU | `src/hooks/usePhoneAssistant.ts` |

---

## 6. Akzeptanzkriterien

1. Menuepunkt "KI-Telefonassistent" in MOD-14 zeigt vollstaendige, nutzbare UI statt Platzhalter
2. Assistenten-Konfiguration wird in der Datenbank persistiert und bleibt nach Reload erhalten (Autosave)
3. Test-Anrufereignis kann erzeugt, in der Liste angezeigt und im Drawer geoeffnet werden
4. Testdaten koennen einzeln per "Testdaten loeschen" entfernt werden
5. UI funktioniert vollstaendig ohne Provider/API und wirkt nicht "leer" (starke Empty States, Test-Button prominent)
6. Voice-Provider-Dropdown ist sichtbar aber disabled — spaeterer Connect dockt hier an
7. Binding-Status bleibt auf `pending` — spaetere Rufnummernvergabe aendert nur dieses Feld

