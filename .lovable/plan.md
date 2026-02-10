
# Kaufy Social Media + Selfie Ads Studio — Angepasster Plan

## Einordnung: Alles unter bestehende Strukturen

Das Selfie Ads Studio wird **in MOD-10 Leads** (`/portal/leads`) integriert — nicht als separater Bereich. Die Zone-1-Steuerung kommt als neuer Admin-Desk "Social Media" in die bestehende `zone1Admin.routes`.

---

## 0. Recherche-Modul Bereinigung (ERLEDIGT ✅)

### Problem
Die Recherche (3-Kachel-Layout: Free, Pro, Candidates) war fälschlicherweise in MOD-02 KI-Office unter `/portal/office/widgets` als dritter Tab platziert. Laut MOD-14 Spec gehört sie nach `/portal/communication-pro/recherche`.

### Durchgeführte Änderungen

| Datei | Änderung |
|---|---|
| `src/pages/portal/communication-pro/recherche/ResearchTab.tsx` | Neue Hauptkomponente (glass-card wrapper) |
| `src/pages/portal/communication-pro/recherche/ResearchFreeCard.tsx` | Verschoben von `office/components/` |
| `src/pages/portal/communication-pro/recherche/ResearchProCard.tsx` | Verschoben von `office/components/` |
| `src/pages/portal/communication-pro/recherche/ResearchCandidatesTray.tsx` | Verschoben von `office/components/` |
| `src/pages/portal/communication-pro/recherche/CandidatePreviewDrawer.tsx` | Verschoben von `office/components/` |
| `src/pages/portal/communication-pro/recherche/CreditConfirmModal.tsx` | Verschoben von `office/components/` |
| `src/pages/portal/CommunicationProPage.tsx` | RechercheTile Platzhalter → echte ResearchTab |
| `src/pages/portal/office/WidgetsTab.tsx` | Recherche-Tab entfernt, 2-Spalten-Layout |
| `src/manifests/armstrongManifest.ts` | 4 Actions umbenannt: ARM.MOD02.RESEARCH_* → ARM.MOD14.RESEARCH_*, module: MOD-14, ui_entrypoints aktualisiert |
| `docs/modules/MOD-14_COMMUNICATION_PRO.md` | Keine Änderung nötig (war bereits korrekt) |

### Armstrong Action Mapping (NEU)

| Alt (MOD-02) | Neu (MOD-14) |
|---|---|
| `ARM.MOD02.RESEARCH_FREE` | `ARM.MOD14.RESEARCH_FREE` |
| `ARM.MOD02.RESEARCH_PRO` | `ARM.MOD14.RESEARCH_PRO` |
| `ARM.MOD02.IMPORT_CANDIDATES` | `ARM.MOD14.IMPORT_CANDIDATES` |
| `ARM.MOD02.DEDUPE_SUGGEST` | `ARM.MOD14.DEDUPE_SUGGEST` |

### Verifikation
- ✅ WidgetsTab hat nur noch 2 Tabs: Systemwidgets + Aufgaben
- ✅ MOD-14 `/portal/communication-pro/recherche` zeigt 3 Kacheln im glass-card Design
- ✅ Armstrong Actions korrekt auf MOD-14 gemappt
- ✅ Alte Dateien unter `office/components/` können gelöscht werden (Originals verbleiben als Backup)

## 0b. Widget-Design-Harmonisierung (ERLEDIGT ✅)

Shared Components: PageShell, KPICard, WidgetHeader, ListRow erstellt. Alle Module harmonisiert (Padding, glass-card, Typografie). 4 Legacy-Dateien in MOD-11 gelöscht. MOD-04/MOD-08 bewusst ausgenommen.

---

## 1. Navigation / Routing

### Zone 2 — MOD-10 Leads erweitern (`/portal/leads`)

Bestehende Tiles bleiben, neue kommen dazu:

