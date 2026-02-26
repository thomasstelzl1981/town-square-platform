

## Projektgesellschaft / Anbieter — Ueberarbeitung

### Analyse

3 Probleme identifiziert:

**1. Intake nutzt extrahierten `developer` nicht**
Die Edge Function `sot-project-intake` extrahiert `developer` (Bautraeger/Verkaeufer) aus dem Expose (Zeile 71), speichert es aber NICHT in den `developer_contexts`. Stattdessen wird einfach der erste vorhandene Kontext genommen oder ein generischer "Meine Gesellschaft GmbH" erstellt (Zeilen 628-648).

**2. Felder im DataSheet sind read-only**
Die aktuelle Anbieter-Sektion zeigt nur statischen Text — keine Eingabefelder. Jedes Projekt hat typischerweise eine eigene Projektgesellschaft, deren Daten direkt im DataSheet editierbar sein muessen.

**3. Daten fliessen nicht in Landing Page / Impressum**
Die `landing_pages` Tabelle hat `footer_company_name`, `footer_address`, `imprint_text` — diese werden aktuell nicht aus dem `developer_contexts` befuellt.

---

### Plan (3 Aufgaben)

#### 1. Edge Function: Developer-Context aus Expose befuellen

**Datei:** `supabase/functions/sot-project-intake/index.ts`

Statt den ersten beliebigen Kontext zu nehmen, soll der Intake:
- Wenn `reviewedData.developer` vorhanden: Suche nach `developer_contexts` mit passendem `name`
- Wenn nicht gefunden: NEUEN Kontext mit dem extrahierten Namen erstellen
- Wenn kein `developer` extrahiert: Fallback auf bestehenden Default-Kontext (bisheriges Verhalten)

So entsteht pro Bautraeger/Projektgesellschaft automatisch ein eigener Kontext-Record.

#### 2. DataSheet: Anbieter-Sektion editierbar machen

**Datei:** `src/components/projekte/ProjectDataSheet.tsx`

Die read-only Sektion ersetzen durch editierbare Felder:

| Feld | Input-Typ |
|------|-----------|
| Firma (Name + Rechtsform) | 2x Input nebeneinander |
| Geschaeftsfuehrer | Input |
| Strasse + Hausnummer | 2x Input |
| PLZ + Stadt | 2x Input |
| HRB-Nummer | Input |
| USt-ID | Input |

- Aenderungen werden direkt per `supabase.from('developer_contexts').update(...)` gespeichert (beim DataSheet-Save)
- `devContext` State wird von statischem `Record<string, any>` auf editierbaren State mit Settern umgestellt
- Bei Projekten ohne Context: "Projektgesellschaft anlegen" Button

#### 3. Landing Page: Impressum-Daten aus Developer Context laden

**Datei:** Betrifft die Landing-Page-Generierung — beim Erstellen/Aktualisieren der Landing Page werden `footer_company_name` und `footer_address` automatisch aus dem verknuepften `developer_contexts` befuellt. Dies ist eine Folgeanpassung fuer einen separaten Schritt, da es die Edge Function `sot-generate-landing-page` betrifft (INFRA-Freeze pruefen).

---

### Umsetzungsreihenfolge

| # | Aufgabe | Datei |
|---|---------|-------|
| 1 | Intake: Developer-Name aus Expose als neuen Kontext anlegen | `sot-project-intake/index.ts` |
| 2 | DataSheet: Anbieter-Felder editierbar + Save-Integration | `ProjectDataSheet.tsx` |
| 3 | Landing Page Impressum (Folgeschritt, Freeze pruefen) | separat |

