

# Plan: Katalog-Ausschlussfunktion wieder sichtbar machen

## Analyse

Die Exclusion-Logik ist vollstaendig implementiert:

- **Hook `usePartnerListingSelections.ts`:** Funktioniert korrekt. `useToggleExclusion()` schreibt in die Tabelle `partner_listing_selections`. `is_active=true` bedeutet "ausgeblendet".
- **BeratungTab.tsx (Zeile 132-135):** Liest `excludedIds` und filtert ausgeblendete Objekte korrekt aus den Suchergebnissen heraus.
- **KatalogTab.tsx (Zeile 85):** `// Exclusions removed` — Die UI zum Ausblenden wurde entfernt. Es gibt aktuell keine Moeglichkeit, Objekte zu markieren.

Das heisst: Die Backend-Logik funktioniert, aber der Berater hat keinen Button/Toggle um sie zu benutzen.

---

## Loesung

### KatalogTab.tsx: Exclusion-Spalte hinzufuegen

Eine neue Spalte in der PropertyTable mit einem Toggle-Icon (Auge-auf/Auge-zu):

| Was | Details |
|---|---|
| Neue Spalte | "Sichtbar" als erste oder letzte Spalte in der Tabelle |
| Icon | `Eye` (sichtbar) / `EyeOff` (ausgeblendet) — klickbar |
| Verhalten | Klick auf Eye → Objekt wird in BeratungTab ausgeblendet, Zeile in KatalogTab wird visuell abgedimmt |
| Hook | `usePartnerSelections()` + `useToggleExclusion()` — bereits vorhanden |
| Visueller Hinweis | Ausgeblendete Zeilen erhalten `opacity-50` und einen roten `EyeOff`-Icon |
| Info-Text | Ueber der Tabelle ein kurzer Hinweis: "Objekte mit geschlossenem Auge werden in der Kundenberatung nicht angezeigt" |

### Zusaetzlich: Zaehler im Header

Der bestehende Badge-Text `X Objekte im Katalog` wird erweitert um die Exclusion-Anzahl:
- z.B. "24 Objekte im Katalog · 3 ausgeblendet"

### Keine Aenderung an BeratungTab

BeratungTab filtert bereits korrekt nach `excludedIds`. Sobald der Katalog die Toggle-Funktion wieder hat, wirkt sich das automatisch auf die Beratungssuche aus.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/vertriebspartner/KatalogTab.tsx` | Exclusion-Spalte + Hook-Integration + visuelles Feedback |

Keine DB-Migration noetig. Keine neue Datei noetig. Die Tabelle `partner_listing_selections` und alle RLS-Policies existieren bereits.

