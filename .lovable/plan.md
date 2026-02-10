
# Tiefenpruefung: Zweite Runde — Ergebnisse

## Status-Uebersicht

| Pruefpunkt | Status | Details |
|------------|--------|---------|
| DB: commissions Spalten | OK | Alle 10 neuen Spalten vorhanden, pipeline_id nullable |
| DB: agreement_templates (5x) | OK | Alle 5 aktiv, Version 1 |
| DB: RLS commissions INSERT | OK | `com_insert_via_terms_gate` aktiv (liable_user_id = auth.uid() OR membership) |
| DB: RLS documents INSERT | OK | `docs_insert_contract_member` aktiv (doc_type = 'CONTRACT') |
| DB: Storage Bucket "documents" | OK | Bucket existiert, nicht public |
| DB: Storage Policies | OK | `docs_storage_insert_authenticated` + `docs_storage_select_authenticated` vorhanden |
| DB: user_consents RLS | OK | `consent_insert_self` erlaubt self-insert |
| Config: outboundBrands.ts | OK | Domains korrekt, Umlaut-Normalisierung vorhanden |
| UI: TermsGatePanel | OK | Template laden, Vorschau, Checkbox, Accept-Flow |
| UI: AcceptMandateDialog | OK | TermsGatePanel korrekt integriert |
| UI: PartnerReleaseDialog | OK | Slider + TermsGatePanel korrekt |
| UI: AkquiseManagerPage Gate | OK | partner_name nutzt display_name (Fix M1 implementiert) |
| UI: LeadPool Create-Dialog | OK | source='manual', zone1_pool=true |
| UI: LeadPool Assign-Dialog | OK | UserPlus-Button verknuepft mit openAssignDialog() |
| UI: CommissionApproval | OK | Zeigt Typ, Zahlungspflichtiger, Brutto, Plattform(30%) |
| UI: NetworkTab | OK | Brutto/Plattform(30%)/Netto Spalten |
| UI: VertraegeTab | OK | commission_type + Brutto/Plattform in Beschreibung |
| Edge: sot-system-mail-send | OK | from_override Parameter implementiert und genutzt |
| Edge: sot-finance-manager-notify | OK | Sendet via sot-system-mail-send |

---

## VERBLEIBENDE PROBLEME (2 Stueck)

### P1: doc_type Case-Mismatch (MITTEL)

**Problem:** Die RLS-Policy `docs_insert_contract_member` prueft auf `doc_type = 'CONTRACT'` (Grossbuchstaben). Der Code in `contractGenerator.ts` (Zeile 142) setzt ebenfalls `doc_type: 'CONTRACT'`. Das stimmt ueberein — ABER: alle bestehenden doc_type-Werte in der DB sind snake_case/lowercase (`insurance_policy`, `lease_contract`, `purchase_contract` etc.).

Das ist kein Blocker — der INSERT funktioniert technisch. Es ist aber eine Inkonsistenz in der Namenskonvention. Alle anderen doc_types sind lowercase, nur CONTRACT ist uppercase.

**Empfehlung:** `doc_type` auf `contract` (lowercase) aendern — sowohl im Code als auch in der RLS-Policy. Oder so lassen, da es funktioniert.

### P2: sot-finance-manager-notify Auth-Kontext (MITTEL)

**Problem:** `sot-finance-manager-notify` ruft `sot-system-mail-send` mit dem Service-Role-Key als Authorization-Header auf (Zeile 118):
```
'Authorization': `Bearer ${supabaseServiceKey}`,
```

`sot-system-mail-send` versucht dann (Zeile 39-46):
```
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
const userClient = createClient(SUPABASE_URL, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user }, error: authError } = await userClient.auth.getUser();
```

Der Service-Role-Key kann nicht als normaler User aufgeloest werden — `auth.getUser()` koennte scheitern oder einen Service-Kontext zurueckgeben. Das haengt davon ab, wie Supabase den Service-Role JWT behandelt.

**Risiko:** E-Mails aus `sot-finance-manager-notify` koennten nicht ankommen, wenn der Auth-Check fehlschlaegt. Der Fallback in Zeilen 139-152 loggt dann nur den Inhalt.

**Empfehlung:** In `sot-system-mail-send` einen Bypass fuer Service-Role-Aufrufe einbauen — z.B. den `SUPABASE_SERVICE_ROLE_KEY` direkt pruefen, bevor `auth.getUser()` aufgerufen wird.

---

## ZUSAMMENFASSUNG

Die Implementierung ist zu **95% produktionsbereit**. Alle kritischen Blocker (K1-K3 aus der vorherigen Pruefung) wurden korrekt behoben:

- RLS fuer commissions INSERT: Policy aktiv
- RLS fuer documents INSERT: Policy aktiv
- Storage Bucket "documents": Existiert mit Policies
- Alle 5 Agreement Templates: Aktiv in DB
- Alle 10 neuen Spalten: Vorhanden
- Alle 4 Gate-Dialoge: Korrekt integriert
- Lead Pool: Create + Assign Dialoge funktional
- E-Mail: from_override implementiert

Die zwei verbleibenden Punkte (P1 doc_type Case, P2 Service-Role Auth) sind mittlere Probleme, die den Hauptflow nicht blockieren, aber fuer Produktionsreife behoben werden sollten.

### Empfohlene Aktion

1. **P1 fixen:** `doc_type: 'CONTRACT'` zu `doc_type: 'contract'` aendern (contractGenerator.ts Zeile 142) und RLS-Policy `docs_insert_contract_member` anpassen
2. **P2 fixen:** Service-Role-Bypass in `sot-system-mail-send` einbauen, damit Edge-to-Edge-Aufrufe funktionieren
