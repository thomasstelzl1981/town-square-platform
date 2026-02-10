

# Fix: Modul-Einstieg direkt auf ersten Reiter + HowItWorks loeschen

## Problem

Beim Klick auf ein Modul in der zweiten Menuelinie (Level 2) landet man auf einer "How It Works"-Zwischenseite statt direkt im ersten funktionalen Reiter (Level 3). Das betrifft 17 von 20 Modulen.

## SOLL-Zustand

```text
Klick auf "Stammdaten" (Level 2)
        |
        v
  /portal/stammdaten          <-- index Route
        |
        v
  <Navigate to="profil" />    <-- sofortige Weiterleitung
        |
        v
  /portal/stammdaten/profil   <-- Reiter 1 direkt sichtbar
```

## Aenderungen

### Teil 1: HowItWorks-Komponente loeschen

Die folgenden Dateien werden **komplett geloescht**:

| Datei | Grund |
|-------|-------|
| `src/components/portal/HowItWorks/ModuleHowItWorks.tsx` | Zwischenseiten-Komponente, wird nicht mehr genutzt |
| `src/components/portal/HowItWorks/index.ts` | Re-Export Barrel |

**Verbleibende Dateien (werden NICHT geloescht):**

| Datei | Grund |
|-------|-------|
| `src/components/portal/HowItWorks/moduleContents.ts` | Wird von `AreaOverviewPage.tsx` und `AreaModuleCard.tsx` fuer die Level-1-Bereichsuebersichten weiter genutzt |

`AreaModuleCard.tsx` importiert den Typ `HowItWorksContent` aus `ModuleHowItWorks.tsx`. Da wir die Datei loeschen, muss der Typ nach `moduleContents.ts` verschoben werden. Die Imports in `AreaModuleCard.tsx` und `AreaOverviewPage.tsx` werden angepasst.

### Teil 2: 17 Modul-Seiten umstellen

Jede Datei: `ModuleHowItWorks`/`moduleContents` Import entfernen, `content` Variable entfernen, Index-Route aendern.

| # | Modul | Datei | Ziel-Reiter |
|---|-------|-------|-------------|
| 1 | MOD-01 Stammdaten | StammdatenPage.tsx | `profil` |
| 2 | MOD-02 KI Office | OfficePage.tsx | `email` |
| 3 | MOD-03 DMS | DMSPage.tsx | `storage` |
| 4 | MOD-04 Immobilien | ImmobilienPage.tsx | `portfolio` |
| 5 | MOD-05 MSV | MSVPage.tsx | `objekte` |
| 6 | MOD-06 Verkauf | VerkaufPage.tsx | `objekte` |
| 7 | MOD-07 Finanzierung | FinanzierungPage.tsx | `selbstauskunft` |
| 8 | MOD-08 Investment-Suche | InvestmentsPage.tsx | `suche` |
| 9 | MOD-09 Vertriebspartner | VertriebspartnerPage.tsx | `katalog` |
| 10 | MOD-10 Leads | LeadsPage.tsx | `inbox` |
| 11 | MOD-12 Akquise-Manager | AkquiseManagerPage.tsx | `dashboard` |
| 12 | MOD-13 Projekte | ProjektePage.tsx | `dashboard` |
| 13 | MOD-14 Communication Pro | CommunicationProPage.tsx | `serien-emails` |
| 14 | MOD-15 Fortbildung | FortbildungPage.tsx | `katalog` |
| 15 | MOD-17 Car-Management | CarsPage.tsx | `fahrzeuge` |
| 16 | MOD-18 Finanzanalyse | FinanzanalysePage.tsx | `dashboard` |
| 17 | MOD-19 Photovoltaik | PhotovoltaikPage.tsx | `anlagen` |

Bereits korrekt (keine Aenderung):
- MOD-11 Finanzierungsmanager, MOD-16 Shops, MOD-20 Miety

### Teil 3: Vertriebspartner-HowItWorks (separates Pattern)

`src/components/vertriebspartner/HowItWorks.tsx` ist ein **anderes** Pattern (inline Schritt-Erklaerung innerhalb von Tabs wie NetworkTab, KundenTab). Dieses bleibt **unveraendert** — es ist kein Zwischen-Screen, sondern ein eingebettetes UI-Element.

## Risikobewertung

| Risiko | Schwere | Bewertung |
|--------|---------|-----------|
| Broken Imports nach Loeschung von ModuleHowItWorks.tsx | Mittel | Alle 17 Dateien werden im selben Schritt umgestellt. `AreaModuleCard` wird auf neuen Import-Pfad umgestellt. Kein Restrisiko. |
| Bookmarks auf `/portal/stammdaten` (ohne Sub-Pfad) | Kein Risiko | `<Navigate replace />` leitet sofort weiter — besser als vorher |
| AreaOverviewPage verliert Daten | Kein Risiko | `moduleContents.ts` bleibt erhalten, nur der Import-Pfad fuer den Typ aendert sich |
| Mobile-Navigation bricht | Kein Risiko | Mobile nutzt Card-Navigation, die direkt auf `defaultRoute` zeigt — kein HowItWorks involviert |
| Vertriebspartner-HowItWorks bricht | Kein Risiko | Komplett anderes Pattern, anderer Ordner, keine Abhaengigkeit |

**Gesamtrisiko: NIEDRIG.** Alle Aenderungen sind mechanisch (Import entfernen, eine Zeile aendern). Keine Logik-Aenderungen, keine DB-Aenderungen, keine neuen Abhaengigkeiten.

## Zusammenfassung

- 2 Dateien loeschen (ModuleHowItWorks.tsx, index.ts)
- 1 Datei anpassen (moduleContents.ts — Typ-Definition hinzufuegen)
- 1 Datei anpassen (AreaModuleCard.tsx — Import-Pfad aendern)
- 17 Dateien: je 2-3 Zeilen aendern (Import entfernen, Index-Route umstellen)
- 0 neue Dateien
- 0 Datenbank-Aenderungen

