
# Systemweiter Schrift- und Eingabe-Audit: Tabellarische Standardisierung

## Referenz-Standard: KI-Office (Kontakte-Tab)

Das KI-Office nutzt die `DataTable`-Komponente mit dem globalen `Table`-UI-System:
- Schriftgroesse: `text-sm` (14px) fuer Tabelleninhalte, `text-xs` (12px) fuer Labels/IDs
- Schriftfarbe: `text-foreground` fuer Werte, `text-muted-foreground` fuer Labels
- Input-Hoehe: Standard `h-10` (40px) via `Input`-Komponente
- Keine verteilten Eingabefelder mit grossen Abstaenden
- Klare tabellarische Struktur mit `border-b` Trennern

## Analyse: Drei verschiedene Eingabe-Patterns im System

### Pattern A: "Bank-Tabelle" (FMFallDetail.tsx) -- GUT
```
TableRow > TableCell (Label, w-[180px], border-r, text-xs) | TableCell (Wert, text-sm)
```
- Kompakt, tabellarisch, uebersichtlich
- Genutzt nur in: FMFallDetail Selbstauskunft-Tab
- **Bewertung: Referenz-Pattern fuer Datenanzeige (Read-Only)**

### Pattern B: "Label-ueber-Input" mit Grid (SelbstauskunftFormV2, ApplicantPersonFields, AnfrageFormV2) -- PROBLEM
```
FormField > Label (text-sm) + Input (h-10, rounded-2xl, text-base)
grid-cols-4 gap-4
```
- Jedes Feld hat ein Label UEBER dem Input
- Input ist `h-10` (40px hoch), `rounded-2xl`, `text-base` (16px) -- zu gross
- Grosse Abstaende durch `space-y-6` und `gap-4`
- **Bewertung: Zu viel Platz, nicht tabellarisch, unuebersichtlich**

### Pattern C: "ProfileWidget" mit FormRow (ProfilTab/Stammdaten) -- AKZEPTABEL
```
FormRow > grid-cols-2 gap-4 > FormInput (Label + Input)
```
- Kompakter als Pattern B, aber immer noch Label-ueber-Input
- Genutzt in: ProfilTab, Kontakte-Drawer
- **Bewertung: Akzeptabel fuer Profil-Editing, aber nicht optimal**

## Konkrete Probleme

### 1. Input-Komponente: Zu gross und zu rund
**Datei:** `src/components/ui/input.tsx`
- `h-10` (40px) -- zu hoch fuer tabellarische Eingabe
- `rounded-2xl` -- viel zu rund, wirkt wie ein Suchfeld statt Formularfeld
- `text-base` auf Mobile, `text-sm` ab `md:` -- inkonsistent
- `bg-muted/60` mit `backdrop-blur-sm` -- zu viel visuelles Gewicht
- `shadow-[inset_0_2px_4px]` -- unnoetig bei tabellarischem Layout
- **Loesung:** `h-8`, `rounded-md`, `text-sm` durchgehend, schlankerer Stil

### 2. Select-Komponente: Zu gross und zu rund
**Datei:** `src/components/ui/select.tsx`
- `h-10`, `rounded-2xl` -- gleiche Probleme wie Input
- **Loesung:** `h-8`, `rounded-md`, passend zum neuen Input

### 3. Textarea-Komponente: Anderer Stil als Input
**Datei:** `src/components/ui/textarea.tsx`
- `rounded-md`, `border border-input`, `bg-background` -- komplett anderer Stil als Input
- **Loesung:** Angleichen an neuen Input-Stil

### 4. MOD-07 Selbstauskunft (SelbstauskunftFormV2 + ApplicantPersonFields): Volle Eingabefelder
**Dateien:**
- `src/components/finanzierung/SelbstauskunftFormV2.tsx`
- `src/components/finanzierung/ApplicantPersonFields.tsx`
- Verwendet `grid-cols-4 gap-4` mit Label-ueber-Input
- Grosse Sektions-Header mit Icons und Nummern-Kreise
- **Loesung:** Umstellen auf tabellarisches Pattern (Table mit Label | Wert Zeilen)

### 5. MOD-07 Finanzierungsanfrage (AnfrageFormV2.tsx): Volle Eingabefelder
**Datei:** `src/components/finanzierung/AnfrageFormV2.tsx`
- Eigene `FormField`, `CurrencyInput`, `PercentInput` Komponenten
- Sektions-Header mit Buchstaben-Badges (A, B, C, D)
- `max-w-4xl` -- weicht von `max-w-7xl` Standard ab
- **Loesung:** Tabellarisch umstellen, max-w-7xl

### 6. Kontakte-Dialog (KontakteTab.tsx): Verteilte Felder im Dialog
**Datei:** `src/pages/portal/office/KontakteTab.tsx`
- `ContactFormFields` nutzt `Label + Input` mit `space-y-2` und `grid-cols-2 gap-4`
- Sektions-Header `h4 text-sm`
- Im Drawer und Create-Dialog verwendet
- **Bewertung:** Akzeptabel fuer Dialoge, aber Drawer-Bearbeitung koennte tabellarischer sein

### 7. Stammdaten ProfilTab: Widget-Karten mit Eingaben
**Datei:** `src/pages/portal/stammdaten/ProfilTab.tsx`
- Nutzt `ProfileWidget` Cards mit `FormSection/FormRow/FormInput`
- `grid-cols-2` Layout in Cards
- **Bewertung:** Akzeptabel -- Widget-Karten-Ansatz passt zum Profil-Kontext

