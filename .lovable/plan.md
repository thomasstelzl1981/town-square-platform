

# Kaufy-Showcase: Bis zu 5 ausgewaehlte Einheiten pro Projekt

## Status: Implementiert

### Aenderungen

1. **DB-Migration**: `kaufy_showcase boolean DEFAULT false` auf `dev_project_units`
2. **KaufyShowcaseDialog.tsx**: Neuer Dialog mit Unit-Liste, Checkbox-Auswahl (1–5), Auto-Vorschlag (Quintil-Algorithmus)
3. **SalesApprovalSection.tsx**: Kaufy-Toggle oeffnet Dialog statt Direkt-Publish. Deaktivierung loescht alle Kaufy-Publikationen + resettet Showcase-Flags.

### Regeln
- Minimum: 1 Einheit, Maximum: 5 Einheiten
- Auto-Vorschlag waehlt Einheiten mit maximaler Preis-Streuung
- Bereits als Showcase markierte Einheiten werden beim erneuten Oeffnen vorausgewaehlt
- Landing Page bleibt davon unberuehrt (alle Einheiten)
