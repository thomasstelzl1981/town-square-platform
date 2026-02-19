# MOD-12 — AKQUISE-MANAGER (Acquisition Workbench)

> **Version**: 1.1.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-18  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/akquise-manager`  
> **SSOT-Rolle**: Source of Truth für Akquise-Mandate, Objekteingang und Kontaktrecherche

---

## 1. Executive Summary

MOD-12 "Akquise-Manager" implementiert eine 2-Stufen-Architektur zur Trennung von
Mandatserstellung und operativer Verwaltung. Es umfasst KI-gestützte Profilerfassung,
automatisierte Kontaktrecherche, Objekteingang mit Exposé-Verarbeitung, professionelle
Bewertungstools und eine Systemgebühr-/Provisionsübersicht.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Mandate werden über `Acq Mandate Submit` Contract (Z2→Z1) eingereicht |
| **R2** | Objekteingang nutzt Drag-and-Drop auf Mandate-Widgets für automatische Zuordnung |
| **R3** | KI-Profilerfassung via Edge-Function `sot-acq-profile-extract` (Gemini 2.5 Flash) |
| **R4** | GoldenPathGuard umschließt alle Detailseiten (`mandateId`, `offerId`) |

---

## 3. Tiles (6)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Dashboard | `/portal/akquise-manager/dashboard` | Widget-Cards mit aktiven Mandaten und KPIs |
| Mandate | `/portal/akquise-manager/mandate` | Erfassungs-Hub (4-Kachel-Grid: KI-Erfassung, KI-Entwurf, Recherche, E-Mail) |
| Objekteingang | `/portal/akquise-manager/objekteingang` | Exposé-Eingang mit DnD-Zuordnung zu Mandaten |
| Datenbank | `/portal/akquise-manager/datenbank` | Kontakt- und Objektdatenbank |
| Tools | `/portal/akquise-manager/tools` | Portal-Recherche, Bewertung, GeoMap, Kalkulator, Datenraum |
| Provisionen | `/portal/akquise-manager/systemgebuehr` | Systemgebühr-Vereinbarung und Provisionsübersicht |

---

## 4. 2-Stufen-Architektur

### Stufe 1: Erfassungs-Hub (AkquiseMandate.tsx)
- 4-Kachel-Grid: KI-Erfassung, KI-Entwurf, Kontaktrecherche, E-Mail-Fenster
- Zentrale CI-Vorschau
- Button "Ankaufsprofil übernehmen" befüllt synchron CI-Vorschau + E-Mail-Entwürfe + Recherche

### Stufe 2: Mandat-Workbench (AkquiseMandateDetail.tsx)
- Widget-Switcher oben
- Bestands- und Aufteiler-Kalkulationen nebeneinander
- Objekt-Zuordnung und Status-Tracking

---

## 5. Datenmodell

| Tabelle | Zweck |
|---------|-------|
| `acq_mandates` | Mandate mit Status-Enum, Suchprofil, Preisrahmen |
| `acq_offers` | Eingehende Objekte/Exposés |
| `acq_offer_documents` | Dokumente pro Objekt |
| `acq_outbound_messages` | Ausgehende E-Mails |
| `acq_inbound_messages` | Eingehende Antworten |
| `acq_analysis_runs` | KI-Analyse-Läufe |
| `acq_mandate_events` | Event-Log pro Mandat |

---

## 6. Edge Functions

| Function | Zweck |
|----------|-------|
| `sot-acq-profile-extract` | KI-Profilerfassung aus Freitext |
| `sot-acq-outbound` | Akquise-Anschreiben versenden |
| `sot-acq-inbound-webhook` | Eingehende Antwort-E-Mails verarbeiten |

---

## 7. Tile-Catalog Eintrag

```yaml
MOD-12:
  code: "MOD-12"
  title: "Akquisemanager"
  icon: "Briefcase"
  main_route: "/portal/akquise-manager"
  display_order: 12
  sub_tiles: [dashboard, mandate, objekteingang, datenbank, tools, systemgebuehr]
```

---

## 8. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.1.0 | 2026-02-18 | 6. Tile "Provisionen" (Route: systemgebuehr) hinzugefügt. Tile-Catalog YAML aktualisiert. |
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
