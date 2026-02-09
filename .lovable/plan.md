
# MOD-14 Social — Phasenplan + Armstrong-Audit-Integration

## Kernentscheidung: Audit ueber Armstrong

Das Social Personality Audit wird NICHT als eigene UI mit 15 separaten Cards gebaut, sondern als **gesteuerter Armstrong-Dialog**. Der User klickt auf der Audit-Seite "Audit starten", Armstrong oeffnet sich und fuehrt das strukturierte Interview durch — Frage fuer Frage, per Voice oder Text.

### Warum das besser ist

- Armstrong hat bereits Voice-Input (WebSocket zu OpenAI Realtime API via `sot-armstrong-voice`)
- Armstrong hat bereits Text-Chat (via `sot-armstrong-advisor`)
- Der User spricht natuerlich — genau das, was wir fuer authentische Personality-Daten brauchen
- Kein separates UI-Recording noetig, Armstrong transkribiert bereits
- Das Gespraech fuehlt sich menschlich an, nicht wie ein Formular

### Technische Umsetzung

Der `sot-armstrong-advisor` bekommt einen neuen **Flow-Modus**: `SOCIAL_AUDIT`. Wenn der User auf der Social-Audit-Seite "Audit starten" klickt, wird Armstrong mit einem speziellen Context geoeffnet, der den Advisor in den Audit-Modus versetzt.

```text
AuditPage.tsx                     ArmstrongContainer
    |                                    |
    | -- "Audit starten" Button -------> |
    |    (setzt audit_flow context)      |
    |                                    |
    |    Armstrong oeffnet sich          |
    |    mit Audit-Systemprompt          |
    |                                    |
    |    Frage 1 (Voice/Text)            |
    |    Antwort User                    |
    |    Frage 2 ...                     |
    |    ...                             |
    |    Frage 15                        |
    |                                    |
    | <-- Audit Complete Event --------- |
    |    (personality_vector gespeichert) |
    |                                    |
    |    AuditPage zeigt Ergebnis        |
```

**Mechanismus:**
1. `useArmstrongAdvisor` erhaelt eine neue Methode `startFlow(flowType, flowConfig)` die einen speziellen System-Context an den Advisor sendet
2. Der `sot-armstrong-advisor` erkennt `flow_type: "social_audit"` und wechselt in den Interviewmodus mit den 15 definierten Fragen
3. Armstrong stellt jede Frage natuerlich, wartet auf Antwort, gibt kurze Bestaetigung, naechste Frage
4. Nach Frage 15: Armstrong fasst zusammen, generiert `personality_vector`, speichert in `social_personality_profiles`
5. Armstrong sendet ein `RESULT`-Event mit `action_code: "social_audit_complete"` zurueck, das die AuditPage als Signal nutzt

---

## Phasenplan als Entwicklungsdokument

Das folgende wird als `docs/modules/MOD-14_SOCIAL_PLAN.md` im Repo abgelegt — unsere SSOT fuer die strukturierte Abarbeitung.

### PHASE 0 — Plandokument + Manifest-Check
**Status:** Diese Phase
**Deliverables:**
- `docs/modules/MOD-14_SOCIAL_PLAN.md` erstellen
- Verify: routesManifest hat Social-Tile unter MOD-14
- Verify: CommunicationProPage routet `/social` korrekt
- Keine Code-Aenderungen

### PHASE 1 — Datenmodell (SQL Migrations)
**Tabellen (9):**
1. `social_personality_profiles` (answers_raw jsonb, personality_vector jsonb)
2. `social_topics` (topic_label, priority 1-10, topic_briefing jsonb)
3. `social_inspiration_sources` (platform, display_name, profile_url)
4. `social_inspiration_samples` (content_text, extracted_patterns jsonb)
5. `social_inbound_items` (source, moment_voice_text, desired_effect, status)
6. `social_drafts` (content_linkedin, content_instagram, content_facebook, storyboard jsonb, status)
7. `social_metrics` (platform, impressions, likes, comments, saves)
8. `social_video_jobs` (provider, job_type, status, input_payload jsonb)
9. `social_assets` (document_id, tags text[], asset_type)

**RLS:** Alle tenant-scoped ueber `profiles.active_tenant_id`
**Keine UI in dieser Phase.**

### PHASE 2 — UI Skeleton + Routing + Empty States
**Dateien (neu):**
- `src/pages/portal/communication-pro/social/SocialPage.tsx` — Wrapper mit Sidebar + nested Routes
- `src/pages/portal/communication-pro/social/SocialSidebar.tsx` — 9-Punkt Navigation
- 9 leere Seiten mit Empty States (OverviewPage, AuditPage, InspirationPage, KnowledgePage, InboundPage, AssetsPage, CreatePage, CalendarPage, PerformancePage)

