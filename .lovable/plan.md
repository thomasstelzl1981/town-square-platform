

# Plan: Default "Privat"-Kontext bei Tenant-Erstellung automatisch anlegen

## Analyse

Aktuell wird bei der Registrierung (`handle_new_user`) kein `landlord_contexts`-Eintrag erstellt. Der erste Kontext entsteht erst manuell (z.B. "MM. Wohnen GmbH"). Dadurch hat ein Tenant mit nur einer Gesellschaft genau 1 Kontext, und die Query `contexts.length > 1` greift nicht.

Dein Vorschlag: **Immer einen "Privat"-Default-Kontext anlegen.** Das ist die sauberere Lösung — es gibt dann immer mindestens 1 Kontext, und bei einer Gesellschaft sind es mindestens 2.

## Änderungen

### 1. DB-Funktion `handle_new_user` erweitern

Am Ende der Funktion (nach `household_persons` Insert) einen Default-Kontext einfügen:

```sql
INSERT INTO public.landlord_contexts (
  tenant_id, name, context_type, is_default
) VALUES (
  new_org_id, 'Privat', 'PRIVATE', true
);
```

### 2. Bestehende Tenants: Migration für fehlende Default-Kontexte

Einmalige Migration, die allen bestehenden Tenants ohne `is_default = true` Kontext einen "Privat"-Default anlegt:

```sql
INSERT INTO landlord_contexts (tenant_id, name, context_type, is_default)
SELECT o.id, 'Privat', 'PRIVATE', true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM landlord_contexts lc 
  WHERE lc.tenant_id = o.id AND lc.is_default = true
);
```

### 3. `PortfolioTab.tsx` — Query-Bedingung bleibt `> 1`

Die bisherige Bedingung `contexts.length > 1` kann **beibehalten werden**, da jetzt immer mindestens der "Privat"-Kontext existiert. Sobald eine Gesellschaft dazukommt → 2 Kontexte → Query feuert.

**Aber:** Auch bei nur 1 Kontext (nur Privat, keine Gesellschaft) sollten Assignments geladen werden. Daher trotzdem auf `> 0` ändern — das ist defensiver und kostet nichts.

### 4. Kein weiterer Code-Aufwand

- `CreateContextDialog` setzt bereits `is_default: false` für manuell erstellte Kontexte
- `KontexteTab` zeigt alle Kontexte korrekt an
- Die Portfolio-Widgets berechnen KPIs bereits korrekt, sobald `contextAssignments` geladen wird

## Zusammenfassung

| Schritt | Datei/Ort | Aufwand |
|---------|-----------|---------|
| Default "Privat" bei Signup | DB-Funktion `handle_new_user` | 4 Zeilen SQL |
| Backfill bestehende Tenants | Migration | 5 Zeilen SQL |
| Query-Fix defensiv | `PortfolioTab.tsx` Zeile 205 | 1 Zeile |