### 8. ProjekteDashboard: Dialog-Eingabe
**Datei:** `src/pages/portal/projekte/ProjekteDashboard.tsx`
- `grid gap-4 md:grid-cols-2` mit `Label + Input` in Dialogen
- **Bewertung:** Akzeptabel -- Dialoge sind weniger kritisch

## Aenderungsplan

### Schritt 1: UI-Komponenten schlanker machen (3 Dateien)

**1a. Input.tsx** -- Schlanker, tabellarischer
- Von: `h-10 rounded-2xl text-base bg-muted/60 shadow-[inset...]`
- Zu: `h-8 rounded-md text-sm bg-muted/40 border border-border/50`
- Entfernung des inset-shadows und backdrop-blur

**1b. Select.tsx (SelectTrigger)** -- Angleichen an Input
- Von: `h-10 rounded-2xl bg-muted/60 backdrop-blur-sm`
- Zu: `h-8 rounded-md bg-muted/40 border border-border/50`

**1c. Textarea.tsx** -- Angleichen an Input
- Von: `rounded-md border border-input bg-background`
- Zu: `rounded-md bg-muted/40 border border-border/50`

### Schritt 2: MOD-07 Selbstauskunft tabellarisch umbauen (2 Dateien)

**2a. ApplicantPersonFields.tsx** -- Kern-Refaktor
- Umstellung von `grid-cols-4 gap-4` mit einzelnen `FormField > Label > Input`
- Zu: `Table > TableBody` mit `TableRow > TableCell(label) | TableCell(input)`
- Jede Sektion (Person, Employment, Bank, Income, Expenses, Assets) wird eine kompakte Tabelle
- Labels links (`w-[180px]`, `text-xs`, `text-muted-foreground`, `border-r`)
- Werte rechts (`text-sm`, Input mit `h-6 border-0 bg-transparent`)
- Pattern identisch zu FMFallDetail.tsx `TR`-Funktion

**2b. SelbstauskunftFormV2.tsx** -- Layout vereinfachen
- Sektions-Header: Nummern-Kreise bleiben, aber kleiner (`w-7 h-7` statt `w-10 h-10`)
- `Card > CardContent` bleibt, aber innen tabellarisch statt Grid
- Abstaende reduzieren: `space-y-4` statt `space-y-8`

### Schritt 3: MOD-07 AnfrageFormV2 tabellarisch umbauen (1 Datei)

**3a. AnfrageFormV2.tsx**
- `max-w-4xl` zu `max-w-7xl`
- Sektionen (Vorhaben, Objektdaten, Kosten, Finanzierungsplan) als Tabellen
- SectionHeader bleibt, aber kompakter
- FormField/CurrencyInput/PercentInput intern auf Table-Zeilen umstellen

### Schritt 4: Kontakt-Bearbeitung im Drawer verbessern (1 Datei)

**4a. KontakteTab.tsx -- ContactFormFields**
- Drawer-Ansicht: Tabellarisches Layout (Table mit Label | Input)
- Dialog-Ansicht: Kann bleiben (Erstellen-Dialog ist weniger kritisch)

### Schritt 5: FormSection-Shared-Komponente aktualisieren (1 Datei)

**5a. FormSection.tsx**
- `FormSection.title`: von `text-lg` zu `text-sm font-semibold uppercase`
- `FormRow`: Beibehalten fuer Stellen, wo Grid-Layout passend ist (Profil, Dialoge)

## Zusammenfassung betroffene Dateien

| # | Datei | Art der Aenderung |
|---|---|---|
| 1 | `src/components/ui/input.tsx` | h-10 -> h-8, rounded-2xl -> rounded-md, text-base -> text-sm |
| 2 | `src/components/ui/select.tsx` | SelectTrigger: h-10 -> h-8, rounded-2xl -> rounded-md |
| 3 | `src/components/ui/textarea.tsx` | Stil angleichen an neuen Input |
| 4 | `src/components/finanzierung/ApplicantPersonFields.tsx` | Grid -> Tabellarisch (Table/TR-Pattern) |
| 5 | `src/components/finanzierung/SelbstauskunftFormV2.tsx` | Layout kompakter, Sektions-Header kleiner |
| 6 | `src/components/finanzierung/AnfrageFormV2.tsx` | max-w-4xl -> max-w-7xl, Formularfelder tabellarisch |
| 7 | `src/pages/portal/office/KontakteTab.tsx` | Drawer-Ansicht tabellarisch |
| 8 | `src/components/shared/FormSection.tsx` | Title-Groesse reduzieren |

## Keine Aenderung bei diesen Seiten (bereits gut)

- FMFallDetail.tsx Selbstauskunft-Tab (Bank-Tabellen-Pattern -- Referenz)
- DataTable-basierte Ansichten (ObjekteTab, AnfragenTab, etc.)
- ProfilTab/Stammdaten (Widget-Cards sind fuer Profil-Editing akzeptabel)
- Dialoge generell (Erstellen-Formulare in Dialogen sind weniger kritisch)

## Reihenfolge

1. **Schritt 1** (UI-Komponenten) -- betrifft das gesamte System, sofortiger Impact
2. **Schritt 2** (MOD-07 Selbstauskunft) -- groesstes Formular, hoechste Prioritaet
3. **Schritt 3** (MOD-07 Anfrage) -- Finanzierungsformular
4. **Schritt 4+5** (Kontakte + FormSection) -- Feinschliff

## Keine DB-Aenderungen noetig

Alle Aenderungen sind rein visuell (CSS/Tailwind-Klassen und Layout-Struktur).
