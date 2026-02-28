

# SEO-Audit & Unterseiten-Audit — Alle 7 Zone 3 Brands

---

## Unterseiten-Inventar

| # | Brand | Domain | Seiten | Impressum | Datenschutz | Kontakt | FAQ |
|---|-------|--------|--------|-----------|-------------|---------|-----|
| 1 | **KAUFY** | kaufy.immo | 7 | ✅ Zone3LegalPage | ✅ Zone3LegalPage | ❌ fehlt | ❌ fehlt |
| 2 | **FutureRoom** | futureroom.online | 8 | ✅ Zone3LegalPage | ✅ Zone3LegalPage | ❌ fehlt | ✅ FutureRoomFAQ |
| 3 | **System of a Town** | systemofatown.com | 22 | ✅ Zone3LegalPage | ✅ Zone3LegalPage | ❌ (über Demo?) | ✅ SotFAQ |
| 4 | **ACQUIARY** | acquiary.com | 7 | ✅ Zone3LegalPage | ✅ Zone3LegalPage | ❌ fehlt | ❌ fehlt |
| 5 | **Lennox & Friends** | lennoxandfriends.app | 8 | ✅ Zone3LegalPage | ✅ Zone3LegalPage | ❌ fehlt | ❌ fehlt |
| 6 | **Ncore** | ncore.online | 9 | ✅ eigene TSX | ✅ eigene TSX | ✅ NcoreKontakt | ❌ fehlt (FAQ inline) |
| 7 | **Otto² Advisory** | otto2advisory.com | 7 | ✅ eigene TSX | ✅ eigene TSX | ✅ OttoKontakt | ❌ fehlt |

---

## SEO-Check: Ergebnisse

### A. SEOHead-Abdeckung (zentrale Komponente)

| Brand | SEOHead genutzt? | Canonical | JSON-LD (Org) | JSON-LD (WebPage) | OG-Tags |
|-------|-------------------|-----------|---------------|--------------------|---------| 
| KAUFY | ✅ Layout-Level | ✅ auto | ✅ auto | ✅ auto | ✅ auto |
| FutureRoom | ✅ Layout-Level | ✅ auto | ✅ auto | ✅ auto | ✅ auto |
| SoT | ✅ Layout + Seiten | ✅ auto | ✅ auto | ✅ auto | ✅ auto |
| ACQUIARY | ✅ Layout-Level | ✅ auto | ✅ auto | ✅ auto | ✅ auto |
| Lennox | ❌ **FEHLT** | ❌ fehlt | ❌ fehlt | ❌ fehlt | ❌ fehlt |
| **Ncore** | ❌ raw Helmet | ✅ Layout-Level | ✅ manuell | ❌ fehlt | ❌ fehlt |
| **Otto²** | ❌ raw Helmet | ✅ pro Seite | ✅ teilweise | ❌ fehlt | ✅ teilweise |

### B. Kritische SEO-Defizite

1. **Lennox & Friends — komplett ohne SEO-Meta**
   - Kein SEOHead, kein Helmet, keine Canonicals, kein JSON-LD, keine OG-Tags
   - Schwerstes Defizit aller Brands

2. **Ncore — nicht im BRAND_SEO_CONFIG registriert**
   - Nutzt manuelles Helmet statt SEOHead
   - Canonical nur im Layout (gut), aber kein WebPage-Schema, keine OG-Tags auf Unterseiten

3. **Otto² — nicht im BRAND_SEO_CONFIG registriert**
   - Manuelles Helmet mit guter Abdeckung (Canonical + OG auf allen Seiten)
   - Aber kein WebPage-Schema, kein FAQPage-Schema

4. **Kaufy, FutureRoom, Acquiary — nur Layout-Level SEO**
   - SEOHead wird nur im Layout gesetzt, nicht pro Unterseite
   - Unterseiten haben dadurch identische Title/Description (die des Layouts)
   - Jede Unterseite braucht eigene `<SEOHead>` mit spezifischem Title + Description

5. **Fehlende Seiten über alle Brands**
   - Kaufy: kein Kontakt, kein FAQ
   - FutureRoom: kein Kontakt
   - Acquiary: kein Kontakt, kein FAQ
   - Lennox: kein Kontakt, kein FAQ
   - Otto²: kein FAQ

---

## Empfohlener Plan (Priorisiert)

### Phase 1 — Kritisch (SEO-Grundlagen)
1. **Ncore + Otto² in `BRAND_SEO_CONFIG` registrieren** — Domains, legalName, Taglines eintragen
2. **Lennox: SEOHead im Layout einbauen** — Brand registrieren + Layout umbauen
3. **Alle 7 Layouts prüfen** — sicherstellen, dass SEOHead mindestens im Layout gesetzt ist

### Phase 2 — Unterseiten-SEO
4. **Kaufy Unterseiten**: Vermieter, Verkäufer, Vertrieb — jeweils eigenes `<SEOHead>` mit spezifischem Title + Description
5. **FutureRoom Unterseiten**: Bonität, Karriere, FAQ, Login, Akte — eigenes SEOHead
6. **Acquiary Unterseiten**: Methodik, Netzwerk, Karriere, Objekt — eigenes SEOHead
7. **Lennox Unterseiten**: Shop, Partner werden, Partner-Profil — eigenes SEOHead
8. **Ncore**: Migration von raw Helmet → SEOHead (9 Seiten)
9. **Otto²**: Migration von raw Helmet → SEOHead (7 Seiten)

### Phase 3 — Fehlende Seiten
10. Kontaktseiten für Kaufy, FutureRoom, Acquiary, Lennox
11. FAQ-Seiten für Kaufy, Acquiary, Lennox, Otto²

### Phase 4 — JSON-LD-Erweiterung
12. FAQPage-Schema auf alle FAQ-Seiten
13. ServiceSchema auf relevanten Unterseiten (Vermieter, Finanzierung, etc.)
14. BreadcrumbList-Schema über alle Brands

---

## Technische Details

- `SEOHead` setzt automatisch: `document.title`, `<meta description>`, `<link rel="canonical">`, OG-Tags, Twitter Cards, Organization-LD, WebPage-LD
- Brands die nur Layout-Level SEOHead haben, bekommen für alle Unterseiten den gleichen Title/Description — das ist schlecht für Google
- Die SoT-Lösungsseiten + Ratgeber sind das Vorbild: jede Seite hat eigenes `<SEOHead>` mit spezifischem Content + FAQ-Schema
- Ncore/Otto² sind gut gemacht mit manuellem Helmet, müssen aber in das zentrale System migriert werden für Konsistenz

