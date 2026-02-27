
## Integration: Ncore Business Consulting + Otto²Advisory — Implementierungsplan

### Status: Phase 1 DONE ✅

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

### SEO & LLM Optimierung (implementiert in Phase 1)

- ✅ `<title>` mit Keyword-First (<60 Zeichen)
- ✅ `<meta name="description">` (<160 Zeichen, handlungsorientiert)
- ✅ `<link rel="canonical">` auf Produktionsdomain
- ✅ JSON-LD Structured Data (ConsultingBusiness, Service, ContactPage)
- ✅ Semantic HTML (single H1, section-basiert)
- ✅ `<meta property="og:*">` für Social Sharing

### Nächste Schritte

| Phase | Beschreibung | Status |
|-------|-------------|--------|
| **2** | Otto²Advisory Content aus Quellprojekt adaptieren + FutureRoom-Finanzierungsflow | ✅ DONE |
| **3** | Ncore Content-Überarbeitung (kein SoT-Link, konsolidiert) | ⬜ |
| **4** | Lead-Routing (sot-lead-inbox + sot-futureroom-public-submit) | ⬜ |
| **5** | Zone 1 Desk-Seiten (Lead-Pool, Zuweisung, Monitor) | ⬜ |
| **6** | Compliance Engine (Impressum + Datenschutz für beide Brands) | ⬜ |
| **7** | Armstrong-Integration (Lead-Capture auf beiden Websites) | ⬜ |
| **8** | Re-Freeze INFRA-manifests | ⬜ |

### Offene Punkte

1. Impressumsdaten Ncore Business Consulting (Adresse, HRB, USt-IdNr)
2. Impressumsdaten Komplett ZL Finanzdienstleistungen GmbH
3. Gründer-Seite Ncore: Content vom User
4. Hero-Bilder für beide Websites
5. PIN-Gate Integration (zone3_website_settings)
