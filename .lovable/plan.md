
## Befund

Das gesamte **"Armstrong Depot"** (Zeilen 746-793 in `InvestmentTab.tsx`) basiert auf hartcodierten Demo-Daten in `src/hooks/useDemoDepot.ts` — Arrays mit fiktiven ETF-Positionen, Transaktionen, Steuerreport und Performance-Daten, die zusammen die 29.431 € ergeben. 

Dies ist ein klarer **DEMO DATA VIOLATION**: Hardcodierte Mock-Daten in Hook/Component-Dateien statt über die Seed-Engine.

### Betroffene Dateien

| Datei | Rolle |
|-------|-------|
| `src/hooks/useDemoDepot.ts` | SSOT der hartcodierten Daten (DEMO_POSITIONS, DEMO_TRANSACTIONS, etc.) |
| `src/components/finanzanalyse/depot/DepotPortfolio.tsx` | Zeigt Pie-Chart mit DEMO_POSITIONS |
| `src/components/finanzanalyse/depot/DepotPositionen.tsx` | Tabelle mit DEMO_POSITIONS |
| `src/components/finanzanalyse/depot/DepotPerformanceChart.tsx` | Chart mit generatePerformanceData() |
| `src/components/finanzanalyse/depot/DepotTransaktionen.tsx` | Tabelle mit DEMO_TRANSACTIONS |
| `src/components/finanzanalyse/depot/DepotSteuerReport.tsx` | Steuer-Report mit DEMO_TAX_REPORT |
| `src/components/finanzanalyse/depot/DepotOnboardingWizard.tsx` | Fake Onboarding-Wizard |
| `src/pages/portal/finanzanalyse/InvestmentTab.tsx` | Rendert das gesamte Armstrong-Depot-Section (Z. 746-793) |

### Empfohlene Aktion: Komplett entfernen

Das "Armstrong Depot" ist ein Platzhalter für eine zukuenftige Upvest-Integration, die noch nicht existiert. Es zeigt **jedem** Nutzer fake Depot-Daten an (29.431 €), die nichts mit seinen echten Finanzen zu tun haben. 

**Aenderungen:**

1. **`InvestmentTab.tsx`**: Gesamten "Armstrong Depot"-Block (Z. 746-793) entfernen, inkl. `useDemoDepot`-Import und alle Referenzen auf `status`, `setStatus`, `resetDepot`, `totalValue`, `dailyChange`
2. **Person-Kacheln**: Die `totalValue`-Anzeige (Z. 507) und die localStorage-basierte "Depot aktiv"-Logik (Z. 468-469) entfernen — diese stammen ebenfalls aus dem Demo-Hook
3. **6 Depot-Komponenten loeschen**: Alle Dateien in `src/components/finanzanalyse/depot/` — sie haben keine andere Verwendung
4. **`src/hooks/useDemoDepot.ts` loeschen** — wird nirgendwo sonst verwendet
5. **Person-Kacheln behalten**: Die Personen-Auswahl oben und die FinAPI-Depot/Sparplan-Logik bleiben vollstaendig erhalten — das ist die echte Funktionalitaet
