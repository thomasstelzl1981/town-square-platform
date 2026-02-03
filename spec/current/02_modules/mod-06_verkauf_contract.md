# MOD-06 — VERKAUF Downstream Contract

> **Version**: 1.0.0  
> **Status**: FROZEN  
> **Datum**: 2026-02-03  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/verkauf`  
> **SSOT-Rolle**: Consumer (liest aus MOD-04)

---

## 1. Purpose

MOD-06 "Verkauf" verwaltet den Verkaufsprozess für Immobilien (Listings, Publications, Inquiries, Reservations, Transactions).

**Verkauf besitzt KEINE eigenen Property/Unit-Daten.** Alle Objektdaten werden aus MOD-04 Immobilien gelesen. MOD-06 ergänzt lediglich Listing-spezifische Informationen.

---

## 2. Read Contract (from MOD-04)

### 2.1 Gelesene Tabellen

| Tabelle | Felder | Filter |
|---------|--------|--------|
| `units` | id, unit_number, area_sqm, current_monthly_rent | properties.status = 'active' |
| `properties` | id, code, address, city, postal_code, property_type | status = 'active' |

### 2.2 KEINE Filter-Einschränkung

Verkauf zeigt **ALLE Units** aus MOD-04 an, unabhängig von `sale_enabled`.

Das Flag `sale_enabled` steuert lediglich funktionale Aktionen (z.B. "Inserat erstellen" Button), nicht die Sichtbarkeit.

---

## 3. Write Contract (Verkauf-owned Data)

### 3.1 Eigene Tabellen

| Tabelle | Beschreibung |
|---------|--------------|
| `listings` | Inserat-Payload (property_id/unit_id, title, asking_price, status) |
| `listing_publications` | Channel-Status (kaufy, partner_network, scout24) |
| `inquiries` | Anfragen von Interessenten |
| `reservations` | Reservierungen |
| `transactions` | Abgeschlossene Verkäufe |

### 3.2 Listing-Lifecycle

```
draft → active → reserved → sold
              ↘ withdrawn
```

### 3.3 NIEMALS schreiben in

- `properties` ❌
- `units` ❌
- `leases` ❌

---

## 4. Navigation

### 4.1 Tiles

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Objekte | `/portal/verkauf/objekte` | Unit-Liste (aus MOD-04) mit Listing-Status |
| Vorgänge | `/portal/verkauf/vorgaenge` | Aktive Verkaufsprozesse |
| Reporting | `/portal/verkauf/reporting` | Verkaufsstatistiken |
| Einstellungen | `/portal/verkauf/einstellungen` | Channel-Konfiguration |

### 4.2 Dynamic Routes

| Route | Beschreibung |
|-------|--------------|
| `/portal/verkauf/expose/:unitId` | Verkaufsexposé für Unit |

### 4.3 Cross-Module Navigation

- Header-Link: "Stammdaten bearbeiten → MOD-04 Portfolio" (`/portal/immobilien/portfolio`)

---

## 5. Exposé-Generierung

### 5.1 Datenfluss

1. **Read**: Unit + Property aus MOD-04
2. **Enrich**: Listing-Payload (Preis, Beschreibung, Fotos)
3. **Publish**: Channel-spezifische Publikation

### 5.2 Keine "zweite Akte"

Das Verkaufsexposé ist **KEINE Kopie** der Immobilienakte. Es liest Property-Daten live aus MOD-04 und ergänzt nur verkaufsspezifische Felder.

---

## 6. Empty State

```
"Keine Einheiten im Portfolio"
CTA: "Zum Immobilien-Modul" → /portal/immobilien
```

---

## 7. Acceptance Checks

- [ ] ObjekteTab liest aus `units` JOIN `properties` (keine eigene Tabelle)
- [ ] Keine Writes auf `properties`, `units`
- [ ] Exposé-Detail liest Property-Daten aus MOD-04
- [ ] Header zeigt Link zu MOD-04 Portfolio

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-03 | Initial Contract Spec |
