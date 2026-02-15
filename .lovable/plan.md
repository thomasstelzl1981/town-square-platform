
# NK-Abrechnung: Immer-sichtbares Formular + Demo-Hausgeldabrechnungen

## Problem

Die NK-Abrechnung zeigt aktuell "Keine Kostenpositionen" wenn keine Daten geladen werden koennen oder der Readiness-Check fehlschlaegt. Der User will: **Das komplette Formular ist IMMER sichtbar** — wie bei der Selbstauskunft — mit allen Positionen einer Hausgeldeinzelabrechnung, vorausgefuellt oder leer/null.

## Ursachen

1. **Readiness-Gate blockiert UI**: Zeile 121-131 in NKAbrechnungTab versteckt den gesamten Inhalt hinter einem Readiness-Check. Wenn Blocker existieren, sieht der User nur eine Fehlermeldung statt des Formulars.
2. **Leeres Formular bei fehlenden Daten**: Zeile 155-158 zeigt nur "Keine Kostenpositionen" wenn keine Cost-Items aus der DB kommen, statt ein leeres Template anzuzeigen.
3. **Keine Demo-Hausgeldabrechnungen im Posteingang**: Die WEG-Dokumente existieren als `document_links` mit `doc_type: WEG_JAHRESABRECHNUNG`, aber es fehlen sichtbare Posteingangs-Eintraege, die den Empfang per E-Mail simulieren.

## Loesung

### 1. Hausgeld-Template definieren (neue Datei)

Neue Datei `src/engines/nkAbrechnung/hausgeldTemplate.ts`:

Enthaelt eine vollstaendige Liste aller Standard-Positionen einer Hausgeldeinzelabrechnung (BetrKV §2):

| Position | Schluessel | Umlagefaehig |
|----------|------------|--------------|
| Grundsteuer | MEA | ja |
| Wasserversorgung | Personen | ja |
| Entwaesserung | Personen | ja |
| Muellbeseitigung | Personen | ja |
| Strassenreinigung | Flaeche | ja |
| Gebaeudereinigung | Flaeche | ja |
| Gebaeudeversicherung | MEA | ja |
| Schornsteinfeger | Einheiten | ja |
| Allgemeinstrom | MEA | ja |
| Gartenpflege | Flaeche | ja |
| Hausmeister | MEA | ja |
| Aufzug | MEA | ja |
| Antenne/Kabel | Einheiten | ja |
| Sonstige Betriebskosten | MEA | ja |
| Verwaltungskosten | MEA | nein |
| Instandhaltungsruecklage | MEA | nein |

Jede Position hat: `categoryCode`, `labelDisplay`, `keyType`, `isApportionable`, `sortOrder`, Default-Werte 0.

### 2. Hook erweitern (`useNKAbrechnung.ts`)

- **Merge-Logik**: Nach dem Laden der DB-Daten wird das Template mit den geladenen Werten zusammengefuehrt. DB-Werte ueberschreiben Template-Defaults. Fehlende Kategorien werden mit 0-Werten angezeigt.
- **Auto-Create**: Wenn keine `nk_period` existiert, wird beim ersten Speichern automatisch eine neue Periode + Cost-Items angelegt.
- **Kein Gate mehr**: `canCalculate` bleibt fuer den Engine-Button relevant, aber das Formular ist IMMER sichtbar und editierbar.

### 3. UI umbauen (`NKAbrechnungTab.tsx`)

- **Readiness-Blocker entfernen**: Die Alert-Box mit "Fehlende Voraussetzungen" wird zu einem Info-Banner degradiert (nicht blockierend).
- **Formular immer rendern**: Alle 5 Sektionen sind IMMER sichtbar, auch wenn noch keine Daten vorhanden sind.
- **Dokumenten-Status als Info-Zeile**: Zeigt an, ob WEG-Abrechnung/Grundsteuerbescheid eingegangen sind, blockiert aber nichts.
- **Leere Felder editierbar**: Wenn keine Daten aus dem Posteingang extrahiert wurden, stehen alle Felder auf 0 und koennen manuell befuellt werden.

### 4. Demo-Hausgeldabrechnungen im Posteingang (DB-Migration)

Fuer alle 3 Immobilien wird je ein Dokument als "Hausgeldeinzelabrechnung 2025" im Posteingang angelegt:

- Dokument-Typ: `WEG_JAHRESABRECHNUNG` (bereits vorhanden als `f0000000-...01/02/03`)
- Diese Dokumente erhalten ein `sidecar_json` mit simulierten Extraktionsdaten
- Verknuepfung mit den jeweiligen `inbox_sort_containers` (BER-01, MUC-02, HH-03)
- `source: 'email'` um E-Mail-Eingang zu simulieren

Die bestehenden 6 Dokumente (3x WEG, 3x Grundsteuer) sind bereits korrekt verknuepft und haben `review_state: approved`. Sie erhalten zusaetzlich `source: 'email'` und ein `ai_summary` Feld mit einer kurzen Beschreibung.

### 5. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/engines/nkAbrechnung/hausgeldTemplate.ts` | NEU: Standard-Positionen Template |
| `src/hooks/useNKAbrechnung.ts` | Merge-Logik Template + DB, Auto-Create Period |
| `src/components/portfolio/NKAbrechnungTab.tsx` | Readiness-Gate entfernen, immer alle Sektionen zeigen |
| DB-Migration | `source` + `ai_summary` fuer Demo-Dokumente setzen |

### 6. Erwartetes Ergebnis

Beim Oeffnen der NK-Abrechnung fuer jede Immobilie sieht der User sofort:
- Sektion 1: Vollstaendige Hausgeldabrechnung mit allen 16 Positionen, vorausgefuellt mit Demo-Daten
- Sektion 2: Grundsteuer mit Werten aus dem Bescheid
- Sektion 3: Mieteinnahmen aus dem Lease
- Sektion 4: Live-Berechnung des Saldos
- Sektion 5: Export-Buttons

Alle Felder sind editierbar, Aenderungen speicherbar. Der Prozess ist von oben bis unten durchklickbar.
