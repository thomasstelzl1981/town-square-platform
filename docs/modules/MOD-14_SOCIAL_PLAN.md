# MOD-14: Social — Phasenplan (SSOT)

> **Letzte Aktualisierung:** 2026-02-09
> **Status:** Phase 0 abgeschlossen
> **Nächste Phase:** Phase 1 (Datenmodell)

---

## Kernentscheidung: Audit über Armstrong

Das Social Personality Audit wird als **gesteuerter Armstrong-Dialog** implementiert.
Der User klickt "Audit starten", Armstrong öffnet sich und führt das strukturierte
15-Fragen-Interview durch — per Voice oder Text.

**Mechanismus:**
1. `useArmstrongAdvisor` erhält `startFlow(flowType, flowConfig)`
2. `sot-armstrong-advisor` erkennt `flow_type: "social_audit"` → Interviewmodus
3. Armstrong stellt 15 Fragen natürlich, wartet auf Antwort, nächste Frage
4. Nach Frage 15: Zusammenfassung + `personality_vector` → `social_personality_profiles`
5. `RESULT`-Event mit `action_code: "social_audit_complete"` → AuditPage zeigt Ergebnis

---

## Phasen

### PHASE 0 — Plandokument + Manifest-Check ✅
- [x] `docs/modules/MOD-14_SOCIAL_PLAN.md` erstellen
- [x] Verify: routesManifest hat Social-Tile unter MOD-14 (Zeile 406)
- [x] Verify: CommunicationProPage routet `/social` korrekt (Zeile 103)
- [x] Keine Code-Änderungen nötig

---

### PHASE 1 — Datenmodell (SQL Migrations) ✅
**Status:** Abgeschlossen (2026-02-09)

**9 Tabellen (alle tenant-scoped, RLS über `profiles.active_tenant_id`):**

1. **`social_personality_profiles`**
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `audit_version` int DEFAULT 1
   - `answers_raw` jsonb — transkribierte Antworten + audio refs
   - `personality_vector` jsonb — tone/style/cta/emoji/taboos
   - `created_at`, `updated_at`

2. **`social_topics`** (Editorial Focus)
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `topic_label` text NOT NULL
   - `priority` int (1–10)
   - `topic_briefing` jsonb — KI-Output (hooks/angles)
   - `is_active` bool DEFAULT true
   - `created_at`, `updated_at`

3. **`social_inspiration_sources`**
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `platform` text (linkedin|instagram|facebook)
   - `display_name` text
   - `profile_url` text
   - `is_active` bool DEFAULT true
   - `notes` text
   - `created_at`, `updated_at`

4. **`social_inspiration_samples`**
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `source_id` uuid FK social_inspiration_sources
   - `sample_type` text (text|link|doc)
   - `content_text` text
   - `document_id` uuid nullable
   - `extracted_patterns` jsonb — hook_types, structures, cta_patterns
   - `created_at`

5. **`social_inbound_items`** (Individual Content)
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `source` text DEFAULT 'ui_upload'
   - `moment_voice_text` text
   - `desired_effect` text — inspiration|trust|authority|sympathy|recruiting|leads
   - `personal_level` int — 1 (sachlich) bis 5 (emotional)
   - `one_liner` text nullable
   - `media_document_ids` uuid[] nullable
   - `status` text DEFAULT 'new' — new|in_progress|draft_created|archived
   - `created_at`, `updated_at`

6. **`social_drafts`**
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `origin` text — creation|inbound
   - `inbound_item_id` uuid nullable FK social_inbound_items
   - `topic_id` uuid nullable FK social_topics
   - `inspiration_source_ids` uuid[] nullable
   - `draft_title` text
   - `content_linkedin` text
   - `content_instagram` text
   - `content_facebook` text
   - `storyboard` jsonb — slides outline 3–6
   - `carousel` jsonb — slides outline 6–8
   - `assets_used` uuid[] nullable — document ids
   - `status` text DEFAULT 'draft' — draft|ready|planned|posted_manual|archived
   - `platform_targets` text[] — ['linkedin','instagram','facebook']
   - `planned_at` timestamptz nullable
   - `posted_at` timestamptz nullable
   - `generation_metadata` jsonb — prompt_version, model, temperature
   - `created_at`, `updated_at`

