

# Virtueller Walkthrough MOD-13 Golden Path: Analyse und Reparaturplan

## Walkthrough-Ergebnis

Ich habe den gesamten Pfad Schritt fuer Schritt durchgespielt und dabei **6 Probleme** identifiziert — davon **1 kritisch**, **3 mittel** und **2 klein**.

---

## Bestaetigung: Demo-Projekt

**PROBLEM (KRITISCH):** Das Demo-Projekt verschwindet, sobald ein echtes Projekt angelegt wird.

Die Funktion `isDemoMode()` in `demoProjectData.ts` (Zeile 8) ist definiert als:
```text
export const isDemoMode = (portfolioRows: any[]) => portfolioRows.length === 0;
```

Sobald ein echtes Projekt existiert, ist `portfolioRows.length > 0` und `isDemoMode` gibt `false` zurueck. Damit verschwindet das Demo-Projekt aus:
- Dashboard (`ProjekteDashboard.tsx`, Zeile 146)
- PortfolioTab (`PortfolioTab.tsx`, Zeile 47)
- VertriebTab (`VertriebTab.tsx`, Zeile 32)
- LandingPageTab (`LandingPageTab.tsx`, Zeile 19)

**Reparatur:** Das Demo-Projekt muss **immer** als erste Kachel angezeigt werden — unabhaengig davon, ob echte Projekte existieren:
- `isDemoMode` wird nicht mehr als Schalter zwischen Demo/Echt genutzt
- Stattdessen wird `DEMO_PROJECT` immer als erstes Element in der Projekt-Liste eingefuegt (mit `isDemo`-Flag)
- In `PortfolioTab` und `ProjekteDashboard`: Demo-Kachel wird immer gerendert, echte Projekte daneben
- Wenn Demo-Kachel ausgewaehlt ist, zeigen Preisliste/Calculator die `DEMO_UNITS`
- Wenn ein echtes Projekt ausgewaehlt ist, werden die echten `dev_project_units` geladen

| Datei | Aenderung |
|-------|-----------|
| `PortfolioTab.tsx` | Demo-Kachel immer rendern + echte Kacheln daneben |
| `ProjekteDashboard.tsx` | Demo-Kachel immer im Grid anzeigen |
| `VertriebTab.tsx` | Demo-Projekt immer als Option im Selector |
| `LandingPageTab.tsx` | Projekt-Auswahl ermoeglichen (siehe Problem 2) |

---

## Problem 2: LandingPageTab hat keinen Projekt-Switcher

**MITTEL:** `LandingPageTab.tsx` (Zeile 20-21) nimmt immer `projects[0]`:
```text
const activeProject = isDemo ? DEMO_PROJECT : (portfolioRows[0] || DEMO_PROJECT);
const rawProject = isDemo ? null : projects[0];
```

Wenn mehrere Projekte existieren, kann der User nicht waehlen, fuer welches Projekt die Landingpage erstellt/angezeigt wird.

**Reparatur:** Einen Projekt-Switcher (ProjectCard-Kacheln, wie in PortfolioTab) oben einfuegen. Beim Klick auf eine Kachel wird `selectedProjectId` gesetzt und die LandingPage-Daten fuer dieses Projekt geladen.

| Datei | Aenderung |
|-------|-----------|
| `LandingPageTab.tsx` | ProjectCard-Kacheln + selectedProjectId State |

---

## Problem 3: LandingPagePreview reicht keine Units durch

**MITTEL:** `LandingPagePreview.tsx` (Zeile 71-76) ruft `LandingPageWebsite` auf, uebergibt aber keine `units`-Prop:
```text
<LandingPageWebsite
  project={project}
  landingPage={landingPage}
  isDemo={isDemo}
/>
```

In `ProjektLandingPage.tsx` (oeffentliche Route) werden Units korrekt geladen und uebergeben. Aber in der Portal-Vorschau (`LandingPagePreview`) fehlt die `units`-Prop, sodass der InvestmentTab auf `DEMO_UNITS` zurueckfaellt.

**Reparatur:** `LandingPagePreview` um eine `units`-Prop erweitern und in `LandingPageTab` die Units aus `dev_project_units` laden und durchreichen.

| Datei | Aenderung |
|-------|-----------|
| `LandingPagePreview.tsx` | Neue `units`-Prop, an LandingPageWebsite weiterreichen |
| `LandingPageTab.tsx` | Units-Query hinzufuegen, an Preview weiterreichen |

---

## Problem 4: MarketingTab Kaufy-Toggle widerspricht SalesApprovalSection

