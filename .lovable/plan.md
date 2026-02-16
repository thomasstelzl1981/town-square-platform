
# CI-Widget-System: Homogenisierung und Glow-Farbspezifikation

## 1. Analyse: Ist-Zustand aller Widgets

### 1.1 Widget-Typen im System (Ist)

Aktuell existieren **5 verschiedene Widget-Darstellungen**, die teilweise inkonsistent verwendet werden:

| Widget-Typ | Komponente | Groesse | Verwendung |
|---|---|---|---|
| **A. System-Widget** | Direkt in Dashboard | `aspect-square` via WidgetCell | Armstrong, Wetter, Globe, Meeting |
| **B. Task-Widget** | `TaskWidget.tsx` | `aspect-square` | Armstrong-Tasks im Dashboard |
| **C. Case-Widget** | `*CaseCard.tsx` / direkte Card | `md:aspect-square` via WidgetCell | Finanzierung, Sanierung, Akquise, Projekte, Fahrzeuge |
| **D. RecordCard** | `RecordCard.tsx` | `md:aspect-square` (closed) / full-width (open) | Personen, Versicherungen, Vorsorge, Abos |
| **E. KV-Widget** | `KrankenversicherungTab` | `span-2` Card, **NICHT quadratisch** | KV-Tab (neu, inkonsistent) |

### 1.2 Glow-Farben-Zuordnung (Ist)

| Glow-Farbe | Variante | Aktuell verwendet in |
|---|---|---|
| `primary` (Blau) | Finanzierung (MOD-07), FM-Manager (MOD-11), Investment (MOD-18) | FinanceCaseCard, StatusTab, InvestmentTab |
| `amber` (Bernstein) | Projekte (MOD-13), Portfolio (MOD-04), Invest-Mandate | ProjectCard, LandingPageTab, MandatTab |
| `cyan` (Tuerkis) | Akquise (MOD-12) | MandateCaseCard |
| `violet` (Violett) | CommunicationPro (MOD-14) | ResearchOrderWidget, SerienEmailsPage |
| `orange` | Sanierung (MOD-04), Privatkredit (MOD-07) | ServiceCaseCard, ConsumerLoanWidgets |
| `teal` (Dunkeltuerkis) | Fahrzeuge (MOD-17) | CarsAutos |
| `rose` | Definiert aber **NICHT VERWENDET** | — |
| **Emerald (Gruen)** | **NICHT als Glow definiert** | Nur als `text-emerald-600` im Kontostand |

### 1.3 Probleme

| Problem | Details |
|---|---|
| **Kein Emerald-Glow** | Echte manuell erfasste Vertraege haben aktuell KEINEN Glow — nur RecordCard-Standard ohne Farbakzent |
| **KV-Tab inkonsistent** | Nutzt `span-2` Cards statt einheitliche `WidgetCell`-Quadrate |
| **RecordCard hat keinen Glow** | Versicherungen, Vorsorge, Abos zeigen keinen farbigen Rand — sie sind visuell nicht von CTA/Placeholder unterscheidbar |
| **Fehlende Glow-Variante** | `emerald` ist im `ACTIVE_WIDGET_VARIANTS` nicht registriert |
| **Konten-Widget** | Handgebaut in UebersichtTab, kein getActiveWidgetGlow() |
| **Personen-Widget** | RecordCard im RECORD_CARD.GRID (2-spaltig), nicht im WidgetGrid (4-spaltig) — eigenes Layout |

---

## 2. Soll-Zustand: 3 Widget-Kategorien mit Glow-Regeln

### Kategorie-Definition

| Kategorie | Groesse | Glow | Beispiele |
|---|---|---|---|
| **Dashboard-Widget** | `aspect-square` in 4-Col WidgetGrid | Keiner oder System-spezifisch | Armstrong, Wetter, Globe, Task-Widgets |
| **Personen/Konten-Widget** | `aspect-square` in 4-Col WidgetGrid (gross wirkend, da WidgetCell) | Kein Glow (neutral) | Haushaltspersonen, Bankkonten |
| **Vertrags-Widget** | `aspect-square` in 4-Col WidgetGrid — einheitlich klein | **Glow nach Herkunft** (siehe unten) | Versicherungen, Vorsorge, Abos, KV, Fahrzeuge, Immobilien |

### Glow-Regeln nach Datenherkunft

| Herkunft | Glow-Farbe | Variante | Beschreibung |
|---|---|---|---|
| **Demo-Daten** | Blau | `primary` (DEMO_WIDGET Token) | Alle Demo-Vertraege (isDemoId = true), Shimmer + Badge "DEMO" |
| **Manuell erfasst** | Gruen | `emerald` (NEU) | Echte, vom User angelegte Vertraege |
| **Shop-Angebote** | Kein Glow | Neutral (glass-card Standard) | Marketplace-Angebote, CTAs, Platzhalter |

### Glow-Regeln nach Modul (fuer Case-Widgets)

Die bestehenden modul-spezifischen Glows bleiben fuer aktive Faelle/Mandate erhalten:

| Modul | Glow | Verwendung |
|---|---|---|
| MOD-04 Portfolio | `amber` | Vermietereinheiten-Widgets |
| MOD-04 Sanierung | `orange` | Sanierungsfall-Widgets |
| MOD-07 Finanzierung | `primary` | Finanzierungsanfrage-Widgets |
| MOD-07 Privatkredit | `orange` | Privatkredit-Fall-Widgets |
| MOD-08 Suche | `primary` | Suchmandat-Widgets |
| MOD-11 FM-Manager | `primary` | FM-Fall-Widgets |
| MOD-12 Akquise | `cyan` | Akquise-Mandat-Widgets |
| MOD-13 Projekte | `amber` | Projekt-Widgets |
| MOD-14 CommunicationPro | `violet` | Recherche/Serien-Email-Widgets |
| MOD-17 Fahrzeuge | `teal` | Fahrzeug-Widgets |
| MOD-18 Versicherungen | `emerald` (manuell) / `primary` (demo) | Vertrags-Widgets |
| MOD-18 Vorsorge | `emerald` (manuell) / `primary` (demo) | Vorsorge-Widgets |
| MOD-18 Abos | `emerald` (manuell) / `primary` (demo) | Abo-Widgets |
| MOD-18 KV | `primary` (nur demo) | KV-Widgets |
| MOD-18 Konten | Kein Glow (neutral) | Konten-Widgets |

---

## 3. Technischer Umsetzungsplan

### 3.1 Neue Spec-Datei: `src/config/widgetCategorySpec.ts`

Zentrale SSOT fuer Widget-Kategorien, Glow-Zuordnungen und Regeln:

```text
src/config/widgetCategorySpec.ts

Inhalte:
- WidgetCategory enum: 'dashboard' | 'entity' | 'contract'
- WidgetGlowSource enum: 'demo' | 'manual' | 'shop' | 'module'
- WIDGET_GLOW_MAP: Record<Module, ActiveWidgetVariant>
- getContractWidgetGlow(isDemoId, isShopOffer): ActiveWidgetVariant | null
- Helper: resolveWidgetGlow(source, moduleCode)
```

### 3.2 Neue Glow-Variante: `emerald`

In `designManifest.ts` wird `ActiveWidgetVariant` um `'emerald'` erweitert und die entsprechenden CSS-Klassen hinzugefuegt:

```text
emerald: {
  border: 'border-emerald-400/30',
  shadow: 'shadow-[0_0_15px_-3px] shadow-emerald-400/15',
  shimmer: 'before:... from-emerald-400/40 via-emerald-400/60 to-emerald-400/40 ...',
}
```

### 3.3 RecordCard um optionalen Glow erweitern

`RecordCard.tsx` erhaelt einen neuen optionalen Prop `glowVariant?: ActiveWidgetVariant`:

- Wenn gesetzt: `getActiveWidgetGlow(variant)` wird auf den Closed-State angewendet
- Default: kein Glow (bisheriges Verhalten)

### 3.4 MOD-18 Tabs umstellen

| Tab | Aenderung |
|---|---|
| **Sachversicherungen** | RecordCard erhaelt `glowVariant={isDemoId(c.id) ? undefined : 'emerald'}` — Demo-Contracts bekommen DEMO_WIDGET Styling statt RecordCard |
| **Vorsorge** | Gleich wie Sachversicherungen |
| **Abos** | Gleich wie Sachversicherungen |
| **KV** | Von `span-2` Cards auf einheitliche `WidgetCell` (aspect-square) umbauen |
| **Uebersicht** | Personen und Konten bleiben im WidgetGrid, bekommen aber keinen Glow (neutral) |

### 3.5 Versicherungen/Vorsorge/Abos: Von RecordCard zu WidgetGrid

Aktuell nutzen diese Tabs `RECORD_CARD.GRID` (2-spaltig). Das Soll ist `WidgetGrid` (4-spaltig) mit `WidgetCell` fuer geschlossene Karten. Die offene RecordCard bleibt full-width unterhalb des Grids (wie bei allen anderen Modulen).

**Konkret**: Die geschlossene Darstellung wird von `RECORD_CARD.CLOSED` (2-spaltig, md:aspect-square) auf `WidgetCell` im `WidgetGrid` (4-spaltig) umgestellt. Der offene State bleibt full-width inline unterhalb.

### 3.6 Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|---|---|---|
| `src/config/widgetCategorySpec.ts` | NEU | SSOT fuer Widget-Kategorien und Glow-Regeln |
| `src/config/designManifest.ts` | EDIT | `emerald` als ActiveWidgetVariant hinzufuegen |
| `src/components/shared/RecordCard.tsx` | EDIT | Optionaler `glowVariant` Prop |
| `src/pages/portal/finanzanalyse/SachversicherungenTab.tsx` | EDIT | WidgetGrid + WidgetCell + Glow-Logik |
| `src/pages/portal/finanzanalyse/VorsorgeTab.tsx` | EDIT | WidgetGrid + WidgetCell + Glow-Logik |
| `src/pages/portal/finanzanalyse/AbonnementsTab.tsx` | EDIT | WidgetGrid + WidgetCell + Glow-Logik |
| `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx` | EDIT | Von span-2 auf einheitliche WidgetCell |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | EDIT | Konten-Widgets ohne Glow (neutral) |
| `src/engines/demoData/data.ts` | EDIT | Coverage-Map um Glow-Zuordnungen erweitern |

---

## 4. Zusammenfassung der Glow-Farbpalette

| Farbe | Hex-Bereich | Verwendungszweck |
|---|---|---|
| Emerald (Gruen) | `emerald-400` | Manuell erfasste echte Vertraege |
| Primary (Blau) | `primary` | Demo-Daten + Finanzierungs-Module |
| Amber (Bernstein) | `amber-400` | Projekte, Portfolio |
| Cyan (Tuerkis) | `cyan-400` | Akquise |
| Violet (Violett) | `violet-400` | CommunicationPro |
| Orange | `orange-400` | Sanierung, Privatkredit |
| Teal (Dunkeltuerkis) | `teal-400` | Fahrzeuge, Services |
| Rose (Pink) | `rose-400` | Leads (Zone 1) |
| Neutral (Kein Glow) | — | Shop-Angebote, CTAs, Platzhalter |