7. **`social_metrics`** (MVP manual)
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `draft_id` uuid FK social_drafts
   - `platform` text — linkedin|instagram|facebook
   - `impressions` int nullable
   - `likes` int nullable
   - `comments` int nullable
   - `saves` int nullable
   - `clicks` int nullable
   - `collected_at` timestamptz
   - `created_at`

8. **`social_video_jobs`** (HeyGen prepared)
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `draft_id` uuid FK social_drafts
   - `provider` text DEFAULT 'stub' — heygen|stub
   - `job_type` text — hook_video|story_video|reel_script
   - `input_payload` jsonb
   - `status` text DEFAULT 'queued' — queued|processing|done|failed
   - `result_document_id` uuid nullable
   - `created_at`, `updated_at`

9. **`social_assets`**
   - `id` uuid PK
   - `tenant_id` uuid FK organizations
   - `owner_user_id` uuid NOT NULL
   - `document_id` uuid NOT NULL — FK documents
   - `asset_type` text DEFAULT 'portrait' — portrait|story|generated
   - `tags` text[] — business/casual/outdoor/speaking
   - `sort_order` int DEFAULT 0
   - `created_at`

**RLS Pattern (identisch für alle):**
```sql
CREATE POLICY "tenant_isolation" ON social_[table]
FOR ALL USING (
  tenant_id IN (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  )
);
```

---

### PHASE 2 — UI Skeleton + Routing + Empty States
**Status:** Offen

**Neue Dateien:**
- `src/pages/portal/communication-pro/social/SocialPage.tsx` — Wrapper: Sidebar + Routes
- `src/pages/portal/communication-pro/social/SocialSidebar.tsx` — 9-Punkt Navigation
- `src/pages/portal/communication-pro/social/OverviewPage.tsx`
- `src/pages/portal/communication-pro/social/AuditPage.tsx`
- `src/pages/portal/communication-pro/social/InspirationPage.tsx`
- `src/pages/portal/communication-pro/social/KnowledgePage.tsx`
- `src/pages/portal/communication-pro/social/InboundPage.tsx`
- `src/pages/portal/communication-pro/social/AssetsPage.tsx`
- `src/pages/portal/communication-pro/social/CreatePage.tsx`
- `src/pages/portal/communication-pro/social/CalendarPage.tsx`
- `src/pages/portal/communication-pro/social/PerformancePage.tsx`

**Bestehende Änderungen:**
- `CommunicationProPage.tsx`: `social/*` Route → SocialPage (statt SocialTile)

**Empty States pro Seite:**

| Seite | Empty Title | Primary CTA |
|-------|-------------|-------------|
| Überblick | "Willkommen bei Social" | "Starte Social Setup" |
| Audit | "Persönlichkeit noch nicht erfasst" | "Audit starten" (öffnet Armstrong) |
| Inspiration | "Keine Inspirationsquellen" | "Quelle hinzufügen" |
| Knowledge | "Keine Themen definiert" | "Themen auswählen" |
| Inbound | "Kein Content eingereicht" | "Moment festhalten" |
| Assets | "Keine Fotos hochgeladen" | "Fotos hochladen" |
| Create | "Noch kein Entwurf" | "Entwurf erstellen" |
| Kalender | "Nichts geplant" | "Entwurf planen" |
| Performance | "Keine Kennzahlen" | "Kennzahlen erfassen" |

---

### PHASE 3 — Armstrong Audit Flow (Kern-Innovation)
**Status:** Offen

**Änderungen an bestehenden Dateien:**
- `src/hooks/useArmstrongAdvisor.ts`: Neue Methode `startFlow(flowType, flowConfig)`
- `supabase/functions/sot-armstrong-advisor/index.ts`: Flow-Handler `SOCIAL_AUDIT`

**Neue Dateien:**
- AuditPage.tsx wird um Armstrong-Integration erweitert (Button + Result-Display)

**Audit-Fragen (15 in 4 Blöcken):**

**Block 1: Identität & Selbstbild**
1. Worauf bist du beruflich wirklich stolz – und warum?
2. Wie möchtest du wahrgenommen werden, wenn du nicht im Raum bist?
3. Welche drei Worte beschreiben dich – ehrlich, nicht Marketing?