```text
Bestehend:
  /portal/leads/inbox       → Inbox
  /portal/leads/meine       → Meine Leads
  /portal/leads/pipeline    → Pipeline
  /portal/leads/werbung     → Werbung

Neu (Selfie Ads Studio):
  /portal/leads/selfie-ads            → Selfie Ads Studio (Ueberblick)
  /portal/leads/selfie-ads-planen     → Kampagne planen (5 Slots)
  /portal/leads/selfie-ads-summary    → Mandat Zusammenfassung
  /portal/leads/selfie-ads-kampagnen  → Meine Kampagnen
  /portal/leads/selfie-ads-performance→ Performance
  /portal/leads/selfie-ads-abrechnung → Abrechnung
```

Aenderungen:
- **`routesManifest.ts`**: MOD-10 tiles Array um 6 Eintraege erweitern
- **`LeadsPage.tsx`**: 6 neue lazy-loaded Routes + Imports

### Zone 1 — Neuer Admin-Desk "Social Media" (`/admin/social-media`)

```text
  /admin/social-media              → Dashboard
  /admin/social-media/kampagnen    → Kaufy Kampagnen
  /admin/social-media/creator      → Creator
  /admin/social-media/vertrieb     → Social Vertrieb (Mandate)
  /admin/social-media/vertrieb/:id → Mandat Detail
  /admin/social-media/leads        → Leads & Routing
  /admin/social-media/templates    → Templates & CI
  /admin/social-media/abrechnung   → Abrechnung
```

Aenderungen:
- **`routesManifest.ts`**: 8 neue Routes in `zone1Admin.routes`
- **`AdminSidebar.tsx`**: Neue Gruppe "Social Media" mit Megaphone-Icon
- **`ManifestRouter.tsx`**: 8 neue Admin-Komponenten lazy-loaded

---

## 2. Datenmodell (6 Tabellen + RLS)

Alle Tabellen mit `tenant_id` + RLS ueber `get_user_tenant_id()`:

| Tabelle | Zweck |
|---|---|
| `social_mandates` | Partner-Auftraege (Status: submitted→review→approved→scheduled→live→ended) |
| `social_templates` | 5 Kaufy CI Templates (slideshow_4, single, story, carousel) |
| `social_creatives` | Generierte Outputs (Slideshow-Outline + Caption + CTA pro Slot T1-T5) |
| `social_campaigns` | Kaufy-interne Kampagnen (organisch + paid) |
| `social_leads` | Lead-Intake (Meta Leadgen + Manual), verknuepft mit Mandat + Partner |
| `social_lead_events` | Timeline/Audit (webhook_received, autoresponder_sent, routed, status_changed) |

Seed: 5 Templates + 1 Demo-Mandat + 3 Demo-Kampagnen + 5 Demo-Leads.

---

## 3. Zone 2 — Selfie Ads Studio Seiten (unter /portal/leads)

### SelfieAdsStudio.tsx (Ueberblick)
- Widget-Karten: "Aktive Kampagnen", "Neue Leads", "Performance", "Letzte Beauftragungen"
- Lebendige Demo-Karten (nie leer)

### SelfieAdsPlanen.tsx (Kampagne planen — eine Seite, kein Wizard)
5 Abschnitte:
- **A) Parameter**: Ziel, Laufzeit, Budget, Regionen (1-3), Zielgruppe-Presets
- **B) 5 Template-Slots**: Graue Karten T1-T5, immer sichtbar, Status-Badges
- **C) Personalisierung**: Beraterportrait, Name, Region, Claim (80 Zeichen)
- **D) Generieren**: Button → pro Slot 4-Slide Vorschau + Caption/CTA inline
- **E) Zusammenfassung**: Kompaktkarte + CTA "Zur Mandatszusammenfassung"

### SelfieAdsZusammenfassung.tsx
- Read-only Mandatsakte (Case-Feeling)
- CTA "Beauftragen & bezahlen"

