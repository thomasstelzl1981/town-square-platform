# MOD-08 — IMMO SUCHE (Investment Discovery)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/investments`  
> **SSOT-Rolle**: Source of Truth für Immobiliensuche, Favoriten und Investment-Simulation

---

## 1. Executive Summary

MOD-08 "Immo Suche" ermöglicht Nutzern, verfügbare Investmentimmobilien zu durchsuchen,
zu favorisieren und Renditesimulationen durchzuführen. Die Datenquelle ist die
Zone-1-gesteuerte View `v_public_listings`, die governance-genehmigte Listings aus MOD-13
und MOD-04 aggregiert.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Listings kommen ausschließlich aus `v_public_listings` (Cross-Tenant-Bridge) |
| **R2** | Keine direkte Schreibberechtigung auf Listing-Daten (Read-Only Consumer) |
| **R3** | Favoriten werden pro User in `listing_favorites` gespeichert |
| **R4** | Mandate (Suchaufträge) nutzen den Contract `Acq Mandate Submit` für Z1-Governance |

---

## 3. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Suche | `/portal/investments/suche` | Kartenbasierte Immobiliensuche mit Filtern |
| Favoriten | `/portal/investments/favoriten` | Gemerkte Listings mit Vergleichsfunktion |
| Mandat | `/portal/investments/mandat` | Suchauftrag (Investmentprofil) beauftragen |
| Simulation | `/portal/investments/simulation` | Rendite-Kalkulator und Szenario-Analyse |

---

## 4. Cross-Module-Abhängigkeiten

| Modul | Beziehung |
|-------|-----------|
| MOD-13 (Projekte) | Liefert Listings via `v_public_listings` |
| MOD-04 (Immobilien) | Bestandsimmobilien als Listing-Quelle |
| MOD-09 (Vertriebspartner) | Konsumiert gleiche Listings, zeigt keine Provision |
| MOD-07 (Finanzierung) | Finanzierungsanfrage aus Exposé heraus |

---

## 5. Tile-Catalog Eintrag

```yaml
MOD-08:
  code: "MOD-08"
  title: "Immo Suche"
  icon: "Search"
  main_route: "/portal/investments"
  display_order: 8
  sub_tiles: [suche, favoriten, mandat, simulation]
```

---

## 6. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