**Block 2: Haltung & Meinung**
4. Welche These vertrittst du, die viele in deiner Branche falsch sehen?
5. Was nervt dich in deiner Branche – und was würdest du anders machen?
6. Wofür würdest du öffentlich einstehen, auch wenn's Gegenwind gibt?

**Block 3: Sprache & Stil**
7. Erzähl eine kurze Story aus deinem Alltag, die dich geprägt hat.
8. Magst du kurze Sätze oder lieber ausführlich? Warum?
9. Wie direkt darf ein Call-to-Action sein? (soft / klar / gar nicht)
10. Wie stehst du zu Emojis? (nie / dezent / gerne)

**Block 4: Grenzen & Output-Ziele**
11. Welche Themen sind tabu?
12. Welche Tonalität willst du niemals? (cringe, zu salesy, zu hart)
13. Welche Art Posts willst du vermeiden? (Listenposts, Motivationssprüche, etc.)
14. Was soll Social für dich bewirken? (Authority, Leads, Recruiting, Sympathie)
15. Wie oft willst du realistisch posten? (pro Woche) und auf welchen Plattformen?

**Output: `personality_vector` (jsonb):**
```json
{
  "tone": "warm-professional",
  "sentence_length": "mixed",
  "formality": "medium",
  "emotion_level": "high",
  "opinion_strength": "strong",
  "cta_style": "clear",
  "emoji_level": "moderate",
  "preferred_formats": ["story", "opinion", "case-study"],
  "taboo_topics": ["politik", "religion"],
  "taboo_tones": ["cringe", "salesy"],
  "avoided_formats": ["listicle", "motivational-quote"],
  "goals": ["authority", "leads"],
  "posting_frequency": { "per_week": 3, "platforms": ["linkedin", "instagram"] }
}
```

---

### PHASE 4 — Knowledge Base (Topics + Briefings)
**Status:** Offen

- `KnowledgePage.tsx`: Topic-Chips (max 10), Drag/Drop Priority (dnd-kit)
- Button "KI befüllt Briefings" → Edge Function
- Edge Function `sot-social-generate-briefing/index.ts`:
  - Input: Topics + personality_vector
  - Output: topic_briefing jsonb (hooks, angles, story-patterns, CTAs)
  - Model: google/gemini-3-flash-preview

---

### PHASE 5 — Inspiration (Quellen + Patterns)
**Status:** Offen

- `InspirationPage.tsx`: Liste (max 10), Beispielpost-Upload/Paste
- Edge Function `sot-social-extract-patterns/index.ts`:
  - Input: Sample posts
  - Output: extracted_patterns (hook_types, structures, cta_patterns, length, content_types)
- Compliance-Hinweis: "Patterns als Ideengeber, nicht als Kopie"

---

### PHASE 6 — Assets (Foto Library)
**Status:** Offen

- `AssetsPage.tsx`: Upload (max 20), Tag-Editor, Galerie
- DMS Integration: `useUniversalUpload` + document_links
- Storage-Nodes: CommunicationPro/Social/Assets/Portraits|Stories|Generated

---

### PHASE 7 — Individual Content (Inbound Studio)
**Status:** Offen

- `InboundPage.tsx`: Inbox-Liste + Upload + Minimal-Dialog
- Dialog-Felder: Moment (Voice/Text), Desired Effect (Choice), Personal Level (Slider), One-Liner
- Edge Function `sot-social-draft-generate/index.ts`:
  - Input: inbound_item + personality_vector + topics + patterns
  - Output: 3 LinkedIn-Varianten + 2 Meta Captions + Storyboard Outline
- Speicherung: social_inbound_items + social_drafts

---

### PHASE 8 — Content Creation + Copywriter Editor
**Status:** Offen

**3-Schritt Generator:**
1. Format wählen (LinkedIn Post, Instagram Caption, Facebook Post, Storyboard, Carousel)
2. Grundlage wählen (Topic, Inspiration, Inbound Item, Freitext)
3. "Entwurf erstellen" → Draft Editor

