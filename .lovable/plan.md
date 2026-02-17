
# AccountsWidget: Echte Demo-Daten statt Hardcoded-Werte

## Ziel

Das AccountsWidget auf dem Dashboard soll die tatsaechlichen Finanzdaten des angemeldeten Tenants anzeigen statt der hartcodierten ING/Trade-Republic-Werte. Wenn der Demo-Kunde aktiv ist, sieht man seine echten Zahlen — und wir koennen sofort pruefen, ob alle Datenquellen korrekt verlinkt sind.

## Verfuegbare Datenquellen (Demo-Tenant)

Aus den bestehenden Supabase-Tabellen koennen folgende Werte aggregiert werden:

| Zeile | Quelle | Aktueller Demo-Wert |
|-------|--------|---------------------|
| Bankguthaben | `applicant_profiles.bank_savings` | 85.000 EUR |
| Wertpapiere/Depot | `applicant_profiles.securities_value` | 120.000 EUR |
| Lebensversicherung | `applicant_profiles.life_insurance_value` | 45.000 EUR |
| Immobilien (Marktwert) | `units -> properties.market_value` (SUM) | 995.000 EUR |
| Verbindlichkeiten Immo | `miety_loans.remaining_balance` | -520.000 EUR |
| Private Kredite | `private_loans.remaining_balance` (SUM) | -27.200 EUR |

Falls `msv_bank_accounts` Eintraege hat, werden diese statt des `applicant_profiles.bank_savings`-Werts angezeigt. Da die Tabelle beim Demo-Tenant leer ist, wird auf `applicant_profiles` zurueckgegriffen.

## Aenderungen

### Datei: `src/components/dashboard/widgets/AccountsWidget.tsx`

1. **Daten per Hook laden statt Hardcode:**
   - `useAuth()` fuer `activeTenantId`
   - `useQuery` fuer `applicant_profiles` (bank_savings, securities_value, life_insurance_value)
   - Die Abfrage nutzt den gleichen Pattern wie `useFinanzberichtData`

2. **Drei Zeilen dynamisch darstellen:**
   - **Bankguthaben** (Landmark-Icon, Sky): `bank_savings` aus applicant_profiles
   - **Depot/Wertpapiere** (Briefcase-Icon, Violet): `securities_value` aus applicant_profiles
   - **Lebensversicherung/Sparen** (PiggyBank-Icon, Emerald): `life_insurance_value` aus applicant_profiles

3. **Demo-Badge Logik:**
   - Badge wird nur angezeigt wenn keine echten `msv_bank_accounts` vorhanden sind (= Fallback auf applicant_profiles)
   - Sobald ein User echte Bankkonten anlegt, verschwindet das Demo-Badge

4. **Loading-State:**
   - Waehrend die Daten laden: Skeleton-Platzhalter in den drei Zeilen
   - Kein Layout-Shift

5. **Gesamt-Summe:**
   - Weiterhin automatisch berechnet aus den drei angezeigten Werten

### Keine weiteren Dateien betroffen

Die Datenabfrage erfolgt direkt im Widget — kein neuer Hook noetig, da es eine einfache Query ist.
