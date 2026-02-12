

# Implementierungsplan: Audit-Massnahmen (ohne MOD-18)

## Uebersicht

Basierend auf dem Komplett-Audit werden alle identifizierten Probleme in 4 Arbeitspakete (AP) aufgeteilt, priorisiert nach Schwere.

---

## AP-1: Code-Hygiene — Console.log-Reste entfernen (P1/P2)

**6 Dateien, ~10 Minuten**

| Datei | Stelle | Aktion |
|-------|--------|--------|
| `src/pages/portal/FinanzanalysePage.tsx` | Zeile 24: `console.log('Analyse')` | Ersetzen durch `toast.info('Finanzanalyse wird vorbereitet...')` |
| `src/pages/portal/FinanzanalysePage.tsx` | Zeile 48: `console.log('Report')` | Ersetzen durch `toast.info('Report-Generator wird vorbereitet...')` |
| `src/pages/portal/FinanzanalysePage.tsx` | Zeile 68: `console.log('Szenario')` | Ersetzen durch `toast.info('Szenario-Editor wird vorbereitet...')` |
| `src/pages/portal/CommunicationProPage.tsx` | Zeile 29: `console.log('Agent')` | Ersetzen durch `toast.info('Agenten-Konfiguration wird vorbereitet...')` |
| `src/pages/portal/office/WidgetsTab.tsx` | Zeile 110: `console.log('Repeat widget:', widgetId)` | Ersetzen durch `toast.info('Widget wird wiederholt')` |
| `src/pages/portal/ServicesPage.tsx` | Zeile 395: `console.log('Neue Bestellung')` | Ersetzen durch `toast.info('Bestellformular wird vorbereitet...')` |

Alle 6 Dateien erhalten ggf. einen `import { toast } from 'sonner'` falls noch nicht vorhanden.

---

## AP-2: Layout-Konsistenz — PageShell-Migration (P1)

### 2a) ShopTab in ServicesPage.tsx

Die `ShopTab`-Komponente (Zeile 123) nutzt noch `<div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">` statt `<PageShell>`.

**Aenderung:**
- Import `PageShell` und `ModulePageHeader` hinzufuegen
- Container-div durch `<PageShell>` ersetzen
- Statischen Header durch `<ModulePageHeader title="SHOPS" description="Einkaufen und Bestellen..." />` ersetzen

### 2b) BestellungenTab in ServicesPage.tsx

Die `BestellungenTab`-Komponente (Zeile 388) hat dasselbe Problem.

**Aenderung:**
- Container-div durch `<PageShell>` ersetzen
- Header-div durch `<ModulePageHeader title="BESTELLUNGEN" description="..." actions={<Button>}` ersetzen

---

## AP-3: Orphan-Datei klaeren — MarketingTab.tsx (P2)

`src/pages/portal/projekte/MarketingTab.tsx` existiert als vollstaendig implementierte Komponente (244 Zeilen, Kaufy-Listings und Landingpage-Verwaltung), ist aber **nicht im routesManifest** und wird von keinem Router referenziert.

**Analyse:** Die Datei wurde wahrscheinlich durch die MOD-13 Umstrukturierung (4-Tile-Pattern: Dashboard, Projekte, Vertrieb, Landing Page) verwaist. Die Funktionalitaet (Kaufy-Toggle, Landingpage-Slug) ist teilweise in `VertriebTab` und `LandingPageTab` aufgegangen.

**Aktion:** MarketingTab.tsx als deprecated markieren mit einem Kommentar-Header. Keine Loeschung, da Funktionalitaet moeglicherweise spaeter in VertriebTab integriert wird.

---

## AP-4: Kaufy Expose-Fallback (P2)

`src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` zeigt bei nicht gefundenem Listing nur einen minimalen Text "Objekt nicht gefunden" mit einem "Zurueck zur Suche"-Button (Zeile 237-245).

**Verbesserung:** Den Fallback-Zustand durch eine informativere Ansicht ersetzen:
- Kaufy-Logo und Marken-Header beibehalten
- Nachricht: "Dieses Objekt ist nicht mehr verfuegbar oder wurde deaktiviert."
- CTA-Button: "Weitere Objekte entdecken" (Link zu /website/kaufy)
- Sekundaerer Link: "Sie sind Verkaeufer? Projekt einstellen" (Link zu /website/kaufy/verkaeufer)

---

## Nicht im Scope (bewusst zurueckgestellt)

| Thema | Begruendung |
|-------|-------------|
| MOD-18 Finanzanalyse | Per Anweisung zurueckgestellt |
| MOD-14 Agenten echte Funktionalitaet | Erfordert Armstrong-Agent-Architektur-Entscheidung (eigener Sprint) |
| MOD-14 Social-Tile Pruefung | Bereits implementiert (SocialPage mit internem Router) |
| FutureRoom Karriere Bewerbungsformular | Zone-3-Feature, separater Sprint |
| End-to-End Tests | Strategisch, eigener Sprint |
| Performance-Audit Edge Functions | Strategisch, eigener Sprint |
| Mobile Deep-Test | Strategisch, eigener Sprint |

---

## Technische Details

### Betroffene Dateien (8 Stueck)

1. `src/pages/portal/FinanzanalysePage.tsx` — 3x console.log durch toast ersetzen
2. `src/pages/portal/CommunicationProPage.tsx` — 1x console.log durch toast ersetzen
3. `src/pages/portal/office/WidgetsTab.tsx` — 1x console.log durch toast ersetzen
4. `src/pages/portal/ServicesPage.tsx` — 1x console.log durch toast ersetzen + PageShell-Migration (ShopTab + BestellungenTab)
5. `src/pages/portal/projekte/MarketingTab.tsx` — Deprecated-Kommentar hinzufuegen
6. `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` — Fallback-Ansicht verbessern

### Keine Datenbank-Aenderungen

Alle Massnahmen sind rein Frontend-seitig. Keine Migrationen erforderlich.

### Erwartetes Ergebnis

| Kategorie | Vorher | Nachher |
|-----------|--------|---------|
| Code-Hygiene | 7/10 | 9/10 |
| UI-Konsistenz | 7/10 | 9/10 |
| Zone 3 Websites | 8/10 | 8.5/10 |
| Gesamt | 8.0/10 | 8.5/10 |

