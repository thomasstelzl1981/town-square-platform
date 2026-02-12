
# Erweiterte Unterlagenliste und Einreichungs-Layout

## 1. Vollstaendige Unterlagen-Checkliste (nach KWG / Bankpraxis)

Die bisherigen 8 Ordner sind viel zu wenig. Basierend auf den Anforderungen deutscher Banken (Deutsche Bank, Sparkassen, ING, Schwaebisch Hall) wird die Ordnerstruktur auf ca. 20 Ordner erweitert, aufgeteilt nach Beschaeftigungsart.

### Neue CASE_FOLDERS-Struktur

**Sektion A: Persoenliche Unterlagen (immer)**

| # | Ordner | Required | Beispiel-Dokumente |
|---|--------|----------|--------------------|
| 01 | Personalausweis / Reisepass | 1 | Vorder-/Rueckseite, ggf. Aufenthaltstitel |
| 02 | Meldebescheinigung | 1 | Aktuelle Anmeldebescheinigung |
| 03 | Familienstandsnachweis | 1 | Heiratsurkunde, Scheidungsurteil, ggf. Ehevertrag |
| 04 | SCHUFA / Selbstauskunft | 1 | SCHUFA-BonitaetsAuskunft |

**Sektion B: Einkommensunterlagen — Angestellte**

| # | Ordner | Required | Beispiel-Dokumente |
|---|--------|----------|--------------------|
| 05 | Gehaltsabrechnungen | 3 | Letzte 3 Monate + Dezember-Abrechnung Vorjahr |
| 06 | Lohnsteuerbescheinigung | 1 | Letzte 1-2 Jahre |
| 07 | Arbeitsvertrag | 1 | Aktueller Arbeitsvertrag, ggf. Aenderungen |
| 08 | Einkommensteuerbescheide | 2 | Letzte 2 Jahre |

**Sektion C: Einkommensunterlagen — Selbststaendige / GmbH-GF**

| # | Ordner | Required | Beispiel-Dokumente |
|---|--------|----------|--------------------|
| 09 | Bilanzen / GuV | 3 | Letzte 2-3 Geschaeftsjahre (testiert) |
| 10 | BWA (aktuelle) | 1 | Betriebswirtschaftliche Auswertung lfd. Jahr |
| 11 | Steuerbescheide Firma | 2 | Einkommensteuer + Gewerbesteuer, letzte 2 Jahre |
| 12 | Gesellschaftsvertrag | 1 | GmbH-Vertrag, Handelsregisterauszug |
| 13 | Einkommensteuerbescheide privat | 2 | Letzte 2-3 Jahre |

**Sektion D: Vermoegen und Verbindlichkeiten**

| # | Ordner | Required | Beispiel-Dokumente |
|---|--------|----------|--------------------|
| 14 | Kontoauszuege / Eigenkapitalnachweis | 1 | Aktuell, Spar-/Depotauszuege, Bausparvertraege |
| 15 | Bestehende Darlehen | 1 | Aktuelle Saldenbestaetigung, Jahreskontenauszuege |
| 16 | Versicherungen | 1 | Lebensversicherung, Rentenversicherung |

**Sektion E: Objektunterlagen**

| # | Ordner | Required | Beispiel-Dokumente |
|---|--------|----------|--------------------|
| 17 | Expose / Kaufvertragsentwurf | 1 | Expose, Kaufvertrag-Entwurf vom Notar |
| 18 | Grundbuchauszug | 1 | Aktuell (nicht aelter als 3 Monate) |
| 19 | Grundrisse / Bauzeichnungen | 1 | Alle Geschosse, Schnitte |
| 20 | Flaechenberechnung | 1 | Wohnflaechenberechnung nach WoFlV |
| 21 | Baubeschreibung | 1 | Nur bei Neubau / Sanierung |
| 22 | Fotos | 1 | Innen, Aussen, Umgebung |
| 23 | Teilungserklaerung | 1 | Nur bei ETW: Teilungserklaerung + Gemeinschaftsordnung |
| 24 | Nebenkostenabrechnung / WEG-Protokolle | 1 | Letzte Hausgeldabrechnung, WEG-Beschluesse |

### Beschaeftigungstyp-Logik

Die Ordner-Sektionen B und C werden **bedingt angezeigt**, basierend auf dem `employment_type` des Antragstellers:

- `angestellt` → Sektion B sichtbar, C ausgeblendet
- `selbststaendig` → Sektion C sichtbar, B ausgeblendet
- `gmbh_gf` / `geschaeftsfuehrer` → Sektion B UND C sichtbar (doppelte Einkommensnachweise)
- Nicht gesetzt → Alle Sektionen sichtbar (konservativ)

### Umsetzung

**Datei: `src/components/finanzierung/CaseDocumentRoom.tsx`**

- `CASE_FOLDERS` wird erweitert auf die vollstaendige Liste (ca. 24 Ordner)
- Neue `section`-Werte: `persoenlich`, `einkommen_angestellt`, `einkommen_selbststaendig`, `vermoegen`, `objekt`
- Optionales `condition`-Feld pro Ordner (z.B. `only_etw`, `only_neubau`) fuer Sonderfaelle (Teilungserklaerung nur bei ETW)
- Neues Prop: `employmentType?: string` steuert, welche Sektionen gerendert werden

