

# Kontaktanreicherung Live-Schaltung + 20 Credits/Monat Flatrate

## Ausgangslage

Die Edge Function `sot-contact-enrichment` existiert und funktioniert technisch (Gemini-basierte Signatur-Extraktion). Die Toggles in Zone 2 (KontakteTab) und Zone 1 (AdminKiOfficeKontakte) schreiben korrekt in `tenant_extraction_settings`. **Aber**: Die Funktion wird nirgends aufgerufen — die Inbound-Pipeline (`sot-inbound-receive`) verarbeitet nur PDFs, ruft aber nie die Kontaktanreicherung auf.

**Credit-System vorhanden**: `credit_ledger` Tabelle + `rpc_credit_preflight` / `rpc_credit_deduct` / `rpc_credit_topup` RPCs + `sot-credit-preflight` Edge Function existieren bereits.

**Kein dedizierter Billing-Table**: Es gibt `armstrong_billing_events` (fuer Armstrong-Aktionen) und `credit_ledger` (allgemeines Credit-Konto). Fuer die monatliche Flatrate brauchen wir eine neue Tabelle `tenant_subscriptions` zur Verwaltung wiederkehrender Credit-Pakete.

---

## Aenderungen

### 1. Neue DB-Tabelle: `tenant_subscriptions`

Fuer die 20 Credits/Monat Flatrate fuer Kontaktanreicherung (und spaeter weitere Dienste).

```text
tenant_subscriptions
  id            UUID PK
  tenant_id     UUID FK -> organizations
  service_code  TEXT (z.B. 'contact_enrichment')
  credits_per_month INTEGER (20)
  price_cents   INTEGER (500 = 5.00 EUR)
  is_active     BOOLEAN DEFAULT false
  activated_at  TIMESTAMPTZ
  next_billing  TIMESTAMPTZ
  created_at    TIMESTAMPTZ
```

RLS: Tenant kann eigene Subscriptions lesen und aktivieren/deaktivieren.

### 2. Edge Function: `sot-contact-enrichment` erweitern

Aktuell prueft die Funktion nur `tenant_extraction_settings`. Neue Logik:

1. Pruefen ob `tenant_subscriptions` mit `service_code = 'contact_enrichment'` und `is_active = true` existiert
2. Pruefen ob noch Credits im monatlichen Budget (20) verfuegbar sind (via `credit_ledger` zaehlen fuer aktuellen Monat)
3. Falls ja: Anreicherung ausfuehren, 1 Credit per `rpc_credit_deduct` abziehen
4. Falls Monatsbudget erschoepft: Skip mit Hinweis

### 3. Edge Function: `sot-inbound-receive` — Trigger einbauen

Nach der PDF-Verarbeitung (Zeile ~516) wird ein Aufruf an `sot-contact-enrichment` eingefuegt:

```text
Nach: "Inbound email processed"
Neu:  Wenn auto_enrich_contacts_email aktiv ist →
      supabase.functions.invoke('sot-contact-enrichment', { body: { source: 'email', tenant_id, data: { email, from_name, body_text } } })
```

Dies verbindet die bestehende Pipeline mit der bestehenden Enrichment-Funktion.

### 4. Zone 2 UI: Toggle verschieben

**Entfernen aus**: `KontakteTab.tsx` — Die Auto-Enrich Switches (Zeilen ~630-660) werden dort entfernt.

**Hinzufuegen in**: Armstrong Intelligence Bereich. Wo genau dieser Bereich liegt, muss geprueft werden — laut Anfrage gibt es eine "zweite Reihe" mit nur 2 schmalen Kacheln, wo eine dritte Kachel "E-Mail-Anreicherung" hinzugefuegt werden soll. Dies betrifft wahrscheinlich die Armstrong-Konfiguration oder das Dashboard in Zone 2.

Die neue Kachel enthaelt:
- Titel: "E-Mail-Anreicherung"
- Icon: Users/Mail
- Toggle: Aktivieren/Deaktivieren (schreibt in `tenant_subscriptions`)
- Status-Anzeige: "X von 20 Credits diesen Monat verbraucht"
- Preis-Hinweis: "20 Credits/Monat (5,00 EUR)"

### 5. Website: SotIntelligenz.tsx — Kachel hinzufuegen

In der Magic Intake Sektion (Zeile 190-201) gibt es aktuell nur 3 Kacheln in `sm:grid-cols-3`. Laut Anfrage soll in einer anderen Reihe — der Posteingangs-Pipeline Sektion — die E-Mail-Anreicherung als dritte Funktion ergaenzt werden.

Alternativ wird in der `creditCategories` Liste (Zeile 39-45) ein neuer Eintrag hinzugefuegt:

```text
{ name: 'E-Mail-Anreicherung', price: '20 Credits/Monat', desc: 'Kontaktdaten aus E-Mail-Signaturen automatisch extrahieren und im Kontaktbuch ergaenzen' }
```

### 6. Website: SotPreise.tsx — Aktualisieren

Kontaktanreicherung mit dem konkreten Preis (20 Credits/Monat) erwaehnen.

---

## Technische Uebersicht

| Datei | Aenderung |
|-------|-----------|
| DB Migration | Neue Tabelle `tenant_subscriptions` + RLS |
| `supabase/functions/sot-contact-enrichment/index.ts` | Subscription-Check und Credit-Deduct hinzufuegen |
| `supabase/functions/sot-inbound-receive/index.ts` | Enrichment-Trigger nach E-Mail-Verarbeitung |
| `src/pages/portal/office/KontakteTab.tsx` | Auto-Enrich Switches entfernen |
| Armstrong Intelligence UI (Zone 2) | Neue Kachel "E-Mail-Anreicherung" mit Toggle + Verbrauchsanzeige |
| `src/pages/zone3/sot/SotIntelligenz.tsx` | Kachel/Eintrag fuer E-Mail-Anreicherung |
| `src/pages/zone3/sot/SotPreise.tsx` | Preis-Update |

---

## Umsetzungsreihenfolge

1. DB Migration: `tenant_subscriptions` Tabelle
2. `sot-contact-enrichment`: Subscription + Credit-Logik
3. `sot-inbound-receive`: Trigger einbauen
4. Zone 2 UI: Toggle aus KontakteTab entfernen, neue Kachel in Armstrong Intelligence
5. Website: SotIntelligenz + SotPreise Updates

