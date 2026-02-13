
# Erweiterter Plan: Demo-Daten durch den gesamten Golden Path MOD-04 — inkl. Zone 1 und Zone 3

## Uebersicht

Der bisherige Plan deckt nur Zone 2 (Portal) ab. Diese Erweiterung stellt sicher, dass Demo-Daten auch in **Zone 1 (Admin/Sales Desk)** und **Zone 3 (Kaufy Website)** sichtbar werden, wenn der Demo-Modus aktiv ist — und vollstaendig verschwinden, wenn er deaktiviert wird.

---

## Betroffene Stellen im Golden Path (11 Phasen)

```text
Phase 1-3: Portfolio Dashboard (Zone 2)     ── bereits geplant
Phase 4:   Verkaufsauftrag (Zone 2)         ── bereits geplant
Phase 5:   Stammdaten/Vertraege (Zone 2)    ── bereits geplant
Phase 6:   Sales Desk (Zone 1)              ── NEU
Phase 7:   MOD-09 Katalog (Zone 2)          ── bereits geplant
Phase 8:   MOD-08 Investment-Suche (Zone 2) ── bereits geplant
Phase 9:   Kaufy Website (Zone 3)           ── NEU
Phase 10:  Kaufy Expose-Detail (Zone 3)     ── NEU
Phase 11:  Deaktivierung (Zone 2)           ── bereits geplant
```

---

## Bestehender Plan (Zone 2) — unveraendert

| # | Datei | Aenderung |
|---|-------|-----------|
| 1 | `src/config/tenantConstants.ts` | `DEMO_PROPERTY_IDS` Array mit den 3 IDs |
| 2 | `src/hooks/useDemoListings.ts` | Neuer Hook: liefert synthetische Listing/Publication-Daten |
| 3 | `src/pages/portal/immobilien/PortfolioTab.tsx` | Demo-Properties filtern wenn Toggle aus |
| 4 | `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Demo-Guard + Badge |
| 5 | `src/components/portfolio/VerkaufsauftragTab.tsx` | `isDemo`-Prop, UI-only Switches |

---

## Erweiterung: Zone 1 — Sales Desk

### Phase 6: `src/pages/admin/desks/SalesDesk.tsx`

**Problem:** Der Sales Desk laedt Listings direkt aus der DB via `useSalesDeskListings`. Ohne echte DB-Eintraege in `listings` und `listing_publications` erscheinen keine Demo-Objekte.

**Loesung:**
- Der Hook `useSalesDeskListings` wird um einen optionalen Demo-Merge erweitert
- Wenn `GP-PORTFOLIO` aktiv ist, werden 3 synthetische `SalesDeskListing`-Objekte (Berlin, Muenchen, Hamburg) in das Ergebnis eingefuegt
- Diese synthetischen Eintraege zeigen den Status "active" mit Publications auf den Kanaelen `partner_network` und `kaufy`
- Die Kill-Switch und Distribution-Toggles sind fuer Demo-Eintraege visuell funktional (UI-only, keine DB-Mutation)
- Ein smaragdgruenes "DEMO"-Badge kennzeichnet die Eintraege

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useSalesDeskListings.ts` | Demo-Listings mergen wenn Toggle aktiv (ca. 30 Zeilen) |
| `src/pages/admin/desks/SalesDesk.tsx` | Demo-Badge + Mutation-Guard fuer Demo-IDs (ca. 15 Zeilen) |

### Zusaetzlich: `ImmobilienVertriebsauftraegeCard`

Die Karte in der SalesDesk-Dashboard-Ansicht (`ImmobilienVertriebsauftraegeCard`) laedt Mandate direkt aus `sales_desk_mandates`. Hier wird analog ein Demo-Eintrag fuer das "Berlin Altbau" Objekt injiziert, wenn der Toggle aktiv ist.

---

## Erweiterung: Zone 3 — Kaufy Website

### Phase 9-10: `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx`

**Problem:** Die Kaufy-Seite laedt Listings ueber `listing_publications` (channel=kaufy, status=active) aus der DB. Ohne echte Eintraege sind keine Demo-Objekte sichtbar.

**Loesung:**
- Der Listing-Fetch in `Kaufy2026Home.tsx` wird um einen Demo-Merge erweitert
- Wenn `GP-PORTFOLIO` aktiv ist, werden 3 synthetische Kaufy-Listings (mit Property-Daten, Preis, Flaeche) in die Ergebnisliste eingefuegt
- Die Demo-Listings erscheinen mit dem gleichen smaragdgruenen Badge
- Bei Klick auf ein Demo-Listing oeffnet sich die Expose-Detailseite mit synthetischen Daten (Bilder aus dem Storage, Investment-Engine-Berechnung mit Demo-Parametern)

| Datei | Aenderung |
|-------|-----------|
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Demo-Listings in Suchergebnisse mergen (ca. 40 Zeilen) |
| `src/pages/zone3/kaufy2026/Kaufy2026ExposeDetail.tsx` | Demo-Property-Daten laden wenn ID in `DEMO_PROPERTY_IDS` (ca. 25 Zeilen) |

### MOD-09 Katalog (Zone 2, aber Downstream)

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | Demo-Listings in Katalog mergen (ca. 30 Zeilen) |
| `src/pages/portal/vertriebspartner/KatalogDetailPage.tsx` | Demo-Property-Fallback fuer Detail-Ansicht (ca. 20 Zeilen) |

---

## Zentraler Demo-Listings Hook (erweitert)

Der geplante `useDemoListings.ts` Hook wird so erweitert, dass er verschiedene "Shapes" fuer die unterschiedlichen Konsumenten liefert:

```text
useDemoListings()
  ├── .salesDeskListings    → SalesDeskListing[]  (Zone 1)
  ├── .kaufyListings        → KaufyListing[]      (Zone 3)
  ├── .partnerKatalog       → KatalogListing[]     (MOD-09)
  └── .portalListings       → PortalListing[]      (MOD-08)
```

Alle Shapes verwenden dieselben Basis-Daten (3 Properties), gemappt auf das jeweilige Interface. Der Toggle-Check (`isEnabled('GP-PORTFOLIO')`) ist zentral im Hook — Konsumenten pruefen nur `if (demoListings.length > 0)`.

---

## Zusammenfassung aller betroffenen Dateien

| # | Zone | Datei | Art |
|---|------|-------|-----|
| 1 | Shared | `src/config/tenantConstants.ts` | DEMO_PROPERTY_IDS hinzufuegen |
| 2 | Shared | `src/hooks/useDemoListings.ts` | Neuer Hook (ca. 150 Zeilen) |
| 3 | Z2 | `src/pages/portal/immobilien/PortfolioTab.tsx` | Filter |
| 4 | Z2 | `src/pages/portal/immobilien/PropertyDetailPage.tsx` | Guard + Badge |
| 5 | Z2 | `src/components/portfolio/VerkaufsauftragTab.tsx` | isDemo-Prop |
| 6 | **Z1** | `src/hooks/useSalesDeskListings.ts` | Demo-Merge |
| 7 | **Z1** | `src/pages/admin/desks/SalesDesk.tsx` | Badge + Guard |
| 8 | **Z3** | `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Demo-Merge |
| 9 | **Z3** | Kaufy Expose-Detail | Demo-Fallback |
| 10 | Z2 | `src/pages/portal/vertriebspartner/KatalogTab.tsx` | Demo-Merge |
| 11 | Z2 | `src/pages/portal/vertriebspartner/KatalogDetailPage.tsx` | Demo-Fallback |

**Keine DB-Aenderungen erforderlich** — alles rein clientseitig/synthetisch.
