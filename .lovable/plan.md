

# Umsetzungsplan: Wave 2 Tranche 1 (R-7 bis R-10)

4 Dateien mit insgesamt **5.047 Zeilen** → **~760 Zeilen** in Orchestratoren (85% Reduktion).

**Unfreeze:** MOD-02, MOD-04 — nach Abschluss sofort re-freeze.

---

## R-7: EmailTab.tsx (1506 Z → ~180 Z, MOD-02)

**Pfad:** `src/pages/portal/office/EmailTab.tsx`
**Neue Dateien in `src/components/office/email/`:**

| # | Datei | Inhalt | Zeilen ca. |
|---|-------|--------|-----------|
| 1 | `emailTypes.ts` | `EmailAccount`, `EmailFolder`, `EmailThread`, `folders[]` Konstante | 40 |
| 2 | `useEmailQueries.ts` | Alle useQuery/useMutation Hooks (accounts, messages, search, sync, delete, archive, star, markRead) | 250 |
| 3 | `emailHelpers.ts` | `buildThreads()`, Datum-Formatierung, `groupByThread()` | 60 |
| 4 | `EmailAccountSidebar.tsx` | Konto-Auswahl + Ordner-Navigation + Sync-Button + Konto-verbinden | 120 |
| 5 | `EmailThreadList.tsx` | Thread-Liste mit Suche, Filter-Toggles (unread/starred/attachments), Load-More | 200 |
| 6 | `ThreadDetailPanel.tsx` | Bestehende `ThreadDetailPanel` + `SingleEmailDetail` Inline-Komponenten extrahieren | 280 |
| 7 | `EmailEmptyStates.tsx` | Kein Konto, kein Thread ausgewählt, keine Ergebnisse | 40 |

**Hinweis:** `ComposeEmailDialog` existiert bereits in `src/components/portal/office/` — wird weiter von dort importiert, kein Duplikat.

**Orchestrator behält:** State-Variablen, Handler-Delegation, 3-Spalten-Grid-Layout.

---

## R-8: PortfolioTab.tsx (1511 Z → ~200 Z, MOD-04)

**Pfad:** `src/pages/portal/immobilien/PortfolioTab.tsx`
**Neue Dateien in `src/components/immobilien/portfolio/`:**

| # | Datei | Inhalt | Zeilen ca. |
|---|-------|--------|-----------|
| 1 | `portfolioTypes.ts` | `LandlordContext`, `PropertyRow`, `PortfolioStats`, Filter-Interfaces | 60 |
| 2 | `portfolioHelpers.ts` | Aggregations-Logik, Steuerberechnung-Wrapper, Sortier-Callbacks | 80 |
| 3 | `PortfolioKPIGrid.tsx` | StatCards (Marktwert, Mietertrag, Rendite, Leerstand) + Charts | 150 |
| 4 | `PortfolioPropertyTable.tsx` | PropertyTable mit allen Spalten, Inline-Editing, Context-Zuweisung | 250 |
| 5 | `PortfolioToolbar.tsx` | Context-Filter, Such-Input, Ansichts-Toggle, Import/Export/Neu Buttons | 100 |
| 6 | `PortfolioCharts.tsx` | ComposedChart (Mietentwicklung), Steuer-Charts | 120 |
| 7 | `PortfolioDialogs.tsx` | Delete-AlertDialog, ExcelImportDialog-Wrapper, CreatePropertyDialog-Wrapper, PortfolioSummaryModal-Wrapper | 80 |
| 8 | `usePortfolioData.ts` | useQuery für Kontexte + Properties + Aggregation | 120 |

**Orchestrator behält:** State, aktiver Kontext, PageShell + ModulePageHeader + WidgetGrid Layout.

---

## R-9: BriefTab.tsx (1012 Z → ~180 Z, MOD-02)

**Pfad:** `src/pages/portal/office/BriefTab.tsx`
**Neue Dateien in `src/components/office/brief/`:**

| # | Datei | Inhalt | Zeilen ca. |
|---|-------|--------|-----------|
| 1 | `briefTypes.ts` | `Contact`, `BriefDraft`, `LetterFont`, Channel-Type | 30 |
| 2 | `briefHelpers.ts` | `getEffectiveRecipient()`, Adressblock-Formatierung | 40 |
| 3 | `BriefRecipientCard.tsx` | Kontakt-Suche (Combobox), Manuelle Eingabe, Absender-Auswahl | 150 |
| 4 | `BriefEditorCard.tsx` | Betreff, Prompt-Textarea, KI-Generierung, Body-Editing, Schriftart | 180 |
| 5 | `BriefDeliveryCard.tsx` | Kanal-Auswahl (E-Mail/Fax/Post), Faxnummer, Senden/Speichern Buttons | 100 |
| 6 | `BriefDraftsList.tsx` | Collapsible mit letzten Entwürfen | 60 |
| 7 | `BriefPdfDialog.tsx` | PDF-Vorschau Dialog + Download | 30 |

**Orchestrator behält:** State, useMutation (generate, save, send), PageShell-Layout.

---

## R-10: GeldeingangTab.tsx (1018 Z → ~200 Z, MOD-04)

**Pfad:** `src/components/portfolio/GeldeingangTab.tsx`
**Neue Dateien in `src/components/portfolio/geldeingang/`:**

| # | Datei | Inhalt | Zeilen ca. |
|---|-------|--------|-----------|
| 1 | `geldeingangTypes.ts` | `Transaction`, `MatchResult`, `ImportRow`, Bankverbindung-Interface | 40 |
| 2 | `geldeingangHelpers.ts` | `eurFormat`, CSV-Parsing, Match-Logik, Datum-Formatierung | 60 |
| 3 | `GeldeingangImport.tsx` | CSV/MT940 Upload + Vorschau-Tabelle + Import-Button | 150 |
| 4 | `GeldeingangTransactionTable.tsx` | Buchungsliste mit Filter, Status-Badges, Zuordnungs-Anzeige | 200 |
| 5 | `GeldeingangMatchDialog.tsx` | Manueller Zuordnungs-Dialog (Mieter ↔ Buchung) | 150 |
| 6 | `GeldeingangStatsRow.tsx` | Soll/Ist-Vergleich, offene Posten, Match-Quote KPIs | 60 |

**Orchestrator behält:** Props, State, useQuery für Transaktionen, Layout-Wrapper. Export-Alias `ZahlungsverkehrTab` bleibt.

---

## Ablauf

1. UNFREEZE MOD-02 + MOD-04
2. R-7 umsetzen (EmailTab — größte Datei)
3. R-9 umsetzen (BriefTab — gleicher Modul, gleiche Session)
4. R-8 umsetzen (PortfolioTab)
5. R-10 umsetzen (GeldeingangTab — gleicher Modul)
6. RE-FREEZE MOD-02 + MOD-04
7. `plan.md` aktualisieren: R-7 bis R-10 als ✅

**Gesamtergebnis:** 33 neue Dateien, 5.047 → ~760 Zeilen in Orchestratoren.

