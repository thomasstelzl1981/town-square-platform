

# Tiefenpruefung: Ergebnisse und Fixes

## Zusammenfassung

Die Implementierung ist strukturell korrekt aufgebaut. Die Templates sind in der DB, die Spalten existieren, die UI-Komponenten sind sauber integriert. Es gibt jedoch **3 kritische Blocker** und **4 mittlere Probleme**, die behoben werden muessen.

---

## KRITISCHE PROBLEME (Blocker)

### K1: RLS blockiert commissions INSERT fuer normale User

**Problem:** Die `commissions`-Tabelle hat nur eine INSERT-Policy fuer Platform Admins (`com_insert_platform_admin`). Wenn ein Finance Manager, Akquise-Manager oder Eigentuemer den TermsGatePanel-Vertrag akzeptiert, schlaegt der `commissions INSERT` fehl mit einem RLS-Fehler.

**Betroffene Pfade:** ALLE 4 (Finanzierung, Akquise, Verkauf, Lead)

**Fix:** Neue RLS-Policy hinzufuegen:
```sql
CREATE POLICY "com_insert_via_terms_gate" ON commissions
  FOR INSERT
  WITH CHECK (
    liable_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = commissions.tenant_id
    )
  );
```

### K2: documents INSERT nur fuer org_admin/internal_ops

**Problem:** Die `documents`-Tabelle erlaubt INSERT nur fuer `org_admin` und `internal_ops` Rollen. Ein Finance Manager oder Vertriebspartner, der den Vertrag akzeptiert, kann das Vertragsdokument nicht in die DMS-Tabelle speichern.

**Betroffene Pfade:** ALLE 4 (Vertragsspeicherung schlaegt fehl)

**Anmerkung:** Der Code in `contractGenerator.ts` (Zeile 129-131) behandelt den Upload-Fehler graceful — der Flow bricht nicht ab, aber das Dokument wird nicht gespeichert. Das ist ein stiller Fehler.

**Fix:** Neue RLS-Policy:
```sql
CREATE POLICY "docs_insert_contract_member" ON documents
  FOR INSERT
  WITH CHECK (
    doc_type = 'CONTRACT'
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = documents.tenant_id
    )
  );
```

### K3: Storage-Bucket "documents" existiert nicht

**Problem:** Die Query `SELECT FROM storage.buckets WHERE name = 'documents'` gibt ein leeres Ergebnis zurueck. Der `contractGenerator.ts` versucht, in `supabase.storage.from('documents')` hochzuladen — das schlaegt stillschweigend fehl.

**Fix:** Storage-Bucket erstellen und RLS-Policies hinzufuegen.

---

## MITTLERE PROBLEME

### M1: Akquise-Gate — partner_name wird als UUID gesetzt

**Datei:** `AkquiseManagerPage.tsx`, Zeile 343
```typescript
partner_name: mandate.assigned_manager_user_id || '',
```
Hier wird die UUID des Managers als `partner_name` in den Vertrag eingesetzt, nicht der Anzeigename. Der generierte Vertrag zeigt dann eine UUID statt eines Namens.

**Fix:** Den Display-Namen des eingeloggten Users verwenden (der Manager ist der eingeloggte User bei Accept).

### M2: Akquise-Gate — grossCommission und grossCommissionPct sind 0

**Datei:** `AkquiseManagerPage.tsx`, Zeilen 353-354
```typescript
grossCommission={0}
grossCommissionPct={0}
```
Der Vertrag zeigt "0,00 EUR Brutto-Provision" und "0,00 EUR Plattformgebuehr". Das ist im Plan als "extern vereinbart" beschrieben, aber die Vertragsvorschau sieht leer/fehlerhaft aus.

**Fix:** Entweder ein spezielles Template ohne Zahlen verwenden, oder einen Hinweistext "Wird bei Mandatsabschluss bestimmt" anzeigen, wenn grossCommission = 0.

### M3: sot-finance-manager-notify — from_address wird nicht von sot-system-mail-send verwendet

