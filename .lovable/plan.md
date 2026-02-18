

# Stripe-Integration: Erklaerung und Umsetzungsplan

## Was ist "Social Payment" in MOD-14?

MOD-14 ("Communication Pro") hat einen Bereich namens **Social** unter `/portal/communication-pro/social`. Dort koennen Nutzer Social-Media-Posts erstellen, bearbeiten und planen (LinkedIn, Instagram, Facebook).

Der Workflow ist aktuell **manuell**: Post schreiben, Text kopieren, selbst bei LinkedIn/Instagram einfuegen. Es gibt keine direkte API-Anbindung an Social-Media-Plattformen.

**"Social Payment"** ist ein separater, geplanter Flow, der so funktionieren soll:

1. Ein Nutzer erstellt ein **Social Mandate** (= Auftrag fuer eine Social-Media-Kampagne mit Budget)
2. Bevor das Mandat bearbeitet wird, muss der Nutzer **per Stripe Checkout bezahlen**
3. Nach Zahlung wechselt der Status auf "review" und die Kampagne wird bearbeitet

Aktuell sind die Edge Functions dafuer **Stubs** — sie erzeugen eine Fake-Checkout-URL (`checkout.stub.kaufy.dev`), kein echtes Stripe. Die `social_mandates`-Tabelle existiert in der Datenbank, wird aber im UI noch nicht aktiv genutzt.

**Fazit:** Social Payment ist ein Zukunfts-Feature. Es ist NICHT das, was wir jetzt brauchen.

---

## Was wir JETZT brauchen: Credit Top-Up via Stripe

Das primaere Zahlungs-Feature ist: **Nutzer muessen Credits kaufen koennen.** Alles andere (Armstrong-Aktionen, PDF-Extraktion, Fax, Brief, Bank-Sync) verbraucht Credits — aber es gibt keinen Weg, Credits aufzuladen.

### Was bereits existiert (Backend)

| Komponente | Status |
|---|---|
| `tenant_credit_balance` Tabelle | Existiert — Saldo pro Tenant |
| `rpc_credit_preflight()` | Existiert — Pruefen ob genug Credits da sind |
| `rpc_credit_deduct()` | Existiert — Credits abziehen |
| `rpc_credit_topup()` | Existiert — Credits hinzufuegen (aktuell nur manuell/Admin) |
| `sot-credit-preflight` Edge Function | Existiert — hat `topup`-Action, aber ohne Stripe-Anbindung |
| `billingConstants.ts` | Existiert — Preisliste aller Services |

### Was FEHLT

| Komponente | Beschreibung |
|---|---|
| Stripe-Verbindung | API-Key im System hinterlegt |
| Checkout Edge Function | Erzeugt eine Stripe Checkout Session fuer Credit-Pakete |
| Webhook Edge Function | Empfaengt Stripe-Callback nach Zahlung, ruft `rpc_credit_topup` auf |
| Credit-Pakete Definition | Welche Pakete kann man kaufen? (z.B. 50 Cr / 100 Cr / 500 Cr) |
| "Credits aufladen" Button im UI | Auf der Armstrong-Seite oder im KostenDashboard |

---

## Umsetzungsplan

### Schritt 1: Stripe aktivieren

Ueber die Lovable Stripe-Integration wird der API-Key hinterlegt. Das gibt uns Zugang zu den Stripe-Tools (Produkte, Preise, Checkout Sessions).

### Schritt 2: Credit-Pakete als Stripe-Produkte anlegen

| Paket | Credits | Preis (EUR) |
|---|---|---|
| Starter | 50 Credits | 12,50 EUR |
| Standard | 100 Credits | 25,00 EUR |
| Power | 500 Credits | 125,00 EUR |

(Preise basierend auf 1 Credit = 0,25 EUR, kein Rabatt auf groessere Pakete — kann spaeter angepasst werden)

### Schritt 3: Checkout Edge Function

Neue Edge Function `sot-credit-checkout` die:
1. Nutzer authentifiziert
2. Gewaehltes Credit-Paket validiert
3. Stripe Checkout Session erstellt
4. Checkout-URL zurueckgibt

### Schritt 4: Webhook Edge Function

Neue Edge Function `sot-credit-webhook` die:
1. Stripe Webhook-Signatur validiert
2. Bei `checkout.session.completed`: Tenant-ID und Credit-Menge aus Metadata liest
3. `rpc_credit_topup()` aufruft
4. Optional: Beleg in `armstrong_billing_events` loggt

### Schritt 5: UI — "Credits aufladen" Button

Auf der Armstrong-Seite (`/portal/armstrong`) im KostenDashboard:
- Button "Credits aufladen"
- Dialog mit den 3 Paketen zur Auswahl
- Klick oeffnet Stripe Checkout in neuem Tab
- Nach Rueckkehr wird der Saldo automatisch aktualisiert

### Schritt 6: Social Payment Stubs ersetzen (optional, spaeter)

Die bestehenden Stub-Functions (`sot-social-payment-create`, `sot-social-payment-webhook`) koennen spaeter mit echtem Stripe ersetzt werden — das ist ein separater Schritt, der erst relevant wird, wenn Social Mandates im UI aktiv genutzt werden.

---

## Reihenfolge

1. Stripe aktivieren (API-Key)
2. Credit-Pakete in `billingConstants.ts` definieren
3. `sot-credit-checkout` Edge Function erstellen
4. `sot-credit-webhook` Edge Function erstellen
5. UI: "Credits aufladen" Dialog in Armstrong-Seite
6. Testen: End-to-End Flow (Button klicken, Stripe Checkout, Webhook, Saldo-Update)

