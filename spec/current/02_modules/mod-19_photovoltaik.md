# MOD-19 — PHOTOVOLTAIK (Solar Energy Management)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/photovoltaik`  
> **SSOT-Rolle**: Source of Truth für PV-Angebote, Checklisten und Projektfortschritt

---

## 1. Executive Summary

MOD-19 "Photovoltaik" begleitet Nutzer durch den gesamten PV-Prozess: vom Angebot über
die Checkliste bis zur Projektabwicklung. GoldenPathGuard schützt die Anlagen-Detailseiten.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | GoldenPathGuard umschließt PV-Anlagen-Detailseiten |
| **R2** | Angebote werden als Golden-Path-Flow modelliert |

---

## 3. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Angebot | `/portal/photovoltaik/angebot` | PV-Angebots-Konfigurator |
| Checkliste | `/portal/photovoltaik/checkliste` | Voraussetzungen und Dokumenten-Checklist |
| Projekt | `/portal/photovoltaik/projekt` | Laufende PV-Projekte und Monitoring |
| Settings | `/portal/photovoltaik/settings` | Anlagen-Einstellungen und Ertragsberichte |

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-19:
  code: "MOD-19"
  title: "Photovoltaik"
  icon: "Sun"
  main_route: "/portal/photovoltaik"
  display_order: 19
  sub_tiles: [angebot, checkliste, projekt, settings]
```

---

## 5. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
