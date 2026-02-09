

# Governance: Automatische Index-Prüfung

## Problem

Aktuell gibt es keinen Mechanismus, der sicherstellt, dass neue Tabellen automatisch mit den richtigen Indizes angelegt werden. Bei 46+ Migrationsdateien und wachsendem System passiert es leicht, dass ein Index vergessen wird.

## Loesung: Zwei Massnahmen

### Massnahme 1: Governance-Regel (KB.SYSTEM.007)

Eine neue Knowledge-Base-Regel wird erstellt, die als Checkliste fuer jede neue Tabelle dient:

**Datei:** `src/data/kb-seeds/v1/KB.SYSTEM.007.md`

Inhalt:
- Jede neue Tabelle mit `tenant_id` MUSS einen Index auf `tenant_id` enthalten
- Jede Foreign-Key-Spalte MUSS einen eigenen Index bekommen
- Tabellen mit `status`-Spalte MUESSEN einen Composite-Index `(tenant_id, status)` bekommen
- Tabellen mit `created_at` MUESSEN einen Composite-Index `(tenant_id, created_at)` bekommen

Diese Regel wird Teil der Must-Not-Break Regeln (wie K1-K7 in KB.SYSTEM.006).

### Massnahme 2: SQL-Validierungsfunktion

Eine Datenbank-Funktion `public.check_missing_indexes()`, die jederzeit aufgerufen werden kann und eine Liste aller Tabellen zurueckgibt, denen ein Index fehlt.

**Was sie prueft:**
1. Alle Tabellen mit `tenant_id` ohne Index darauf
2. Alle Foreign-Key-Spalten ohne Index
3. Alle `status`-Spalten ohne Composite-Index mit `tenant_id`

**Wie sie genutzt wird:**
```sql
SELECT * FROM public.check_missing_indexes();
```

Gibt eine Tabelle zurueck mit:
| table_name | column_name | issue |
|------------|-------------|-------|
| neue_tabelle | tenant_id | Kein Index auf tenant_id |
| neue_tabelle | contact_id | Kein Index auf FK-Spalte |

Wenn die Abfrage keine Zeilen zurueckgibt, ist alles in Ordnung.

### Massnahme 3: Migrations-Template

Ein dokumentiertes Template, das als Vorlage fuer jede neue Migration dient:

```sql
-- Tabelle erstellen
CREATE TABLE public.neue_tabelle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  -- weitere Spalten...
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PFLICHT: Indizes direkt miterstellen
CREATE INDEX idx_neue_tabelle_tenant ON public.neue_tabelle (tenant_id);
CREATE INDEX idx_neue_tabelle_tenant_created ON public.neue_tabelle (tenant_id, created_at);
-- Falls FK-Spalten vorhanden:
-- CREATE INDEX idx_neue_tabelle_[fk_spalte] ON public.neue_tabelle ([fk_spalte]);
```

## Technische Details

### KB.SYSTEM.007 Datei
- Wird als neue Markdown-Datei im KB-Seed-Verzeichnis angelegt
- Folgt dem bestehenden Format (Frontmatter + Checkliste)
- Wird als K8-Regel in die Must-Not-Break Kette eingereiht

### SQL-Funktion check_missing_indexes()
- Wird als Datenbank-Migration angelegt
- Nutzt `pg_catalog` und `pg_indexes` System-Views
- Prueft nur Tabellen im `public` Schema
- Gibt `TABLE (table_name TEXT, column_name TEXT, issue TEXT)` zurueck
- Kann jederzeit manuell oder automatisiert aufgerufen werden

### Aenderungen am bestehenden Code
- Kein Frontend-Code wird geaendert
- Keine Routen werden geaendert
- Keine bestehenden Tabellen werden modifiziert
- Es werden nur 1 neue Datei (KB-Regel) und 1 DB-Funktion erstellt

## Risiko

Null. Eine KB-Datei und eine reine Lese-Funktion haben keinen Einfluss auf bestehende Funktionalitaet.

## Ergebnis

Nach der Implementierung habt ihr:
1. Eine dokumentierte Regel, die bei jeder neuen Tabelle gilt
2. Ein Pruef-Tool, das fehlende Indizes sofort aufdeckt
3. Ein Template, das die korrekte Struktur vorgibt

Damit kann bei keiner zukuenftigen Erweiterung ein Index vergessen werden — und falls doch, wird es sofort erkannt.