**Datei:** `sot-finance-manager-notify/index.ts`, Zeile 125
```typescript
from_address: 'futureroom@systemofatown.com',
```
Aber `sot-system-mail-send` hat keinen `from_address`-Parameter — es nutzt ausschliesslich `get_active_outbound_identity`. Der uebergebene Desk-Absender wird ignoriert.

**Fix:** Entweder `sot-system-mail-send` um einen optionalen `from_override`-Parameter erweitern, oder einen Desk-System-Account mit Outbound-Identity in der DB anlegen.

### M4: Lead Pool — Accept-Button hat keinen TermsGate-Flow

**Datei:** `LeadPool.tsx`, Zeile 316-321
Die Zuweisungs-Buttons (UserPlus-Icon) sind reine `<Button variant="ghost">` ohne onClick-Handler. Es fehlt:
1. Ein Zuweisungs-Dialog (Partner auswaehlen)
2. Die TermsGatePanel-Integration beim Partner-Accept

Der Lead-Create-Dialog funktioniert korrekt, aber der Zuweisungs- und Accept-Flow fehlt noch komplett auf Zone-1-Seite.

---

## WAS FUNKTIONIERT

| Komponente | Status | Details |
|------------|--------|---------|
| agreement_templates (5 Stueck) | OK | Alle 5 Templates aktiv in DB, Platzhalter korrekt |
| commissions Spalten | OK | Alle neuen Spalten vorhanden (commission_type, liable_user_id, liable_role, gross_commission, platform_share_pct DEFAULT 30, platform_fee, reference_id, reference_type, contract_document_id) |
| pipeline_id nullable | OK | Korrekt auf nullable gesetzt |
| outboundBrands.ts | OK | Domains aktualisiert (adkaufy.app, adacquiary.com, futureroom.com), Umlaut-Normalisierung implementiert |
| TermsGatePanel.tsx | OK | Saubere Komponente, laedt Template, zeigt Vorschau, Checkbox blockiert Button |
| contractGenerator.ts | OK | Template-Laden, Platzhalter-Ersetzung, Fehlerbehandlung |
| AcceptMandateDialog | OK | Korrekt integriert mit TermsGatePanel, 0.5% Calc, liable=finance_manager |
| PartnerReleaseDialog | OK | Slider bleibt (3-15%), 30%-Regel statt 2.000 EUR fix, liable=owner |
| CommissionApproval (Zone 1) | OK | Zeigt Typ, Zahlungspflichtiger, Brutto, Plattform(30%), Status |
| NetworkTab (MOD-09) | OK | 30%-Berechnung, Brutto/Plattform/Netto Spalten |
| VertraegeTab (MOD-01) | OK | Zeigt commission_type + Brutto/Plattform-Betraege |
| sot-finance-manager-notify | OK | Sendet via sot-system-mail-send, mandate_accepted + contract_available Typen |
| LeadPool Create-Dialog | OK | Felder korrekt, source='manual', zone1_pool=true |
| user_consents INSERT RLS | OK | Policy erlaubt self-insert (user_id = auth.uid()) |

---

## Implementierungsplan fuer Fixes

### Schritt 1: DB-Migration (K1 + K2 + K3)
- RLS-Policy fuer commissions INSERT (Member oder liable_user)
- RLS-Policy fuer documents INSERT (CONTRACT doc_type, eigener Upload, Member)
- Storage-Bucket "documents" erstellen mit passenden Policies

### Schritt 2: Akquise-Gate Fixes (M1 + M2)
- `AkquiseManagerPage.tsx` Zeile 343: partner_name durch useAuth().profile.display_name ersetzen
- TermsGatePanel.tsx: Wenn grossCommission === 0, Zusammenfassung anpassen ("Verguetung wird bei Abschluss extern geregelt")

### Schritt 3: Mail-Absender Fix (M3)
- `sot-system-mail-send` um optionalen `from_override` Parameter erweitern
- Wenn vorhanden: Desk-Absender verwenden statt User-Identity

### Schritt 4: Lead Pool Zuweisungs-Flow (M4)
- UserPlus-Button mit Zuweisungs-Dialog verknuepfen
- Partner-Auswahl (Organizations mit sales_partner Rolle)
- Nach Zuweisung: lead_assignments INSERT mit status='offered'

