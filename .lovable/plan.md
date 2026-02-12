

# Audit-Abarbeitung: Phasenplan mit Tracking

## Status nach AP-1 bis AP-4 (erledigt)
- Console.log-Bereinigung: erledigt
- PageShell-Migration ShopTab/BestellungenTab: erledigt
- MarketingTab.tsx deprecated: erledigt
- Kaufy Expose-Fallback: erledigt

## Verbleibende Arbeitspakete: 5 Phasen

---

### Phase 5: MOD-08 Dynamic Routes in portalDynamicComponentMap

**Problem:** Die Dynamic Routes (MandatCreateWizard, MandatDetail, InvestmentExposePage) sind im routesManifest definiert, fehlen aber in `portalDynamicComponentMap` (Zeile 323-331 in ManifestRouter.tsx).

**Befund nach Pruefung:** KEIN PROBLEM. MOD-08 handhabt seine Dynamic Routes intern in `InvestmentsPage.tsx` (Zeile 21-28) mit eigenen `<Route>`-Definitionen. Die `portalDynamicComponentMap` wird nur fuer Module genutzt, die das generische ModulePage-Pattern verwenden. MOD-08 hat einen eigenen Router.

**Aktion:** Keine Code-Aenderung noetig. Manifest-Kommentar ergaenzen, der klarstellt, dass MOD-08 Dynamic Routes intern handhabt (Dokumentations-Hygiene).

**Dateien:** 1 (routesManifest.ts — nur Kommentar)

---

### Phase 6: Zone-1 Legacy-Bereinigung

**Problem 1:** FinanceDesk existiert als eigenstaendiger Desk (179 Zeilen), obwohl die Funktionalitaet vollstaendig im FutureRoom-Layout abgebildet ist. Die FinanceDesk-Unterseiten (Inbox, Berater, Zuweisung, Monitoring) zeigen nur EmptyStates und duplizieren die FutureRoom-Funktionalitaet.

**Aktion:** FinanceDesk-Dashboard so umbauen, dass es direkt auf FutureRoom verweist (Redirect oder Info-Banner "Finanzierungsmanagement wurde in FutureRoom konsolidiert"), statt hardcodierte KPI-Zahlen (5, 23, 8, 64%) anzuzeigen, die nicht aus der DB stammen.

**Problem 2:** AdminStubPage wird korrekt als Fallback fuer nicht-implementierte Admin-Routen genutzt. Kein Handlungsbedarf — das Pattern ist korrekt.

**Dateien:** 1 (FinanceDesk.tsx)

---

### Phase 7: Zone-3 Verbesserungen

**7a) SoT Demo-Seite**
Die Demo-Seite ist BEREITS implementiert (287 Zeilen) mit:
- 6 Demo-Module mit Deep-Links ins Portal
- Desktop/Mobile Vorschau-Switcher
- "Demo ansehen" und "Account erstellen" CTAs
- Benefits-Vergleich (Demo vs. Account)

**Befund:** Die Seite ist inhaltlich vollstaendig. KEIN Handlungsbedarf.

**7b) FutureRoom Karriere-Seite**
Bereits implementiert (203 Zeilen) mit Benefits, Rollenbeschreibung und CTA. Was fehlt: ein konkretes **Bewerbungsformular** (Name, E-Mail, Telefon, §34i-Status, Erfahrung). Derzeit nur ein Link-Button ohne Formular.

**Aktion:** Inline-Bewerbungsformular mit 5-6 Feldern und toast-Feedback ergaenzen.

**Dateien:** 1 (FutureRoomKarriere.tsx)

---

### Phase 8: FinanceDesk KPI-Datenreste entfernen

**Problem:** FinanceDesk.tsx zeigt hardcodierte Zahlen (5 Anfragen, 23 Faelle, 8 Berater, 64% Abschlussrate) die nicht aus der Datenbank stammen. Das widerspricht dem Showcase-Readiness-Standard ("keine Datenreste").

**Aktion:** (wird zusammen mit Phase 6 umgesetzt) Die hardcodierten KPIs durch einen sauberen Redirect oder EmptyState ersetzen, der auf FutureRoom verweist.

**Zusammenlegung:** Phase 8 wird in Phase 6 integriert.

---

### Phase 9: FortbildungPage Header-Duplikation pruefen

**Problem (P3):** FortbildungPage umschliesst alle Tab-Routes in PageShell. Dadurch koennte der ModulePageHeader bei Tab-Wechsel redundant gerendert werden.

**Aktion:** Pruefen, ob FortbildungPage den Header korrekt nur einmal rendert oder ob jeder Tab seinen eigenen Header hat. Falls Duplikation: Header in die aeussere Shell verschieben.

**Dateien:** 1-2 (FortbildungPage.tsx, ggf. FortbildungTabContent.tsx)

---

## Zusammenfassung: 5 effektive Phasen

| Phase | Thema | Aufwand | Dateien |
|-------|-------|---------|---------|
| 5 | MOD-08 Manifest-Kommentar | 2 Min | 1 |
| 6 | FinanceDesk Konsolidierung + KPI-Bereinigung | 15 Min | 1 |
| 7 | FutureRoom Karriere-Bewerbungsformular | 15 Min | 1 |
| 8 | (in Phase 6 integriert) | — | — |
| 9 | FortbildungPage Header-Pruefung | 10 Min | 1-2 |

**Gesamt: 4 aktive Phasen, ~45 Minuten, 4-5 Dateien**

Nach Abschluss sind alle identifizierten Audit-Punkte behoben (ausser MOD-18, bewusst zurueckgestellt) und der Showcase-Readiness-Standard ist durchgaengig erfuellt.

## Mermaid-Tracking-Datei

Es wird eine neue Datei `src/docs/audit-tracker.md` erstellt mit folgendem Mermaid-Diagramm:

```text
gantt
    title Audit-Abarbeitung: System of a Town
    dateFormat  YYYY-MM-DD
    section Erledigt
    AP-1 Console.log Bereinigung       :done, ap1, 2026-02-12, 1d
    AP-2 PageShell Migration MOD-16    :done, ap2, 2026-02-12, 1d
    AP-3 MarketingTab Deprecated       :done, ap3, 2026-02-12, 1d
    AP-4 Kaufy Expose Fallback         :done, ap4, 2026-02-12, 1d
    section Offen
    Phase 5 MOD-08 Manifest-Kommentar  :active, p5, 2026-02-12, 1d
    Phase 6 FinanceDesk Konsolidierung :p6, after p5, 1d
    Phase 7 FutureRoom Bewerbungsformular :p7, after p5, 1d
    Phase 9 FortbildungPage Header     :p9, after p6, 1d
    section Zurueckgestellt
    MOD-18 Finanzanalyse               :crit, m18, 2026-03-01, 14d
    MOD-14 Agenten Armstrong           :crit, m14, 2026-03-01, 14d
```

Dies gibt uns ein visuelles Tracking-Board, das wir Phase fuer Phase abarbeiten.
