# MOD-15 — FORTBILDUNG (Continuing Education)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-13  
> **Zone**: 2 (User Portal) + Zone 1 (Admin-Kuratierung)  
> **Route-Prefix**: `/portal/fortbildung` (Z2), `/admin/fortbildung` (Z1)  
> **SSOT-Rolle**: Source of Truth für Kurskatalog, Zertifikate und Lernfortschritt

---

## 1. Executive Summary

MOD-15 "Fortbildung" bietet einen kuratierten Katalog von Büchern (Amazon), Fortbildungen
(Udemy), Vorträgen (Eventbrite) und Kursen (YouTube). Die Zone-1-Admin-Oberfläche ermöglicht
Drag-and-Drop-Sortierung und Metadaten-Verwaltung (Affiliate-Links, Bilder, Preise).

---

## 2. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Katalog | `/portal/fortbildung/katalog` | Kuratierte Inhalte nach Kategorien |
| Meine Kurse | `/portal/fortbildung/meine-kurse` | Lernfortschritt und aktive Kurse |
| Zertifikate | `/portal/fortbildung/zertifikate` | Erworbene Zertifikate und Nachweise |
| Settings | `/portal/fortbildung/settings` | Lernziele und Benachrichtigungen |

---

## 3. Zone-1 Admin

- Route: `/admin/fortbildung`
- Drag-and-Drop Sortierung der Katalog-Einträge
- Metadaten-Verwaltung: Affiliate-Links, Cover-Bilder, Preise
- Datenbasis: Verifizierte Bestseller, Branchen-Events, YouTube-Kanäle (immocation, Finanzfluss)

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-15:
  code: "MOD-15"
  title: "Fortbildung"
  icon: "GraduationCap"
  main_route: "/portal/fortbildung"
  display_order: 15
  sub_tiles: [katalog, meine-kurse, zertifikate, settings]
```

---

## 5. Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-13 | Initial Release (Sprint S5) |