**MITTEL:** `MarketingTab.tsx` (Zeile 31-38) hat einen eigenen Kaufy-Toggle, der bei Aktivierung eine Toast-Meldung "Kaufy-Listing erfordert Sales Desk Freigabe" zeigt. Gleichzeitig existiert in `SalesApprovalSection.tsx` ein funktionaler Kaufy-Toggle, der direkt Listings verwaltet.

Diese Dopplung fuehrt zu Verwirrung: Der User koennte den Kaufy-Toggle im MarketingTab betaetigen und wird blockiert, obwohl der Toggle im VertriebTab funktioniert.

**Reparatur:** Den Kaufy-Toggle im MarketingTab als Read-Only-Anzeige umbauen (zeigt nur Status an). Die eigentliche Steuerung erfolgt ausschliesslich ueber die `SalesApprovalSection` im VertriebTab.

| Datei | Aenderung |
|-------|-----------|
| `MarketingTab.tsx` | Kaufy-Toggle als Status-Badge (read-only) |

---

## Problem 5: SalesApprovalSection — fehlende `requested_at`-Spalte

**KLEIN:** In `SalesDesk.tsx` (Zeile 159) wird `req.requested_at` referenziert. Die `sales_desk_requests`-Tabelle hat dieses Feld moeglicherweise als `created_at` statt `requested_at`. Falls die Spalte nicht existiert, zeigt die Zone 1 Tabelle "Invalid Date".

**Reparatur:** Pruefen und ggf. auf `req.created_at` aendern oder Spalte abfragen.

| Datei | Aenderung |
|-------|-----------|
| `SalesDesk.tsx` | `requested_at` durch `created_at` ersetzen (falls Spalte fehlt) |

---

## Problem 6: LandingPagePreview "Bearbeiten"-Button ist disabled

**KLEIN:** In `LandingPagePreview.tsx` (Zeile 90) ist der "Bearbeiten"-Button hardcoded `disabled`. Die Inline-Editing-Funktionalitaet (LandingPageEditOverlay) ist laut Spezifikation vorgesehen, aber nicht angeschlossen.

**Reparatur:** Fuer den aktuellen Scope koennen wir den Button als "Coming Soon" labeln oder entfernen, um keine falsche Erwartung zu wecken. Die volle Edit-Funktionalitaet kann spaeter implementiert werden.

| Datei | Aenderung |
|-------|-----------|
| `LandingPagePreview.tsx` | Button mit "Coming Soon" Badge oder entfernen |

---

## Zusammenfassung der Aenderungen

| # | Datei | Prioritaet | Problem |
|---|-------|------------|---------|
| 1 | `demoProjectData.ts` | KRITISCH | Demo-Projekt muss immer sichtbar bleiben |
| 2 | `PortfolioTab.tsx` | KRITISCH | Demo-Kachel immer rendern |
| 3 | `ProjekteDashboard.tsx` | KRITISCH | Demo-Kachel immer im Grid |
| 4 | `LandingPageTab.tsx` | MITTEL | Projekt-Switcher + Units laden |
| 5 | `LandingPagePreview.tsx` | MITTEL | Units-Prop durchreichen |
| 6 | `VertriebTab.tsx` | MITTEL | Demo-Projekt immer als Option |
| 7 | `MarketingTab.tsx` | MITTEL | Kaufy-Toggle read-only |
| 8 | `SalesDesk.tsx` | KLEIN | requested_at Fix |
| 9 | `LandingPagePreview.tsx` | KLEIN | Bearbeiten-Button Labeling |

## Was bereits korrekt funktioniert

- **Vertriebsauftrag-Aktivierung** (SalesApprovalSection): Direkte Aktivierung ohne Zone 1 Gate — korrekt
- **Listing-Erstellung** (createListingsForProject): Properties, Listings und Publications werden korrekt angelegt — korrekt
- **Kaufy-Toggle** (SalesApprovalSection): Funktionale Umsetzung mit Upsert-Logik — korrekt
- **Widerrufs-Logik** (deactivateVertriebsauftrag): Listings + Publications werden bereinigt — korrekt
- **Zone 1 Kill-Switch** (SalesDesk): Nur Deaktivierung, kein Approval — korrekt
- **Landing Page Builder** (LandingPageBuilder): Echte Adressdaten werden durchgereicht — korrekt
- **Oeffentliche Landing Page** (ProjektLandingPage): Echte Daten statt DEMO_PROJECT — korrekt
- **Edge Function** (sot-generate-landing-page): Empfaengt echte Daten — korrekt

