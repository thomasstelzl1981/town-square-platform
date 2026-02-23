

# MOD-12 Unfreeze: UI/UX Audit und Fixes

## Befunde aus der Code-Analyse

### 1. Bestandsmodell: Einnahmen/Ausgaben-Gegenuberstellung FEHLT

Die `BestandCalculation.tsx` zeigt aktuell:
- Finanzierungsparameter (Slider)
- Finanzierungsubersicht (EK, Darlehen, Annuitat)
- Tilgungsplan-Chart (30 Jahre)
- Vermogensentwicklung-Chart
- Summary-Cards (Finanzierung + Vermogen)

**Was fehlt:** Eine klare monatliche/jahrliche Gegenuberstellung von Einnahmen vs. Ausgaben:

```text
EINNAHMEN                    AUSGABEN
──────────────────          ──────────────────
Kaltmiete:    2.000 EUR/M   Zins:         1.167 EUR/M
                             Tilgung:        667 EUR/M
                             Verwaltung:     417 EUR/M
                             Instandhaltung: 250 EUR/M
──────────────────          ──────────────────
Summe:        2.000 EUR/M   Summe:        2.500 EUR/M

CASHFLOW:    -500 EUR/M (NEGATIV)
```

Diese Gegenuberstellung ist das Kernstuck jeder Bestandskalkulation und muss prominent zwischen den Finanzierungsparametern und den Charts platziert werden.

### 2. Preisvorschlag-Dialog: E-Mail wird NICHT gesendet

**Kritischer Bug in `PreisvorschlagDialog.tsx`:**

Die `sendProposal`-Mutation (Zeile 102-143) macht Folgendes:
- Setzt Offer-Status auf `analyzing` (korrekt)
- Loggt eine Activity (korrekt)
- Zeigt Toast "Preisvorschlag gesendet" (irrefuhrend)

**Was NICHT passiert:**
- Die generierte E-Mail (`generatedEmail`) wird **niemals versendet**
- Es gibt **keinen Aufruf** von `sot-acq-outbound` oder `sot-mail-send`
- Der Text wird generiert, angezeigt, und dann verworfen

Das bedeutet: Der User klickt "Vorschlag senden", bekommt eine Erfolgsmeldung, aber es passiert nichts.

### 3. PreisvorschlagDialog nutzt price_counter NICHT

Der Dialog initialisiert den Vorschlagspreis mit `currentPrice * 0.9` (Zeile 54-56), ignoriert aber den bereits gesetzten `price_counter` aus der Schnellanalyse. Wenn der User in der Schnellanalyse einen Gegenvorschlag eingibt und speichert, muss dieser im Dialog vorausgefullt sein.

### 4. E-Mail-Versand: Architektur-Lucke

`sot-acq-outbound` ist Template-basiert (nutzt `acq_email_templates`) und erwartet einen `templateCode`. Der PreisvorschlagDialog generiert aber Freitext uber KI. Es gibt keine Brucke zwischen dem generierten E-Mail-Text und dem Outbound-System.

**Loesung:** Der Dialog muss die generierte E-Mail direkt uber `sot-acq-outbound` oder `sot-mail-send` (via User-Account) senden, nicht uber Templates.

---

## Umsetzungsplan

### Fix 1: Einnahmen/Ausgaben-Karte im Bestandsmodell

**Datei:** `src/pages/portal/akquise-manager/components/BestandCalculation.tsx`

Neue Sektion zwischen Finanzierungsparametern und Tilgungsplan:

```text
┌──────────────────────────────────────────────────┐
│  Monatliche Wirtschaftlichkeit                   │
│                                                  │
│  EINNAHMEN            │  AUSGABEN                │
│  ─────────────        │  ─────────────           │
│  Kaltmiete  2.000 EUR │  Zinsen      1.167 EUR   │
│                       │  Tilgung       667 EUR   │
│                       │  Verwaltung    417 EUR   │
│                       │  Instandh.     250 EUR   │
│  ─────────────        │  ─────────────           │
│  Gesamt     2.000 EUR │  Gesamt      2.500 EUR   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  CASHFLOW: -500 EUR/Monat  (NEGATIV)     │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Jahrlich: -6.000 EUR  │  Cash-on-Cash: -3,0%   │
└──────────────────────────────────────────────────┘
```

Alle Werte werden aus dem bestehenden `calcBestandFull`-Ergebnis abgeleitet (keine Engine-Anderung noetig):
- Einnahmen: `monthlyRent` (bereits als Parameter vorhanden)
- Zinsen: `yearlyData[0].interest / 12`
- Tilgung: `yearlyData[0].repayment / 12`
- Verwaltung: `monthlyRent * managementCostPercent / 100`
- Instandhaltung: `purchasePrice * maintenancePercent / 100 / 12`

