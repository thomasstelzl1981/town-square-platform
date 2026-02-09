---
item_code: KB.SYSTEM.009
category: system
content_type: checklist
title_de: "Akten-Standard und Prefix-Register"
summary_de: "Verbindlicher Standard fuer alle Erfassungsakten: Layout, ID-System, DMS-Anbindung."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Akten-Standard und Prefix-Register

Verbindlicher Standard fuer alle 6 Erfassungsakten und zukuenftige Erweiterungen.

---

## K13: Accordion-Layout-Pflicht

- [ ] Jede Master-Vorlage nutzt Accordion-Bloecke (kein Tab-Layout)
- [ ] Header: Icon + Titel + MOD-Code + Read-Only Badge + Zurueck-Button
- [ ] Info-Banner: Datenquelle und Types-Referenz
- [ ] 4 Stats-Karten: Bloecke, Felder, Entitaeten, Pflichtfelder
- [ ] 5-Spalten-Tabelle: field_key, label_de, entity, type, notes

---

## K14: public_id-Pflicht

- [ ] Jede geschaeftskritische Entitaet MUSS `public_id TEXT UNIQUE` besitzen
- [ ] Format: `SOT-{PREFIX}-{BASE32_8_ZEICHEN}`
- [ ] Auto-Generierung ueber INSERT-Trigger
- [ ] Bestehende Zeilen per Backfill aktualisieren
- [ ] Prefix MUSS im Register (K17) dokumentiert sein

---

## K15: Master-Vorlage-Pflicht

- [ ] Jede Akte MUSS unter `/admin/masterdata/{name}` dokumentiert sein
- [ ] Dokumentation MUSS VOR Zone-2-Implementierung erfolgen
- [ ] Vorlage ist Read-Only (keine DB-Abhaengigkeit)
- [ ] Karte auf MasterTemplates-Hauptseite erforderlich

---

## K16: DMS-Subtree-Pflicht

- [ ] Jede Akte mit Dokumenten-Bezug MUSS definierte DMS-Ordnerstruktur besitzen
- [ ] Ordner liegen unter dem jeweiligen Modul-Root (MOD_XX)
- [ ] Blob-Pfad: `{tenant_id}/{module_code}/{entity_id}/{filename}`
- [ ] Entity-Ordner werden bei Akte-Erstellung automatisch angelegt

---

## K17: Prefix-Register

Alle vergebenen Prefixe. Vor Vergabe eines neuen Prefix MUSS Eindeutigkeit geprueft werden.

### Vergebene Prefixe

| Prefix | Entity | Tabelle | Modul |
|--------|--------|---------|-------|
| T | Organisation/Tenant | organizations | — |
| I | Immobilie | properties | MOD-04 |
| E | Einheit | units | MOD-04 |
| K | Kontakt | contacts | MOD-03 |
| D | Dokument | documents | MOD-09 |
| F | Finanzpaket | finance_packages | MOD-11 |
| FR | Finanzierungsanfrage | finance_requests | MOD-07 |
| FM | Finanzierungsmandat | finance_mandates | MOD-11 |
| FB | Finanzierung Bankkontakt | finance_bank_contacts | MOD-11 |
| V | Fahrzeug | cars_vehicles | MOD-17 |
| L | Lead | leads | MOD-06 |
| INT | Integration | integration_registry | — |
| BT | Bautraeger-Projekt | dev_projects | MOD-13 |
| BE | Bautraeger-Einheit | dev_project_units | MOD-13 |
| AP | Antragsteller-Profil | applicant_profiles | MOD-07 |
| PV | PV-Anlage | pv_plants | MOD-19 |
| MV | Mietvertrag | leases | MOD-04 |

### Reservierte Prefixe (fuer zukuenftige Nutzung)

| Prefix | Geplante Entity | Status |
|--------|----------------|--------|
| SD | Selbstauskunft-Dokument | Reserviert |
| SC | Service-Case | Reserviert |
| BW | Bewertung | Reserviert |

---

## Checkliste: Neue Akte anlegen

1. Prefix waehlen → Eindeutigkeit in K17 pruefen
2. DB-Migration: `public_id TEXT` + Trigger + Backfill
3. DMS-Subtree-Template definieren (Unterordner)
4. Master-Vorlage erstellen (Accordion, 5-Spalten)
5. Route in routesManifest.ts + ManifestRouter.tsx
6. Karte auf MasterTemplates.tsx Hauptseite

---

## Aktueller Stand: 6 Akten

| Nr | Akte | Modul | Vorlage | public_id |
|----|------|-------|---------|-----------|
| 1 | Immobilienakte | MOD-04 | ✅ | I |
| 2 | Selbstauskunft | MOD-07 | ✅ | AP |
| 3 | Projektakte | MOD-13 | ✅ | BT/BE |
| 4 | Fahrzeugakte | MOD-17 | ✅ | V |
| 5 | Photovoltaikakte | MOD-19 | ✅ | PV |
| 6 | Finanzierungsakte | MOD-11 | ✅ | FM/FR/F |
