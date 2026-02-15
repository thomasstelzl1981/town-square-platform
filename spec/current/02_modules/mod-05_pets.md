# MOD-05 — PETS (Pet Management)

> **Version**: 1.0.0  
> **Status**: ACTIVE  
> **Datum**: 2026-02-15  
> **Zone**: 2 (User Portal)  
> **Route-Prefix**: `/portal/pets`  
> **SSOT-Rolle**: Source of Truth für Haustier-Verwaltung
> **Activation**: `requires_activation: true`

---

## 1. Purpose

MOD-05 "Pets" ermöglicht die digitale Verwaltung von Haustieren innerhalb des Musterportals. 
Das Modul bietet Tierprofil-Verwaltung, Gesundheitsakte, Termine und Dokumentenablage.

---

## 2. Tiles (4)

| Tile | Route | Beschreibung |
|------|-------|--------------|
| Dashboard | `/portal/pets/dashboard` | Übersicht aller Haustiere mit KPIs |
| Meine Tiere | `/portal/pets/meine-tiere` | Tierprofil-Verwaltung und -Details |
| Gesundheit | `/portal/pets/gesundheit` | Gesundheitsakte, Impfungen, Termine |
| Dokumente | `/portal/pets/dokumente` | Tierbezogene Dokumente (Pässe, Versicherungen) |

---

## 3. Dynamic Routes

| Route | Beschreibung |
|-------|--------------|
| `/portal/pets/:petId` | Tier-Detailseite |

---

## 4. Tile-Catalog Eintrag

```yaml
MOD-05:
  code: "MOD-05"
  title: "Pets"
  icon: "PawPrint"
  main_route: "/portal/pets"
  display_order: 5
  requires_activation: true
  sub_tiles: [dashboard, meine-tiere, gesundheit, dokumente]
```

---

## 5. Acceptance Checks

- [ ] Dashboard zeigt Tier-KPIs (Anzahl, nächste Termine)
- [ ] Tierprofil CRUD funktioniert
- [ ] Gesundheitsakte zeigt Impfhistorie
- [ ] Dokumente-Tab verlinkt auf DMS

---

## Changelog

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0.0 | 2026-02-15 | Initial spec (replaces stale mod-05_website-builder.md which contained MSV spec) |
