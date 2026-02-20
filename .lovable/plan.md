

# BWA & SuSa: Umbau auf echtes DATEV-Format (SKR04)

## Analyse: IST vs. SOLL

Die hochgeladene PDF zeigt die echte DATEV-BWA der "ZL Wohnbau GmbH". Unsere aktuelle Implementierung weicht in **Struktur, Kontenrahmen und Umfang** erheblich ab.

### Strukturelle Unterschiede

| Bereich | Unser IST (BWA-10 bis BWA-70) | DATEV SOLL (Kurzfristige Erfolgsrechnung) |
|---------|-------------------------------|-------------------------------------------|
| Ertraege | BWA-10 Mietertraege (4400/4410) | Umsatzerloese (4105 Steuerfreie Umsaetze V+V) |
| Zwischensummen | Nur Gesamtleistung | Gesamtleistung, Rohertrag, Betrieblicher Rohertrag |
| Kostenarten | Eigene Kategorien BWA-30..50 | DATEV-Standard: Raumkosten, Betr. Steuern, Versicherungen, Abschreibungen, Reparatur, Sonstige |
| Zinsen | In BWA-60 als Aufwand | **Separater Block "Neutrales Ergebnis"** (nach Betriebsergebnis!) |
| Abschreibungen | In BWA-70 (Kto 4830) | Innerhalb Gesamtkosten (Kto 6221, 6220, 6260) |
| Ergebnis | Nur Betriebsergebnis | Betriebsergebnis + Neutrales Ergebnis + Vorlaeufliges Ergebnis |
| Kennzahlen | Keine | % Ges.-Leistung, % Ges.-Kosten pro Zeile |
| Zinsen Detail | Ein Summenwert | **Pro Darlehen einzeln** (7321, 7322, 7323...) |
| SuSa | Nur P+L-Konten | **Alle Kontenklassen 0-9** (Anlagevermoegen, Bank, Darlehen, Eigenkapital, P+L) |

### SKR04-Konten: Korrektes Mapping

| DATEV-Konto | Bezeichnung | Unsere Datenquelle | Status |
|-------------|-------------|---------------------|--------|
| **Ertraege (Klasse 4)** | | | |
| 4105 | Steuerfreie Umsaetze V+V § 4 Nr. 12 UStG | leases.rent_cold_eur x 12 | UMBAU noetig (bisher 4400) |
| 4420 | NK-Vorauszahlungen | leases.nk_advance_eur x 12 | OK (wird zu Gesamtleistung addiert) |
| 4849 | Erloese Sachanlageverkauf (Buchgewinn) | Nicht verfuegbar | NEU - optional/manuell |
| 4970 | Versicherungsentschaedigung | vv_annual_data.income_insurance_payout | OK |
| 4975 | Investitionszuschuesse | Nicht verfuegbar | NEU - optional/manuell |
| **Kostenarten (Klasse 6)** | | | |
| 6221 | Abschreibungen auf Gebaeude | AfA-Engine (property_accounting) | UMBAU (bisher 4830) |
| 6220 | Abschreibungen auf Sachanlagen | Nicht separat erfasst | NEU - optional |
| 6260 | Sofortabschreibung GWG | Nicht erfasst | NEU - optional |
| 6325 | Gas, Strom, Wasser | nk_cost_items: wasser_abwasser + allgemeinstrom | UMBAU (bisher 6020/6070) |
| 6350 | Grundstuecksaufwendungen, betrieblich | nk_cost_items: gartenpflege + strassenreinigung | NEU - Zusammenfassung |
| 6400 | Versicherungen (allgemein) | nk_cost_items: haftpflicht | UMBAU |
| 6405 | Versicherung fuer Gebaeude | nk_cost_items: gebaeudeversicherung | UMBAU (bisher 6100) |
| 6420 | Beitraege | Nicht separat erfasst | NEU - optional/manuell |
| 6430 | Sonstige Abgaben | nk_cost_items: muell_entsorgung | UMBAU |
| 6490 | Sonstige Reparaturen u. Instandhaltungen | vv_annual_data.cost_maintenance | OK (bisher 6200) |
| 6825 | Rechts- und Beratungskosten | vv_annual_data.cost_legal_advisory | NEU (bisher 6320) |
| 6855 | Nebenkosten des Geldverkehrs | vv_annual_data.cost_bank_fees | OK (bisher 6330) |
| 6859 | Aufwand Abraum-/Abfallbeseitigung | nk_cost_items: muell_entsorgung (anteilig) | NEU |
| **Steuern (Klasse 7)** | | | |
| 7680 | Grundsteuer | nk_cost_items: grundsteuer | UMBAU (bisher 6000 in Klasse 6!) |
| 7310-73xx | Zinsaufwendungen **pro Darlehen** | property_financing (je Darlehen einzeln) | UMBAU (bisher ein Summenwert 7300) |