**Aenderungen (bestehend):**
- `CommunicationProPage.tsx`: `social/*` Route auf SocialPage umleiten

**Keine Backend-Logik, nur Navigation + Layout.**

### PHASE 3 — Armstrong Audit Flow (Kern-Innovation)
**Aenderungen:**
- `useArmstrongAdvisor.ts`: Neue Methode `startFlow(flowType, flowConfig)` + Flow-State-Management
- `sot-armstrong-advisor/index.ts`: Neuer Flow-Handler `SOCIAL_AUDIT` mit 15 Fragen, Fortschrittsverfolgung, Zusammenfassung
- `AuditPage.tsx`: "Audit starten" Button der Armstrong oeffnet + Flow startet; Ergebnis-Anzeige nach Completion
- Edge Function speichert Ergebnis in `social_personality_profiles`

**Armstrong fuehrt das Interview:**
- 15 Fragen in 4 Bloecken (Identitaet, Haltung, Sprache, Grenzen)
- Voice-first (bestehendes `useArmstrongVoice` wird automatisch genutzt)
- Text-Fallback (normaler Chat-Input)
- Fortschritt wird im Chat sichtbar ("Frage 7 von 15")
- Am Ende: Sample-Post-Preview als DRAFT-Response

### PHASE 4 — Knowledge Base (Topics + Briefings)
**Dateien:**
- `KnowledgePage.tsx`: Topic-Chips (max 10), Drag/Drop Priority (dnd-kit), "KI befuellt Briefings" Button
- Edge Function `sot-social-generate-briefing/index.ts`: Nimmt Topics + personality_vector, generiert Briefings via Lovable AI
- Speicherung in `social_topics.topic_briefing`

### PHASE 5 — Inspiration (Quellen + Patterns)
**Dateien:**
- `InspirationPage.tsx`: Liste (max 10 Quellen), Beispielpost-Upload/Paste
- Edge Function `sot-social-extract-patterns/index.ts`: Extrahiert hook_types, structures, cta_patterns
- Speicherung in `social_inspiration_samples.extracted_patterns`

### PHASE 6 — Assets (Foto Library)
**Dateien:**
- `AssetsPage.tsx`: Upload (max 20 Portraits), Tag-Editor, Galerie
- DMS Integration ueber bestehendes `useUniversalUpload` + document_links

### PHASE 7 — Individual Content (Inbound Studio)
**Dateien:**
- `InboundPage.tsx`: Inbox-Liste + Upload + Minimal-Dialog (Moment/Effekt/Level)
- Edge Function `sot-social-draft-generate/index.ts`: Generiert 3 LinkedIn-Varianten + Meta Caption + Storyboard
- Nutzt personality_vector + topics + inspiration_patterns als Pflicht-Input

### PHASE 8 — Content Creation + Copywriter Editor (Hauptwert)
**Dateien:**
- `CreatePage.tsx`: 3-Schritt Generator (Format → Grundlage → Entwurf)
- `components/DraftEditor.tsx`: Platform-Tabs + Preview
- `components/CopywriterToolbar.tsx`: 10 Buttons (Kuerzer, Emotionaler, Direkter, etc.)
- Edge Function `sot-social-draft-rewrite/index.ts`: Copywriter-Aktionen
- Speicherung in `social_drafts`

### PHASE 9 — Kalender + Manual Posted
**Dateien:**
- `CalendarPage.tsx`: Wochenansicht + Liste, Plan-Draft, Status-Workflow (draft → ready → planned → posted_manual)
- Kein Auto-Posting

### PHASE 10 — Performance Light
**Dateien:**
- `PerformancePage.tsx`: Manuelle Metriken pro Post, KI-Analyse "Was hat funktioniert?"
- Edge Function `sot-social-analyze-performance/index.ts`

### PHASE 11 — HeyGen Prep (nur Stubs)
**Dateien:**
- Draft Editor: Button "Video daraus machen (HeyGen)" — disabled
- `social_video_jobs` wird mit provider=stub befuellt
- Integrations-Slot in Profil vorbereitet (kein echter API-Call)

### PHASE 12 — QA / Smoke Tests
- E2E-Pfad: Audit (via Armstrong) → Topics → Inspiration → Create → Calendar → Posted → Performance
- Manifest-Konsistenz pruefen
- Mobile UX validieren

---

## Arbeitsweise

Jede Phase wird einzeln beauftragt mit Verweis auf dieses Dokument:
"Bitte implementiere Phase X gemaess `docs/modules/MOD-14_SOCIAL_PLAN.md`"

So bleibt der Pfad erhalten, auch wenn zwischendurch Rueckfragen kommen.

## Naechster Schritt

Phase 0: Das Plandokument `docs/modules/MOD-14_SOCIAL_PLAN.md` anlegen und die Manifest-/Routing-Checks durchfuehren. Danach Phase 1 (Datenmodell) als separater Auftrag.
