# MOD-17 — CAR-MANAGEMENT (Fahrzeugverwaltung)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/cars`  
> **SSOT-Rolle**: Source of Truth für Fahrzeuge, Fahrtenbuch und Versicherungen

---

## 1. Executive Summary

MOD-17 "Car-Management" verwaltet den Fuhrpark des Nutzers. Es umfasst fünf Bereiche:
Autos, Bikes, Boote (Haller Charter), Privatjet (NetJets) und Angebote (Miete24 & BMW Leasing).
Die Fahrzeugakte ist vollständig inline (keine Pop-ups) mit integriertem DMS-Datenraum.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Fahrzeugakte ist vollständig inline (kein Modal/Pop-up) |
| **R2** | Fahrzeug-Datenfelder sind direkt editierbar, persistieren in `cars_vehicles` |
| **R3** | Fahrtenbuch folgt dem Vimcar-Pattern (Tabelle `cars_trips`) |
| **R4** | GoldenPathGuard umschließt Fahrzeug-Detailseiten |

---

## 3. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Übersicht | `/portal/cars/uebersicht` | Dashboard mit Fuhrpark-KPIs |
| Fahrzeuge | `/portal/cars/fahrzeuge` | Fahrzeug-Grid (Autos, Bikes, Boote, Jets) |
| Service | `/portal/cars/service` | Wartungen, TÜV-Termine, Versicherungen |
| Settings | `/portal/cars/settings` | Präferenzen und Anbieter-Angebote |

---

## 4. Fahrzeugakte (Inline Detail)

- Basisdaten (Marke, Modell, Kennzeichen, Baujahr)
- Versicherungen (KFZ-Haftpflicht, Kasko)
- Fahrtenbuch (Vimcar-Pattern mit `cars_trips`)
- DMS-Datenraum (`tenant-documents/{tenantId}/MOD_17/{vehicleId}/`)

---

## 5. Datenmodell

| Tabelle | Zweck |
|---------|-------|
| `cars_vehicles` | Fahrzeugstammdaten |
| `cars_trips` | Fahrtenbuch-Einträge |

---

## 6. Tile-Catalog Eintrag

```yaml
MOD-17:
  code: "MOD-17"
  title: "Car-Management"
  icon: "Car"
  main_route: "/portal/cars"
  display_order: 17
  sub_tiles: [uebersicht, fahrzeuge, service, settings]
```

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