**Datei: `src/components/finanzierung/DocumentReadinessIndicator.tsx`** (wird angepasst)

- Zeigt dieselbe erweiterte Ordnerliste mit Ampelsystem
- Beruecksichtigt `employmentType` bei der Anzeige

## 2. Einreichungsseite: Workflow immer sichtbar

### Problem

Aktuell zeigt `FMEinreichung.tsx` nur die Widget-Karten. Der gesamte Workflow (Expose, Bankauswahl, E-Mail, Status) erscheint erst nach Klick auf ein Widget in der Detail-Seite.

### Loesung: Einreichungsseite als Master-Detail

Die Einreichungsseite wird umgebaut zu einem Split-Layout:

```text
+--- EINREICHUNG ---------------------------------------------------------+
| 3 Finanzierungsakten bereit zur Einreichung bei Banken.                 |
+--------------------------------------------------------------------------+
|                                                                          |
| [Widget 1] [Widget 2] [Widget 3]                    ← Case-Karten oben  |
|  Max M.     Eva S.     Karl B.                                           |
|  280k EUR   150k EUR   420k EUR                                          |
|  [aktiv]    [offen]    [offen]                                           |
|                                                                          |
+= WORKFLOW (immer sichtbar, befuellt sich bei Widget-Klick) =============+
|                                                                          |
| [Stepper: 1. Expose ✓ → 2. Bank → 3. E-Mail → 4. Status]              |
|                                                                          |
| +--- 1. Finanzierungs-Expose ──────────────────────────────────────────+|
| | (Leer-Zustand: "Bitte waehlen Sie oben eine Akte aus.")              ||
| | (Befuellt: Antragsteller, Darlehen, Objekt — wie bisher)            ||
| +----------------------------------------------------------------------+|
|                                                                          |
| +--- 2. Kanal & Bankauswahl ───────────────────────────────────────────+|
| | (Leer-Zustand: Bankauswahl disabled, Struktur sichtbar)             ||
| +----------------------------------------------------------------------+|
|                                                                          |
| +--- 3. E-Mail-Entwuerfe ─────────────────────────────────────────────+||
| | (Leer-Zustand: "Wird nach Bankauswahl verfuegbar")                  ||
| +----------------------------------------------------------------------+|
|                                                                          |
| +--- 4. Status & Ergebnis ────────────────────────────────────────────+||
| | (Leer-Zustand: Leere Tabelle mit Spaltenkoepfen)                    ||
| +----------------------------------------------------------------------+|
|                                                                          |
| ── Externe Software (Europace etc.) ──────────────────────────────────  |
| | Uebergabe an Drittsoftware — unten, separiert                       | |
+--------------------------------------------------------------------------+
```

### Verhalten

- **Kein Case ausgewaehlt**: Alle 4 Workflow-Karten sind sichtbar, aber im Leer-Zustand (keine leeren Felder — stattdessen Hinweis-Texte wie "Bitte waehlen Sie oben eine Akte aus")
- **Case ausgewaehlt**: Widget wird hervorgehoben (Border/Schatten), Workflow-Karten befuellen sich mit den Daten des Falls
- **Navigation**: Kein Seitenwechsel mehr — alles auf einer Seite. Die Detail-Route (`einreichung/:requestId`) wird beibehalten fuer Direktlinks, laedt dann die gleiche Seite mit vorausgewaehltem Case

### Umsetzung

**Datei: `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx`**

- Komplett-Umbau: Wird zum Master-Detail-Layout
- State: `selectedRequestId` steuert, welcher Fall aktiv ist
- Widgets oben: Klick setzt `selectedRequestId`
- Workflow-Sections darunter: Inline gerendert (nicht mehr als separate Route)
- Die gesamte Logik aus `FMEinreichungDetail.tsx` wird in `FMEinreichung.tsx` integriert (oder als inline-gerendertes Child)

**Datei: `src/pages/portal/finanzierungsmanager/FMEinreichungDetail.tsx`**

- Wird zu einer reinen Wrapper-Komponente, die `FMEinreichung` mit `initialSelectedId` rendert
- Oder: Wird geloescht und die Route leitet auf `FMEinreichung` mit Query-Param um

## 3. Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `CaseDocumentRoom.tsx` | CASE_FOLDERS auf ~24 Ordner erweitert, neue Sektionen, `employmentType`-Prop |
| `DocumentReadinessIndicator.tsx` | Angepasst an erweiterte Ordnerstruktur |
| `FMEinreichung.tsx` | Komplett-Umbau: Master-Detail mit Widgets oben, Workflow-Karten darunter |
| `FMEinreichungDetail.tsx` | Wird zu Redirect/Wrapper oder geloescht |
| `FinanzierungsmanagerPage.tsx` | Route-Anpassung falls noetig |

## 4. Keine Datenbank-Aenderungen

Die Ordnerstruktur ist frontends eitig hardcoded (wie bisher). Uploads landen in der bestehenden `storage_nodes`/`document_links`-Struktur. Die `finance_submission_logs`-Tabelle bleibt unveraendert.