### Fix 2: PreisvorschlagDialog -- E-Mail tatsachlich senden

**Datei:** `src/pages/portal/akquise-manager/components/PreisvorschlagDialog.tsx`

Die `sendProposal`-Mutation wird erweitert:

1. `price_counter` in `acq_offers` speichern (nicht nur Status-Update)
2. Generierte E-Mail uber `sot-acq-outbound` senden ODER direkt uber `supabase.functions.invoke('sot-mail-send')` wenn User einen Mail-Account hat
3. Fallback auf Activity-Log wenn kein Mail-Account vorhanden

Aenderungen:
- `sendProposal` ruft nach dem Status-Update `sot-acq-outbound` auf mit dem generierten E-Mail-Text
- Der Dialog wird erst geschlossen wenn die E-Mail erfolgreich versendet wurde
- Bei Fehler: klare Fehlermeldung statt falscher Erfolgsmeldung

### Fix 3: price_counter im Dialog vorausfullen

**Datei:** `src/pages/portal/akquise-manager/components/PreisvorschlagDialog.tsx`

- Neue Prop `priceCounter?: number` vom Parent (`ObjekteingangDetail.tsx`) durchreichen
- Initialisierung: `priceCounter ?? currentPrice * 0.9`
- Parent ubergibt `priceOverride` wenn dieser vom `price_asking` abweicht

### Fix 4: Preisfeld in der Schnellanalyse prominenter gestalten

**Datei:** `src/pages/portal/akquise-manager/ObjekteingangDetail.tsx` (QuickAnalysisBanner)

Aktuell ist das Preisfeld ein dezenter `border-b-2 input` (Zeile 474-483). Verbesserungen:
- Hoehere Schriftgroesse und deutlicheres Input-Styling
- "Ihren Preis eingeben"-Placeholder statt leeres Feld
- Farbiger Rahmen (Cyan-Glow, passend zum MOD-12 Design)
- Hinweistext unterhalb: "Preis andern fur Echtzeit-Kalkulation"

---

## Technische Details

### Engine: Keine Anderung noetig

Die `calcBestandFull`-Funktion liefert bereits alle Werte. Die Einnahmen/Ausgaben-Ansicht ist eine reine UI-Erganzung, die vorhandene Daten neu darstellt:

- `yearlyData[0].interest` = Jahreszinsen Jahr 1
- `yearlyData[0].repayment` = Tilgung Jahr 1
- `params.monthlyRent * 12` = Jahresmiete
- `params.managementCostPercent` = Verwaltungskosten-Anteil
- `params.maintenancePercent` = Instandhaltungskosten-Anteil

### E-Mail-Architektur

Der aktuelle `sot-acq-outbound` nutzt Templates. Fuer den Preisvorschlag-Dialog wird stattdessen die `sendViaUserAccountOrResend`-Funktion aus `_shared/userMailSend.ts` direkt genutzt, da der E-Mail-Text bereits KI-generiert ist. Ablauf:

1. User gibt Preisvorschlag ein und wahlt Unterlagen
2. KI generiert E-Mail-Text (bereits implementiert)
3. User pruft und editiert (bereits implementiert)
4. "Senden" ruft `sot-acq-outbound` mit custom body auf (NEU)
5. E-Mail geht uber Users Gmail-Account oder Resend-Fallback raus
6. Outbound-Record wird in `acq_outbound_messages` geloggt

### Dateien die geandert werden (alle MOD-12)

| Datei | Anderung |
|-------|----------|
| `BestandCalculation.tsx` | Neue Einnahmen/Ausgaben-Sektion einfugen |
| `PreisvorschlagDialog.tsx` | E-Mail-Versand implementieren, price_counter Prop |
| `ObjekteingangDetail.tsx` | price_counter an Dialog durchreichen, Preisfeld-Styling |
| `sot-acq-outbound/index.ts` | Optionalen Freitext-Modus ergaenzen (neben Template-Modus) |

### Aufteiler-Tool: Kein Fix noetig

Das Aufteiler-Tool (`AufteilerCalculation.tsx`) hat bereits eine saubere Kosten/Erloese-Gegenuberstellung:
- Kosten-Card: Kaufpreis + Nebenkosten + Projektkosten + Zinskosten - Mieteinnahmen = Gesamtkosten netto
- Erloese-Card: Verkaufspreis - Provision = Netto-Erloes
- Ergebnis-Card: Gewinn, Marge, ROI

Dies ist korrekt und vollstandig implementiert.

