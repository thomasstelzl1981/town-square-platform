# MOD-01 — STAMMDATEN (Master Data & Account Settings)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/stammdaten`  
> **SSOT-Rolle**: Source of Truth für Benutzerprofil, Firmendaten und Sicherheitseinstellungen

---

## 1. Executive Summary

MOD-01 "Stammdaten" verwaltet die persönlichen und organisatorischen Kerndaten des Benutzers.
Es umfasst Profildaten, Firmenstammdaten, Abrechnungsinformationen und Sicherheitseinstellungen.

---

## 2. FROZEN RULES

| ID | Regel |
|----|-------|
| **R1** | Profildaten werden ausschließlich über `profiles`-Tabelle persistiert |
| **R2** | Firmenstammdaten liegen in `organizations` (Tenant-SSOT) |
| **R3** | Passwort-Änderung erfolgt über Supabase Auth API |
| **R4** | Avatar-Upload nutzt `tenant-documents` Bucket mit Pfad `{tenantId}/MOD_01/avatar/` |

---

## 3. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Profil | `/portal/stammdaten/profil` | Persönliche Daten (Name, E-Mail, Telefon, Avatar) |
| Firma | `/portal/stammdaten/firma` | Firmenstammdaten, Handelsregister, USt-ID |
| Abrechnung | `/portal/stammdaten/abrechnung` | Zahlungsinformationen, Rechnungshistorie |
| Sicherheit | `/portal/stammdaten/sicherheit` | Passwort, 2FA, Session-Management |

---

## 4. Datenmodell

### 4.1 Primäre Tabellen

| Tabelle | Zweck |
|---------|-------|
| `profiles` | Benutzerprofil (first_name, last_name, avatar_url, phone) |
| `organizations` | Tenant-Stammdaten (company_name, address, tax_id) |

---

## 5. Tile-Catalog Eintrag

```yaml
MOD-01:
  code: "MOD-01"
  title: "Stammdaten"
  icon: "User"
  main_route: "/portal/stammdaten"
  display_order: 1
  sub_tiles: [profil, firma, abrechnung, sicherheit]
```

---

## 6. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
