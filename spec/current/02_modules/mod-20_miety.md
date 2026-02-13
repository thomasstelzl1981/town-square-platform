# MOD-20 — ZUHAUSE / MIETY (Home Management)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/miety`  
> **Display-Name**: Zuhause  
> **SSOT-Rolle**: Source of Truth für Mieter-/Eigentümer-Services (inline in MOD-04)

---

## 1. Executive Summary

MOD-20 "Zuhause" (Route: `/portal/miety`) verwaltet das persönliche Zuhause des Nutzers.
Die Funktionalität ist vollständig inline in MOD-04 (Immobilien) integriert, um
Modulsprünge zu vermeiden. Alle Miety-Komponenten werden im Tab "Zuhause" vertikal
untereinander gestapelt.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Inline-Integration in MOD-04 Tab "Zuhause" (kein eigenständiger Modulsprung) |
| **R2** | Route bleibt `/portal/miety` (Legacy-Kompatibilität) |
| **R3** | Display-Name ist "Zuhause" (Manifest-Override) |
| **R4** | 6 Tiles erlaubt (Ausnahme von der 4-Tile-Regel) |

---

## 3. Tiles (6)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Übersicht | `/portal/miety/uebersicht` | Wohn-Dashboard mit Verbrauch und Kosten |
| Dokumente | `/portal/miety/dokumente` | Mietvertrag, Nebenkostenabrechnung |
| Kommunikation | `/portal/miety/kommunikation` | Hausverwaltung-Kontakt und Tickets |
| Zählerstände | `/portal/miety/zaehlerstaende` | Strom, Gas, Wasser mit Verbrauchshistorie |
| Versorgung | `/portal/miety/versorgung` | Strom-/Gas-Verträge und Anbieterwechsel |
| Versicherungen | `/portal/miety/versicherungen` | Hausrat, Haftpflicht, Wohngebäude |

---

## 4. Smart Home

- Fokus auf Eufy-Geräte-Verwaltung
- Käufe werden auf den internen Amazon-Business-Shop in MOD-16 verlinkt

---

## 5. Contracts

| Contract | Richtung | Zweck |
|----------|----------|-------|
| `Renter Invite` | Z2→Z1→Z3 | Mietereinladung durch Vermieter |

---

## 6. Tile-Catalog Eintrag

```yaml
MOD-20:
  code: "MOD-20"
  title: "Zuhause"
  icon: "Home"
  main_route: "/portal/miety"
  display_order: 20
  sub_tiles: [uebersicht, dokumente, kommunikation, zaehlerstaende, versorgung, versicherungen]
  exception: "6 tiles allowed"
```

---

## 7. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