**Draft Editor:**
- Platform-Tabs: LinkedIn / Instagram / Facebook
- Preview (LinkedIn-like Layout)
- **10 Copywriter-Buttons (prominent, KEINE Chat-UI):**
  1. Kürzer
  2. Emotionaler
  3. Direkter / Provokativer
  4. Mehr Story
  5. 3 Varianten
  6. Neue Hooks
  7. CTA wechseln
  8. Hashtags vorschlagen (Meta)
  9. Carousel gliedern (6–8 Slides)
  10. Video daraus machen (HeyGen) — disabled im MVP

- Edge Function `sot-social-draft-rewrite/index.ts`
- CTAs: "In Kalender planen", "Copy to Clipboard", "Als gepostet markieren"

---

### PHASE 9 — Kalender + Manual Posted
**Status:** Offen

- `CalendarPage.tsx`: Wochenansicht + Listenansicht
- Drafts als Items (planned_at, platform_targets)
- Status-Workflow: draft → ready → planned → posted_manual
- Manual Posted Toggle mit Datum
- Kein Auto-Posting im MVP

---

### PHASE 10 — Performance Light
**Status:** Offen

- `PerformancePage.tsx`: Manuelle Metriken (Impressions, Likes, Comments, Saves, Clicks)
- Edge Function `sot-social-analyze-performance/index.ts`:
  - Input: Draft-Text + Metriken
  - Output: "Was hat funktioniert?" + Empfehlungen (Themen, Hooks, Länge, CTA)

---

### PHASE 11 — HeyGen Prep (nur Stubs)
**Status:** Offen

- Draft Editor: Button "Video daraus machen (HeyGen)" — disabled
- Modal-Config vorbereitet (Output-Typ, Aspect Ratio, Voice)
- `social_video_jobs` mit provider=stub befüllen
- Integrations-Slot in Profil vorbereitet (kein echter API-Call)

---

### PHASE 12 — QA / Smoke Tests
**Status:** Offen

- E2E: Audit (Armstrong) → Topics → Inspiration → Create → Calendar → Posted → Performance
- Manifest-Konsistenz prüfen
- Mobile UX validieren
- Release Notes / Dokumentation

---

## Arbeitsweise

Jede Phase wird einzeln beauftragt:

> "Bitte implementiere **Phase X** gemäß `docs/modules/MOD-14_SOCIAL_PLAN.md`"

So bleibt der Pfad erhalten, auch bei Zwischenfragen.

---

## Edge Functions (Übersicht)

| Function | Phase | Zweck |
|----------|-------|-------|
| `sot-armstrong-advisor` (erweitert) | 3 | Social Audit Flow |
| `sot-social-generate-briefing` | 4 | Topic Briefings |
| `sot-social-extract-patterns` | 5 | Inspiration Patterns |
| `sot-social-draft-generate` | 7+8 | Draft-Erstellung |
| `sot-social-draft-rewrite` | 8 | Copywriter-Aktionen |
| `sot-social-analyze-performance` | 10 | Performance-Analyse |

Alle nutzen Lovable AI Gateway mit `google/gemini-3-flash-preview`.

---

## Dateien (Gesamtübersicht)

### Neue Dateien
```
src/pages/portal/communication-pro/social/
  SocialPage.tsx
  SocialSidebar.tsx
  OverviewPage.tsx
  AuditPage.tsx
  InspirationPage.tsx
  KnowledgePage.tsx
  InboundPage.tsx
  AssetsPage.tsx
  CreatePage.tsx
  CalendarPage.tsx
  PerformancePage.tsx
  components/
    DraftEditor.tsx
    CopywriterToolbar.tsx
    PlatformPreview.tsx
    TopicChips.tsx
    InboundDialog.tsx
    CalendarWeekView.tsx
    MetricsForm.tsx
```

### Geänderte Dateien
```
src/pages/portal/CommunicationProPage.tsx  — social/* → SocialPage
src/hooks/useArmstrongAdvisor.ts           — startFlow()
supabase/functions/sot-armstrong-advisor/   — SOCIAL_AUDIT handler
```

### Keine Änderungen
```
src/manifests/routesManifest.ts   — Social-Tile existiert bereits
src/manifests/areaConfig.ts       — MOD-14 in Services korrekt
src/test/manifestDrivenRoutes.test.ts — Tile-Count bleibt
```
