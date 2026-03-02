

# TLC Komplett-Umbau: Collapsible → Inline-Scroll mit CI-Design

## Ist-Zustand

Das gesamte TLC-System besteht aus **18 Sektions-Komponenten** + **4 Kategorie-Wrappern** in `TenancyTab.tsx`, die alle das gleiche `Collapsible`-Pattern nutzen. Alles ist hinter Klicks versteckt — der User sieht nur eine Liste von Ghost-Buttons.

```text
IST (alles zugeklappt):
┌─────────────────────────────────┐
│ ▶ 📋 Kernfunktionen            │
│ ▶ 📝 Vertrag & Übergabe        │
│ ▶ 💶 Finanzen                   │
│ ▶ 🏢 Verwaltung                 │
│   Portfolio-Report              │
└─────────────────────────────────┘
```

## Soll-Zustand

Alles inline sichtbar, durch Scrollen erreichbar. Jede Kategorie wird eine `SectionCard` mit CI-konformer Typografie. Jede Sub-Sektion wird direkt gerendert ohne eigenes Collapsible.

```text
SOLL (scrollbar, alles sichtbar):
┌─────────────────────────────────────────────────┐
│ [📋] Kernfunktionen                             │  ← SectionCard
│      Lifecycle-Events, Aufgaben & Fristen       │    TYPOGRAPHY.SECTION_TITLE
│                                                 │
│  ┌ Lifecycle-Events (24) ── [3 offen] ────┐     │  ← Inline, kein Collapsible
│  │  ⚠ Mieterhöhung fällig  │ 01.03.26    │     │
│  │  ℹ Vertrag verlängert   │ 28.02.26    │     │
│  │  ...                                   │     │
│  └────────────────────────────────────────┘     │
│                                                 │
│  ┌ Aufgaben (16 offen) ──────────────────┐      │
│  │  🔴 Rohrbruch EG │ urgent │ 4h SLA    │      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│                                                 │
│  ┌ Fristen ──────────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│                                                 │
│  ┌ Zählerstände ─────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [📝] Vertrag & Übergabe                         │  ← SectionCard
│      Inserate, Verträge, Übergaben, Bewerber    │
│                                                 │
│  ┌ Vermietungsinserat ── [● Aktiv] ──────┐      │
│  │  Kaltmiete: 850€  │  Warmmiete: 1150€ │      │
│  │  [Auf IS24 buchen (2 Cr)]             │      │
│  └───────────────────────────────────────┘      │
│                                                 │
│  ┌ Mietvertrag ─────────────────────────┐       │
│  │  ...                                 │       │
│  └──────────────────────────────────────┘       │
│  ┌ Übergabeprotokoll ──────────────────┐        │
│  │  ...                                │        │
│  └─────────────────────────────────────┘        │
│  ┌ Bewerber ───────────────────────────┐        │
│  │  ...                                │        │
│  └─────────────────────────────────────┘        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [💶] Finanzen                                    │  ← SectionCard
│      Zahlungsplan, Mietminderung, NK, Prüfungen │
│  ┌ Zahlungsplan ─────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ Mietminderung ────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ NK-Vorauszahlung ─────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ 3-Jahres-Check ───────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ Rechnungen ───────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [🏢] Verwaltung                                  │  ← SectionCard
│      Kommunikation, Mängel, Dienstleister, Vers.│
│  ┌ Kommunikation ────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ Mängelmelder ─────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ Dienstleister ────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
│  ┌ Versicherung ─────────────────────────┐      │
│  │  ...                                  │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ [📊] Portfolio-Report                            │  ← SectionCard
└─────────────────────────────────────────────────┘
```

## Technische Umsetzung

### Ebene 1: TenancyTab.tsx (Kategorie-Wrapper)

Die 4 Kategorie-`Collapsible`-Wrapper (Zeilen 764-896) werden ersetzt durch 4 `SectionCard`-Komponenten mit passenden Icons und Descriptions:

| Kategorie | Icon | Titel | Description |
|-----------|------|-------|-------------|
| Kernfunktionen | `ClipboardList` | Kernfunktionen | Lifecycle-Events, Aufgaben & Fristen |
| Vertrag & Uebergabe | `FileText` | Vertrag & Uebergabe | Inserate, Vertraege, Uebergaben, Bewerber |
| Finanzen | `Euro` | Finanzen | Zahlungsplaene, Minderungen, NK-Pruefungen |
| Verwaltung | `Building2` | Verwaltung | Kommunikation, Maengel, Dienstleister |