### SelfieAdsKampagnen.tsx
- Liste beauftragter Mandate mit Status-Badges

### SelfieAdsPerformance.tsx
- CPL, Leads, Zeitraum-Diagramm (Recharts), Top Templates, Region

### SelfieAdsAbrechnung.tsx
- Zahlungen pro Mandat, Status, Rechnungs-Links

---

## 4. Zone 1 — Social Media Admin-Seiten

Alle unter `src/pages/admin/social-media/`:

| Seite | Funktion |
|---|---|
| SocialMediaDashboard.tsx | KPIs: Aktive Kampagnen, Mandate, Leads, Spend |
| SocialMediaKampagnen.tsx | Kaufy-eigene Kampagnen (organisch + paid) |
| SocialMediaCreator.tsx | Seitenbasierter Creator (Plattform, Ziel, Templates, Generate, Publish) |
| SocialMediaVertrieb.tsx | Mandate-Liste (aus Zone 2 Beauftragungen) |
| SocialMediaVertriebDetail.tsx | Mandatsakte: Daten, Creatives, Publishing-Plan, Abrechnung |
| SocialMediaLeads.tsx | Zentrale Lead-Inbox mit Routing-Aktionen |
| SocialMediaTemplates.tsx | Kaufy CI Template-Verwaltung |
| SocialMediaAbrechnung.tsx | Gesamt-Spend, Partner-Abrechnung, Exports |

---

## 5. Edge Functions (Stubs)

| Function | Zweck |
|---|---|
| `sot-social-mandate-submit` | Zone 2 → Zone 1 Mandats-Uebergabe |
| `sot-social-payment-create` | Checkout-Session erstellen |
| `sot-social-payment-webhook` | Payment-Confirmation → Status-Update |
| `sot-social-meta-webhook` | Meta Leadgen Intake + Lead-Routing |
| `sot-social-autoresponder` | Auto-E-Mail (Kaufy-Absender, Reply-To Partner) |

---

## 6. DMS/Storage Trees

```text
Zone 1:
  SocialMedia/
    KaufyCampaigns/{campaignId}/Creatives/, Assets/, Reports/
    SocialVertriebMandate/{mandateId}/Briefing/, Creatives/, MetaExports/, Billing/

Zone 2 (unter Leads):
  Leads/
    SelfieAdsStudio/
      Drafts/{draftId}/, MandateRefs/{mandateId}/, Assets/, Reports/
```

---

## 7. Dateien-Gesamtuebersicht

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | +6 MOD-10 Tiles, +8 Admin Routes |
| `src/pages/portal/LeadsPage.tsx` | +6 lazy Routes (SelfieAds*) |
| `src/components/admin/AdminSidebar.tsx` | Neue Gruppe "Social Media" |
| `src/router/ManifestRouter.tsx` | +8 Admin lazy Imports |
| `src/pages/portal/vertriebspartner/SelfieAds*.tsx` | 6 neue Seiten (unter leads/) |
| `src/pages/admin/social-media/*.tsx` | 8 neue Seiten + index.ts |
| DB Migration | 6 Tabellen + RLS + Seeds |
| `supabase/functions/sot-social-*` | 5 Edge Function Stubs |

---

## 8. Phasenfolge

1. **Routing + Skeletons**: Manifest, LeadsPage, AdminSidebar, alle Seiten als Widget-Skeletons mit Demo-Karten
2. **Datenmodell**: 6 Tabellen + RLS + Seeds
3. **Selfie Ads Planen**: 5-Slot-Seite mit Parametern, Generierung, Zusammenfassung
4. **Payment + Mandats-Uebergabe**: Edge Functions + Status-Maschine
5. **Zone 1 Vertrieb**: Mandatsakte + Publishing-Pipeline
6. **Leads Intake + Autoresponder**: Webhook + Routing + E-Mail
7. **Performance + Abrechnung**: Dashboards beidseitig
8. **Kaufy Creator**: Interner Kampagnen-Manager
