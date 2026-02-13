# MOD-09 — VERTRIEBSPARTNER (Sales Partner Portal)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/vertriebspartner`  
> **SSOT-Rolle**: Source of Truth für Partner-Katalog, Beratung und Lead-Management

---

## 1. Executive Summary

MOD-09 "Vertriebspartner" ist die operative Zentrale für Sales Partner. Es bietet einen
Immobilienkatalog mit Provisionsanzeige, einen kundenfreundlichen Beratungsmodus ohne
Provisionsdaten, eine Kundenverwaltung, ein Partnernetzwerk und das Selfie Ads Studio
für Social-Media-Kampagnen.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Katalog-View zeigt Partner-Provision; Beratung-View NICHT (Blind-to-Customer Policy) |
| **R2** | Listings kommen aus `v_public_listings` (Read-Only) |
| **R3** | Lead-Eingang nutzt den Contract `Lead Capture` (Z3→Z1) |
| **R4** | Selfie Ads Mandate werden über `Social Mandate Submit` (Z2→Z1) eingereicht |

---

## 3. Tiles (5)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Katalog | `/portal/vertriebspartner/katalog` | Immobilien-Grid mit Provision |
| Beratung | `/portal/vertriebspartner/beratung` | Kundenfreundliche Ansicht ohne Provision |
| Kunden | `/portal/vertriebspartner/kunden` | CRM für Partner-Kunden |
| Network | `/portal/vertriebspartner/network` | Partner-Netzwerk und Vermittlungen |
| Leads | `/portal/vertriebspartner/leads` | Leadeingang und Selfie Ads Studio |

---

## 4. Selfie Ads Studio

- Route: `/portal/vertriebspartner/selfie-ads`
- 5-Slot Template-System (T1..T5) für Creative-Generierung
- Kampagnen-Buchung mit Prepayment über `Social Payment` Contract
- Meta Leadgen Webhook → automatisches Lead-Routing in Partner-Inbox

---

## 5. Tile-Catalog Eintrag

```yaml
MOD-09:
  code: "MOD-09"
  title: "Vertriebspartner"
  icon: "Users"
  main_route: "/portal/vertriebspartner"
  display_order: 9
  sub_tiles: [katalog, beratung, kunden, network, leads]
  exception: "5 tiles: includes Leads tab"
```

---

## 6. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
