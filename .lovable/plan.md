

# Sicherheits-Aktionsplan: 3 Kritische Punkte

---

## Prioritat 1 (P1): Webhook-Signatur-Validierung

**Problem:** Die Edge Function `sot-renovation-inbound-webhook` hat einen `TODO: Verify webhook signature` -- eingehende Webhooks werden ohne Authentizitaetspruefung akzeptiert. Ein Angreifer koennte gefaelschte Webhook-Payloads senden.

**Loesung:**
- Die Shared-Utility `supabase/functions/_shared/webhook-validation.ts` existiert bereits mit HMAC-SHA256-Verifikation
- In `sot-renovation-inbound-webhook/index.ts` die vorhandene `verifyRequestSignature()` importieren und aktivieren
- Das auskommentierte Signature-Checking einschalten und bei ungueltigem Signature mit HTTP 401 abbrechen

**Aufwand:** Klein (ca. 10 Zeilen Code-Aenderung in 1 Datei)

**Risiko ohne Fix:** Mittel -- Angreifer koennte falsche Renovation-Daten einschleusen

---

## Prioritat 2 (P1): OAuth-Tokens in `mail_accounts`

**Problem:** `access_token` und `refresh_token` werden als Klartext in der Tabelle `mail_accounts` gespeichert. 6 Edge Functions lesen diese Tokens per `select('*')`.

**Betroffene Functions:**
- `sot-mail-sync` (liest + schreibt Tokens)
- `sot-mail-send` (liest Tokens)
- `sot-mail-connect` (schreibt Tokens)
- `sot-mail-gmail-auth` (schreibt Tokens)
- `sot-calendar-sync` (liest Tokens)
- `sot-contacts-sync` (liest Tokens)
- `_shared/userMailSend.ts` (liest Tokens)

**Loesung (2 Stufen):**

*Stufe A -- Sofort (RLS-Haertung):*
- RLS-Policies auf `mail_accounts` pruefen: Sicherstellen, dass nur der eigene Tenant + eigener User Zugriff hat
- `select('*')` durch explizite Spaltenauswahl ersetzen (nur die benoetigten Felder)
- Tokens niemals in API-Responses an den Client zurueckgeben

*Stufe B -- Spaeter (Verschluesselung):*
- Supabase Vault (`pgsodium`) fuer symmetrische Verschluesselung der Token-Spalten nutzen
- Erfordert DB-Migration: Spalten zu `bytea` aendern + Encrypt/Decrypt-Wrapper-Functions
- Alle 6 Edge Functions muessen angepasst werden
- **Empfehlung:** Stufe B erst nach Beta-Launch, da komplex und fehleranfaellig

**Aufwand:** Stufe A = Mittel (1-2 Stunden), Stufe B = Hoch (1-2 Tage)

**Risiko ohne Fix:** Bei funktionierenden RLS-Policies ist das Risiko begrenzt -- ein Angreifer braeuchte DB-Zugang. Trotzdem Best Practice, Tokens zu verschluesseln.

---

## Prioritat 3 (P2): Ungeschuetzte console.logs

**Problem:** `useDemoSeedEngine.ts` und `useDemoCleanup.ts` enthalten ~30 `console.log()`-Aufrufe OHNE `import.meta.env.DEV`-Guard. Diese erscheinen in Production.

**Alle anderen Dateien** (AuthContext, EmailTab, Armstrong-Hooks, etc.) sind korrekt mit `if (import.meta.env.DEV)` geschuetzt -- kein Handlungsbedarf dort.

**Loesung:**
- Alle `console.log()` in `useDemoSeedEngine.ts` und `useDemoCleanup.ts` mit `if (import.meta.env.DEV)` wrappen
- Alternativ: Eine Helper-Function `devLog()` erstellen und ueberall nutzen

**Aufwand:** Klein (mechanische Aenderung, ~30 Stellen in 2 Dateien)

**Risiko ohne Fix:** Niedrig -- Die Logs enthalten Demo-Seed-Informationen (Tabellennamen, Anzahl geseedeter Datensaetze). Kein sensitiver Daten-Leak, aber unprofessionell in Production.

---

## Zusammenfassung

| # | Thema | Prioritaet | Aufwand | Empfehlung |
|---|-------|-----------|---------|------------|
| 1 | Webhook-Signatur | P1 | Klein | Sofort fixen |
| 2a | OAuth-Tokens (RLS + select) | P1 | Mittel | Sofort fixen |
| 2b | OAuth-Tokens (Vault-Verschluesselung) | P2 | Hoch | Nach Beta |
| 3 | Console.logs | P2 | Klein | Sofort fixen |

**Empfohlene Reihenfolge:** 1 → 2a → 3 (alles in einer Session machbar, ca. 2-3 Stunden)

---

## Technische Details

### Punkt 1: Webhook-Fix
Datei: `supabase/functions/sot-renovation-inbound-webhook/index.ts`
- Import: `import { verifyRequestSignature } from '../_shared/webhook-validation.ts'`
- Vor der Payload-Verarbeitung: Signature pruefen, bei Fehler 401 zurueckgeben

### Punkt 2a: RLS + Select-Haertung
- RLS-Policy pruefen (DB-Query)
- In allen 6 Edge Functions: `select('*')` durch explizite Feldliste ersetzen
- Sicherstellen, dass Token-Felder nie in Client-Responses landen

### Punkt 3: Console.log-Guard
Dateien: `src/hooks/useDemoSeedEngine.ts`, `src/hooks/useDemoCleanup.ts`
- Jedes `console.log()` mit `if (import.meta.env.DEV)` wrappen

