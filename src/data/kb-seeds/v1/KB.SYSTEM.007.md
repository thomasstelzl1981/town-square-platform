---
item_code: KB.SYSTEM.007
category: system
content_type: checklist
title_de: "Index-Pflicht für neue Tabellen (Governance)"
summary_de: "Checkliste der Pflicht-Indizes bei jeder neuen Tabelle."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# Index-Pflicht für neue Tabellen

Diese Regeln gelten für **jede neue Tabelle** und **jede Schemaänderung**.

---

## K8: Pflicht-Indizes bei Tabellenerstellung

### 8.1 tenant_id Index

- [ ] Jede Tabelle mit `tenant_id` MUSS einen Index auf `tenant_id` haben
- [ ] Format: `CREATE INDEX idx_[tabelle]_tenant ON public.[tabelle] (tenant_id);`
- [ ] Ohne diesen Index: Full Table Scan bei jeder Tenant-Abfrage

### 8.2 Foreign-Key Indizes

- [ ] Jede FK-Spalte MUSS einen eigenen Index bekommen
- [ ] Format: `CREATE INDEX idx_[tabelle]_[fk_spalte] ON public.[tabelle] ([fk_spalte]);`
- [ ] Betrifft: `_id`-Spalten die auf andere Tabellen referenzieren
- [ ] Ohne FK-Index: Langsame JOINs und Cascade-Deletes

### 8.3 Composite-Index: tenant_id + status

- [ ] Tabellen mit `status`-Spalte MÜSSEN `(tenant_id, status)` Composite-Index haben
- [ ] Format: `CREATE INDEX idx_[tabelle]_tenant_status ON public.[tabelle] (tenant_id, status);`
- [ ] Grund: Häufiges Abfragemuster "alle aktiven Einträge eines Tenants"

### 8.4 Composite-Index: tenant_id + created_at

- [ ] Tabellen mit `created_at`-Spalte MÜSSEN `(tenant_id, created_at)` Composite-Index haben
- [ ] Format: `CREATE INDEX idx_[tabelle]_tenant_created ON public.[tabelle] (tenant_id, created_at);`
- [ ] Grund: Chronologische Sortierung pro Tenant

---

## Migrations-Template

Jede neue Tabelle MUSS diesem Schema folgen:

```sql
-- Tabelle erstellen
CREATE TABLE public.neue_tabelle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PFLICHT: Indizes direkt miterstellen
CREATE INDEX idx_neue_tabelle_tenant ON public.neue_tabelle (tenant_id);
CREATE INDEX idx_neue_tabelle_tenant_status ON public.neue_tabelle (tenant_id, status);
CREATE INDEX idx_neue_tabelle_tenant_created ON public.neue_tabelle (tenant_id, created_at);

-- Falls FK-Spalten vorhanden:
-- CREATE INDEX idx_neue_tabelle_[fk_spalte] ON public.neue_tabelle ([fk_spalte]);
```

---

## Validation

Diese Regeln werden validiert durch:
1. `SELECT * FROM public.check_missing_indexes();` — liefert fehlende Indizes
2. Leere Ergebnismenge = alles korrekt
3. Bei jeder neuen Migration prüfen