Historische Vertraege (Z. 724-753) bleiben als einziges `Collapsible` — das ist korrekt, da es optionaler Archiv-Content ist.

### Ebene 2: Alle 18 TLC-Sektions-Komponenten

Jede der 18 Komponenten hat intern das gleiche Pattern:

```tsx
// ALT (alle 18 Dateien):
<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="w-full justify-between h-8 text-xs">
      <span>...</span>
      <ChevronDown />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Inhalt */}
  </CollapsibleContent>
</Collapsible>
```

Wird ersetzt durch:

```tsx
// NEU (alle 18 Dateien):
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
      <Icon className="h-3.5 w-3.5 inline mr-1.5" />
      Sektions-Titel
    </h4>
    {/* Badge/Counter bleibt */}
  </div>
  {/* Inhalt direkt sichtbar */}
</div>
```

Entfernt aus jeder Datei:
- `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` Imports
- `useState` fuer `open`/`setOpen` (wenn nur dafuer genutzt)
- `ChevronDown` Icon Import (wenn nur dafuer genutzt)

### Betroffene Dateien (20 Dateien)

| # | Datei | Zeilen ca. | Aenderung |
|---|-------|-----------|-----------|
| 1 | `TenancyTab.tsx` | 928 | 4 Kategorie-Collapsibles → 4 SectionCards |
| 2 | `TLCEventsSection.tsx` | 87 | Collapsible → inline |
| 3 | `TLCTasksSection.tsx` | 106 | Collapsible → inline |
| 4 | `TLCDeadlinesSection.tsx` | 119 | Collapsible → inline |
| 5 | `TLCMeterSection.tsx` | ~100 | Collapsible → inline |
| 6 | `TLCRentalListingSection.tsx` | 422 | Collapsible → inline (bereits geplant) |
| 7 | `TLCContractSection.tsx` | ~150 | Collapsible → inline |
| 8 | `TLCHandoverSection.tsx` | 129 | Collapsible → inline |
| 9 | `TLCApplicantSection.tsx` | ~120 | Collapsible → inline |
| 10 | `TLCPaymentPlanSection.tsx` | 140 | Collapsible → inline |
| 11 | `TLCRentReductionSection.tsx` | ~120 | Collapsible → inline |
| 12 | `TLCPrepaymentSection.tsx` | ~140 | Collapsible → inline |
| 13 | `TLCThreeYearCheckSection.tsx` | 145 | Collapsible → inline |
| 14 | `TLCInvoiceSection.tsx` | ~100 | Collapsible → inline |
| 15 | `TLCCommunicationSection.tsx` | ~200 | Collapsible → inline |
| 16 | `TLCDefectSection.tsx` | 195 | Collapsible → inline |
| 17 | `TLCServiceProviderSection.tsx` | ~120 | Collapsible → inline |
| 18 | `TLCInsuranceSection.tsx` | ~120 | Collapsible → inline |
| 19 | `TLCReportSection.tsx` | ~100 | Collapsible → inline |

### CI-Elemente die verwendet werden

- `SectionCard` aus `src/components/shared/SectionCard.tsx` — fuer Kategorie-Wrapper
- `DESIGN.TYPOGRAPHY.SECTION_TITLE` — fuer Kategorie-Ueberschriften
- `DESIGN.TYPOGRAPHY.LABEL` — fuer Sub-Sektions-Titel
- `DESIGN.TYPOGRAPHY.HINT` — fuer Beschreibungstexte
- `DESIGN.SPACING.SECTION` — fuer Abstaende zwischen Kategorien
- `DESIGN.CARD.SECTION` — via SectionCard automatisch

### Was sich NICHT aendert

- Alle Queries, Mutations, Business-Logik — 100% identisch
- Props-Schnittstellen der Komponenten bleiben gleich
- Historische Vertraege bleiben Collapsible (Archiv-Pattern)
- IS24-Integration, AlertDialog, Form-Lock — alles bleibt