### SuSa: Fehlende Kontenklassen

Unsere SuSa zeigt aktuell NUR die Ertrags-/Aufwandskonten (Klasse 4+6+7). Die echte DATEV-SuSa umfasst:

| Klasse | Inhalt | Unsere Datenquelle | Status |
|--------|--------|---------------------|--------|
| 0 | Anlagevermoegen (Grundstuecke, Gebaeude, AfA) | properties.purchase_price, property_accounting.ak_building, cumulative_afa | **MACHBAR** |
| 1 | Umlaufvermoegen (Bankkonten, Forderungen) | bank_accounts (Saldo), offene Mietforderungen | **MACHBAR** |
| 2 | Eigenkapital (Stammkapital, Ruecklagen, Gewinnvortrag) | Nicht erfasst | MANUELL noetig |
| 3 | Verbindlichkeiten (Darlehen, Kautionen, Lieferanten) | property_financing.current_balance, leases.deposit_amount | **MACHBAR** |
| 4 | Ertraege | Leases + vv_annual_data | OK |
| 6 | Aufwendungen | NK + vv_annual_data + AfA | OK |
| 7 | Zinsen + Steuern | property_financing + nk_cost_items | OK |
| 9 | Saldenvortraege | Rechnerisch | MACHBAR |

---

## Umsetzungsplan

### Schritt 1: Kontenplan komplett umbauen

**Datei: `src/manifests/bwaKontenplan.ts`**

Statt der 7 eigenen Kategorien BWA-10..70 wird der **DATEV-Standard "Kurzfristige Erfolgsrechnung"** implementiert:

```text
LEISTUNG
  Umsatzerloese (4105)
  NK-Umlagen (4420)
  Gesamtleistung
  Material (leer bei Immo)
  Rohertrag
  So. betr. Erloese
  Betrieblicher Rohertrag

KOSTENARTEN
  Personalkosten (leer bei privat)
  Raumkosten (6325, 6350)
  Betriebliche Steuern (7680)
  Versicherungen/Beitraege (6400, 6405, 6420, 6430)
  Abschreibungen (6220, 6221, 6260)
  Reparatur/Instandhaltung (6490)
  Sonstige Kosten (6300, 6825, 6855, 6859)
  Gesamtkosten

ERGEBNIS
  Betriebsergebnis
  Zinsaufwand (7310, 7321, 7322... pro Darlehen)
  Sonstiger neutraler Aufwand
  Neutraler Aufwand
  Sonstiger neutraler Ertrag (4849, 4970, 4975)
  Neutraler Ertrag
  Ergebnis vor Steuern
  Vorlaeufliges Ergebnis
```

### Schritt 2: Engine-Types und Berechnung umbauen

**Datei: `src/engines/bewirtschaftung/bwaDatevSpec.ts`**
- `DatevBWAInput` erhaelt neue Felder: `darlehen: Array<{ id, name, zinsaufwand }>` statt eines Summenwerts
- Neue Sections fuer "Neutrales Ergebnis"
- `DatevBWAResult` erhaelt: `rohertrag`, `betrieblerRohertrag`, `neutralerAufwand`, `neutralerErtrag`, `ergebnisVorSteuern`, `vorlaeufligesErgebnis`
- Neue Kennzahlen: `umsatzrentabilitaet`, `handelsspanne`

**Datei: `src/engines/bewirtschaftung/bwaDatev.ts`**
- `calcDatevBWA()` komplett umgeschrieben auf DATEV-Struktur
- Zinsen **pro Darlehen** einzeln als Kontozeile (7321 "Zinsen Darlehen SPK-2018-0042", 7322 "Zinsen Darlehen HVB-2020-0815"...)
- NK-Kategorien auf korrekte SKR04-Konten gemappt (grundsteuer → 7680, nicht 6000)
- Abschreibungen in Klasse 6 (6221) statt Klasse 4 (4830)

### Schritt 3: SuSa auf alle Kontenklassen erweitern

**Datei: `src/engines/bewirtschaftung/bwaDatevSpec.ts`**
- `SuSaEntry` erhaelt `klasse: number` (0-9)
- `SuSaResult` erhaelt `summenProKlasse: Record<number, { soll, haben }>`

