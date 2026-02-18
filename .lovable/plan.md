

# AbrechnungTab bereinigen und Credit Top-Up integrieren

## Probleme (Ist-Zustand)

| Zeile | Problem |
|---|---|
| 120 | Credits zeigt hartcodiert "Unendlich" — falsch |
| 131 | "Plan upgraden" Button ohne Funktion |
| — | Kein Credit-Saldo aus `tenant_credit_balance` |
| — | Kein "Credits aufladen" Button auf dieser Seite |

## Aenderungen

### `src/pages/portal/stammdaten/AbrechnungTab.tsx`

**1. Credit-Saldo live laden**
Neuer Query auf `tenant_credit_balance` (wie im KostenDashboard), um den echten Credit-Stand anzuzeigen statt "Unendlich".

**2. Hartcodierte "Credits: Unendlich" Kachel ersetzen**
Die dritte KPI-Kachel zeigt den realen Saldo aus der Datenbank. Wenn kein Eintrag existiert: "0 Credits".

**3. "Plan upgraden" Button entfernen**
Der Button hat keine Funktion und wird ersetzt durch den "Credits aufladen" Dialog (`CreditTopUpDialog`).

**4. CreditTopUpDialog integrieren**
Import von `CreditTopUpDialog` und Platzierung im "Kein aktiver Plan" Bereich sowie als zusaetzlicher Button neben dem Armstrong-Banner.

### Ergebnis-Layout

```text
+────────────────────────────────────────+
│  Aktueller Plan                        │
│  Plan-Name | Status | Credit-Saldo    │
│  (live aus tenant_credit_balance)      │
│  [Credits aufladen] Button             │
+────────────────────────────────────────+
│  Rechnungen (Tabelle — bleibt)         │
+────────────────────────────────────────+
│  Armstrong Hub Banner (bleibt)         │
+────────────────────────────────────────+
```

### Technische Details

- Neuer `useQuery` auf `tenant_credit_balance` mit `eq('tenant_id', activeTenantId)`
- Import `CreditTopUpDialog` aus `@/components/armstrong/CreditTopUpDialog`
- Entfernen: hartcodierte "Unendlich" Kachel, funktionsloser "Plan upgraden" Button
- Credit-Saldo-Kachel zeigt `balance_credits` aus der Datenbank

