

## Fix: Legal-Seiten (Impressum/Datenschutz) fuer Website-Besucher sichtbar machen

### Problem

Die Impressum- und Datenschutzseiten auf allen 5 Brand-Websites (systemofatown.com, kaufy.immo, futureroom.online, acquiary.com, lennoxandfriends.app) zeigen nur "Dokument nicht verfuegbar", weil die Datenbank-Abfragen leer zurueckkommen.

**Ursache**: Die drei relevanten Tabellen haben Row-Level-Security (RLS) aktiviert, und die SELECT-Policies erlauben nur eingeloggte Benutzer (`authenticated`). Website-Besucher sind **nicht** eingeloggt und erhalten daher keine Daten.

Betroffene Tabellen:
- `compliance_documents` (Policy: `cd_select_authenticated`)
- `compliance_document_versions` (Policy: `cdv_select_authenticated`)
- `compliance_company_profile` (Policy: `ccp_select_authenticated`)

Die Daten selbst sind alle vorhanden und korrekt (10 Dokumente mit aktiven Versionen, 3 Firmenprofile).

### Loesung

Drei neue RLS-Policies hinzufuegen, die **anonymen Lesezugriff (SELECT)** auf diese oeffentlichen Dokumente erlauben. Die bestehenden Policies bleiben unveraendert.

### SQL Migration

```sql
-- 1. Compliance Documents: anon darf website_* Dokumente lesen
CREATE POLICY "cd_select_anon_website"
  ON compliance_documents
  FOR SELECT
  TO anon
  USING (doc_key LIKE 'website_%');

-- 2. Compliance Document Versions: anon darf aktive Versionen lesen
--    (nur fuer Dokumente, die ueber Policy 1 sichtbar sind)
CREATE POLICY "cdv_select_anon_active"
  ON compliance_document_versions
  FOR SELECT
  TO anon
  USING (
    status = 'active'
    AND document_id IN (
      SELECT id FROM compliance_documents WHERE doc_key LIKE 'website_%'
    )
  );

-- 3. Company Profile: anon darf alle Profile lesen (nur oeffentliche Firmendaten)
CREATE POLICY "ccp_select_anon"
  ON compliance_company_profile
  FOR SELECT
  TO anon
  USING (true);
```

### Sicherheitsaspekte

- Die Policies erlauben **nur SELECT** (kein INSERT/UPDATE/DELETE) fuer `anon`
- `compliance_documents`: Nur Dokumente mit `website_*` Prefix sind sichtbar (keine internen Portal-Dokumente wie `portal_agb`)
- `compliance_document_versions`: Nur `active` Versionen von Website-Dokumenten (keine Drafts)
- `compliance_company_profile`: Enthaelt ausschliesslich oeffentliche Firmendaten (Adresse, Handelsregister) -- diese stehen ohnehin im Impressum

### Kein Code-Aenderung noetig

Die Komponente `Zone3LegalPage.tsx` und alle Brand-spezifischen Seiten (SotImpressum, SotDatenschutz, etc.) funktionieren bereits korrekt. Das Problem liegt ausschliesslich in den fehlenden Datenbank-Policies.

### Betroffene Dateien

| Aenderung | Typ |
|-----------|-----|
| SQL Migration: 3 neue RLS-Policies | Backend |

Keine Frontend-Dateien betroffen.

