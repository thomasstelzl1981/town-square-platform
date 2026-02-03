# MOD-05 — MSV Downstream Contract

> **Version**: 1.0.0  
> **Status**: FROZEN  
> **Datum**: 2026-02-03  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/msv`  
> **SSOT-Rolle**: Consumer (liest aus MOD-04)

---

## 1. Purpose

MOD-05 "Mietsonderverwaltung" (MSV) ist ein **Consumer-Modul**, das Mietverhältnisse operativ verwaltet (Mahnungen, Mietberichte, Tenant-Invites, Premium-Features).

**MSV besitzt KEINE eigenen Property/Unit/Lease-Daten.** Alle Objekt- und Mietvertragsdaten werden aus MOD-04 Immobilien gelesen.

---

## 2. Read Contract (from MOD-04)

### 2.1 Gelesene Tabellen

| Tabelle | Felder | Filter |
|---------|--------|--------|
| `units` | id, unit_number, area_sqm, property_id | tenant_id = active |
| `properties` | id, code, address, city, status | status = 'active' |
| `leases` | id, unit_id, status, rent_*, tenant_contact_id | status = 'active' |
| `contacts` | id, first_name, last_name, email | – |

### 2.2 KEINE Filter-Einschränkung

MSV zeigt **ALLE Units** aus MOD-04 an, unabhängig von Flags wie `rental_managed`.

Dies entspricht dem Prinzip: "Total Visibility Rule" — Downstream-Module zeigen alle MOD-04-Daten, Unterschiede sind funktional (Spalten, Workflows), nicht visibility-basiert.

### 2.3 Multi-Lease Aggregation

MSV aggregiert bei Units mit mehreren aktiven Mietverträgen:
- `kaltmiete`: Summe aller `rent_cold_eur`
- `nebenkosten`: Summe aller `nk_advance_eur`
- `warmmiete`: kalt + nk + heating

---

## 3. Write Contract (MSV-owned Data)

### 3.1 Eigene Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `msv_enrollments` | Premium-Aktivierung pro Property |
| `msv_payment_reports` | Monatliche Mietberichte |
| `communication_events` | Mahnungen, Datenanforderungen |
| `renter_invitations` | Mieter-Einladungen für Tenant-Portal |

### 3.2 NIEMALS schreiben in

- `properties` ❌
- `units` ❌
- `leases` ❌
- `document_links` (nur lesen, Uploads via DMS) ❌

---

## 4. Navigation

### 4.1 Tiles

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Objekte | `/portal/msv/objekte` | Unit-Liste (aus MOD-04) |
| Mieteingang | `/portal/msv/mieteingang` | Soll/Ist-Abgleich (Premium) |
| Vermietung | `/portal/msv/vermietung` | Vermietungs-Exposés |
| Einstellungen | `/portal/msv/einstellungen` | Automatisierung |

### 4.2 Deep Links

- Row-Click in ObjekteTab → `/portal/immobilien/:propertyId` (Dossier in MOD-04)
- Eye-Icon → `/portal/immobilien/:propertyId`

---

## 5. Empty State

```
"Keine Immobilien vorhanden — zuerst in MOD-04 anlegen"
CTA: "Objekte anlegen (MOD-04)" → /portal/immobilien/portfolio
```

---

## 6. Acceptance Checks

- [ ] ObjekteTab liest aus `units` JOIN `properties` (keine eigene Tabelle)
- [ ] Keine Writes auf `properties`, `units`, `leases`
- [ ] Row-Click navigiert zu `/portal/immobilien/:propertyId`
- [ ] Empty State verweist auf MOD-04

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-03 | Initial Contract Spec |
