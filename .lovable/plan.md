
## Integration: Ncore Business Consulting + Otto²Advisory — Implementierungsplan

### Status: Phase 5 DONE ✅

---

### Phase 1: Infrastruktur ✅ ABGESCHLOSSEN

| Datei | Status |
|-------|--------|
| `spec/current/00_frozen/infra_freeze.json` | ✅ manifests unfrozen |
| `src/manifests/operativeDeskManifest.ts` | ✅ ncore-desk + otto-desk hinzugefügt |
| `src/config/domainMap.ts` | ✅ 20 Domain-Einträge (Ncore 8, Otto 10) |
| `src/manifests/routesManifest.ts` | ✅ Zone 3 Websites + Zone 1 Desk-Routen |
| `src/router/ManifestRouter.tsx` | ✅ Lazy imports, Component Maps, Layout Map, Desk Map |

### Phase 1b: Stub-Seiten ✅ ABGESCHLOSSEN

| Website | Seiten | Status |
|---------|--------|--------|
| **Ncore** (Zone 3) | Layout + 9 Seiten (Home, Digitalisierung, Stiftungen, Geschäftsmodelle, Netzwerk, Gründer, Kontakt, Impressum, Datenschutz) | ✅ Mit SEO-Helmet + JSON-LD |
| **Otto²** (Zone 3) | Layout + 7 Seiten (Home, Unternehmer, Private Haushalte, Finanzierung, Kontakt, Impressum, Datenschutz) | ✅ Stub-Seiten |
| **Ncore Desk** (Zone 1) | 1 Desk-Stub | ✅ |
| **Otto Desk** (Zone 1) | 1 Desk-Stub | ✅ |

### Phase 2: Otto² Advisory Content ✅ ABGESCHLOSSEN

### Phase 3: Ncore Content-Überarbeitung ✅ ABGESCHLOSSEN

### Phase 4: Lead-Routing ✅ ABGESCHLOSSEN

- ✅ DB-Migration: lead_source enum erweitert (ncore_projekt, ncore_kooperation, otto_advisory_kontakt, otto_advisory_finanzierung)
- ✅ Edge Function: sot-ncore-lead-submit (zentrales Lead-Routing für beide Brands)

### Phase 5: Zone 1 Desk-Seiten ✅ ABGESCHLOSSEN

| Desk | Tabs | Status |
|------|------|--------|
| **Ncore Desk** | Lead-Pool, Inbox, Monitor | ✅ Mit KPI-Leiste, Zuweisung, Conversion Funnel |
| **Otto² Desk** | Lead-Pool, Inbox, Monitor | ✅ Mit KPI-Leiste, Zuweisung, Conversion Funnel |

### Phase 8: Re-Freeze ✅ ABGESCHLOSSEN

- ✅ INFRA-manifests re-frozen

### Nächste Schritte

| Phase | Beschreibung | Status |
|-------|-------------|--------|
| **6** | Compliance Engine (Impressum + Datenschutz für beide Brands) | ⬜ |
| **7** | Armstrong-Integration (Lead-Capture auf beiden Websites) | ⬜ |

### Offene Punkte

1. Impressumsdaten Ncore Business Consulting (Adresse, HRB, USt-IdNr)
2. Impressumsdaten Komplett ZL Finanzdienstleistungen GmbH
3. Gründer-Seite Ncore: Content vom User
4. Hero-Bilder für beide Websites
5. PIN-Gate Integration (zone3_website_settings)