**Datei: `src/engines/bewirtschaftung/bwaDatev.ts`**
- `calcSuSa()` erzeugt zusaetzlich Bilanzkonten:
  - Klasse 0: Grundstuecke/Gebaeude (aus properties.purchase_price, property_accounting.ak_building, ak_ground, cumulative_afa)
  - Klasse 1: Bankkonten (aus bank_accounts Saldo, offene Mietforderungen)
  - Klasse 3: Darlehen (aus property_financing.current_balance), Kautionen (aus leases.deposit_amount)
  - Klasse 4+6+7: Aus BWA-Berechnung (wie bisher, aber mit korrekten Kontonummern)

### Schritt 4: BWATab.tsx komplett im DATEV-Layout

**Datei: `src/components/portfolio/BWATab.tsx`**
- Layout exakt wie PDF: Berichtsposition | Monat | Jan-Dez kumuliert
- Neue Spalten: "% Ges.-Leistg.", "% Ges.-Kosten"
- Klare Trennung: Leistung → Kostenarten → Betriebsergebnis → Neutrales Ergebnis → Vorl. Ergebnis
- SuSa-Ansicht mit Kontenklassen-Gruppierung (Klasse 0, 1, 2, 3, 4, 6, 7, 9)
- Jede Klasse mit Zwischensumme "Summe Klasse X"

### Schritt 5: BWATab Datenabfrage erweitern

**Datei: `src/components/portfolio/BWATab.tsx`** (Query-Teil)
- `property_financing` nicht mehr aggregiert, sondern **pro Darlehen einzeln** uebergeben mit bank_name und loan_number
- `bank_accounts` zusaetzlich abfragen fuer SuSa (Kontenklasse 1)
- `leases.deposit_amount` fuer Kautionen (Klasse 3)

---

## Was wir mit vorhandenen Daten abbilden koennen

| DATEV-Bereich | Abdeckung | Bemerkung |
|---------------|-----------|-----------|
| Umsatzerloese (V+V) | 100% | leases.rent_cold_eur |
| NK-Umlagen | 100% | leases.nk_advance_eur |
| Raumkosten | ~80% | nk_cost_items (Gas/Wasser/Strom via allgemeinstrom + wasser_abwasser) |
| Betr. Steuern (Grundsteuer) | 100% | nk_cost_items: grundsteuer |
| Versicherungen | 100% | nk_cost_items: gebaeudeversicherung + haftpflicht |
| Abschreibungen Gebaeude | 100% | AfA-Engine aus property_accounting |
| Abschreibungen Sachanlagen/GWG | 0% | Nicht erfasst — Zeile wird leer dargestellt |
| Reparatur/Instandhaltung | 100% | vv_annual_data.cost_maintenance |
| Sonstige Kosten (Beratung, Bank) | 100% | vv_annual_data.cost_legal_advisory + cost_bank_fees + cost_other |
| Zinsaufwand pro Darlehen | 100% | property_financing (3 Demo-Darlehen) |
| Neutraler Ertrag (Verkaeufe) | 0% | Nicht erfasst — Zeile wird leer dargestellt |
| SuSa Klasse 0 (Anlagevermoegen) | 90% | property_accounting.ak_building + ak_ground + cumulative_afa |
| SuSa Klasse 1 (Bankkonten) | 80% | bank_accounts vorhanden |
| SuSa Klasse 2 (Eigenkapital) | 0% | Nicht erfasst — Zeile bleibt leer |
| SuSa Klasse 3 (Darlehen) | 100% | property_financing.current_balance |

**Fazit**: ~85% des DATEV-Formats koennen wir mit vorhandenen Daten abbilden. Fehlende Zeilen (GWG, Personalkosten, Eigenkapital) werden korrekt mit 0,00 dargestellt — genau wie bei der echten ZL Wohnbau BWA, wo z.B. "Personalkosten" und "Material" auch 0,00 zeigen.

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/manifests/bwaKontenplan.ts` | UMGEBAUT: DATEV-Standard Kontenrahmen statt eigene Kategorien |
| `src/engines/bewirtschaftung/bwaDatevSpec.ts` | UMGEBAUT: Neue Types fuer DATEV-Vollformat |
| `src/engines/bewirtschaftung/bwaDatev.ts` | UMGEBAUT: Korrekte SKR04-Konten, Zinsen pro Darlehen, Neutrales Ergebnis |
| `src/components/portfolio/BWATab.tsx` | UMGEBAUT: DATEV-konformes Layout mit %-Spalten und Kontenklassen-SuSa |

