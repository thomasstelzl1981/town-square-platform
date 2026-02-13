
# Konsolidierung MOD-09/MOD-10 — ABGESCHLOSSEN ✅

## Durchgeführte Änderungen

### MOD-09 (Vertriebspartner) — Erweitert um Leads & Selfie Ads
- Neuer Tab "Leads" mit One-Pager Flow (`LeadsTab.tsx`)
- 6 Selfie Ads Seiten von MOD-10 hierher verschoben
- Alle internen Navigations-Pfade auf `/portal/vertriebspartner/...` aktualisiert
- routesManifest.ts: 5 Tiles + 8 Dynamic Routes

### MOD-10 — Umbenannt in "Provisionen"
- Modul-Nummer bleibt erhalten (MOD-10)
- Einziger Tab: "Übersicht" (Platzhalter für künftiges Provisionsabrechnungssystem)
- Icon: CreditCard
- tile_catalog in DB aktualisiert

### Gelöschte Dateien
- `src/pages/portal/leads/LeadsInbox.tsx`
- `src/pages/portal/leads/MeineLeads.tsx`
- `src/pages/portal/leads/LeadsPipeline.tsx`
- `src/pages/portal/leads/LeadsWerbung.tsx`

### Verschobene Dateien
- `SelfieAdsStudio.tsx` → `vertriebspartner/`
- `SelfieAdsPlanen.tsx` → `vertriebspartner/`
- `SelfieAdsSummary.tsx` → `vertriebspartner/`
- `SelfieAdsKampagnen.tsx` → `vertriebspartner/`
- `SelfieAdsPerformance.tsx` → `vertriebspartner/`
- `SelfieAdsAbrechnung.tsx` → `vertriebspartner/`

### Neue Dateien
- `src/pages/portal/vertriebspartner/LeadsTab.tsx`
- `src/pages/portal/leads/ProvisionenUebersicht.tsx`
