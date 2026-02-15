

# Demo-Daten fuer NK-Abrechnung Engine + Kontobewegungen

## Ueberblick

Auf Basis der fertiggestellten Engine-SPEC werden jetzt die Demo-Daten angelegt, die den End-to-End-Flow ermoeglichen: Dokument im DMS → Readiness-Check gruen → Berechnung → PDF-Export.

---

## Teil 1: Demo NK-Perioden und Cost Items (DB-Seed)

Fuer jede der 3 Demo-Properties wird eine `nk_periods`-Zeile fuer 2025 angelegt, plus je 8-10 `nk_cost_items` (extrahierte Positionen aus der WEG-Abrechnung + Grundsteuerbescheid).

### nk_periods (3 Eintraege)

| property_id | period_start | period_end | status | allocation_key_default |
|-------------|-------------|------------|--------|----------------------|
| BER-01 | 2025-01-01 | 2025-12-31 | confirmed | mea |
| MUC-01 | 2025-01-01 | 2025-12-31 | confirmed | mea |
| HH-01 | 2025-01-01 | 2025-12-31 | confirmed | mea |

### nk_cost_items pro Property (Beispiel BER-01, 85 m2)

| category_code | label_display | amount_total_house | amount_unit | key_type | is_apportionable |
|--------------|---------------|-------------------|-------------|----------|-----------------|
| grundsteuer | Grundsteuer | 2.400 | 205,20 | mea | true |
| wasser | Wasserversorgung | 3.200 | 360,00 | persons | true |
| abwasser | Entwaesserung | 1.800 | 202,50 | persons | true |
| muell | Muellbeseitigung | 1.600 | 180,00 | persons | true |
| strassenreinigung | Strassenreinigung | 950 | 85,00 | area_sqm | true |
| gebaeudereinigung | Gebaeudereinigung | 2.400 | 204,00 | area_sqm | true |
| sachversicherung | Gebaeudeversicherung | 3.000 | 255,00 | mea | true |
| schornsteinfeger | Schornsteinfeger | 1.100 | 95,00 | unit_count | true |
| beleuchtung | Allgemeinstrom | 1.200 | 102,00 | mea | true |
| verwaltung | Verwaltungskosten | 3.600 | 306,00 | mea | false |
| ruecklage | Instandhaltungsruecklage | 4.800 | 408,00 | mea | false |

Analoge Positionen fuer MUC-01 (72 m2) und HH-01 (45 m2) mit proportional angepassten Betraegen.

### Erwartete Ergebnisse pro Mieter

| Wohnung | Summe umlagefaehig | NK-VZ (12x) | Heiz-VZ (12x) | Gesamt VZ | Saldo |
|---------|-------------------|-------------|---------------|-----------|-------|
| BER-01 | ~1.688,70 | 2.160 | 1.440 | 3.600 | ~-1.911 (Guthaben) |
| MUC-01 | ~1.430,00 | 2.640 | 1.320 | 3.960 | ~-2.530 (Guthaben) |
| HH-01 | ~893,00 | 1.440 | 600 | 2.040 | ~-1.147 (Guthaben) |

---

## Teil 2: Demo-Dokumente im DMS

Fuer den Readiness-Check muessen zugeordnete Dokumente existieren:

### documents (6 Eintraege)

| doc_type | Beschreibung | extraction_status | review_state |
|----------|-------------|-------------------|-------------|
| WEG_JAHRESABRECHNUNG | WEG-Abrechnung BER-01 2025 | completed | approved |
| WEG_JAHRESABRECHNUNG | WEG-Abrechnung MUC-01 2025 | completed | approved |
| WEG_JAHRESABRECHNUNG | WEG-Abrechnung HH-01 2025 | completed | approved |
| GRUNDSTEUER_BESCHEID | Grundsteuerbescheid BER-01 | completed | approved |
| GRUNDSTEUER_BESCHEID | Grundsteuerbescheid MUC-01 | completed | approved |
| GRUNDSTEUER_BESCHEID | Grundsteuerbescheid HH-01 | completed | approved |

### document_links (6 Eintraege)

Jedes Dokument wird mit `object_type='property'` und `link_status='accepted'` der entsprechenden Property zugeordnet.

---

## Teil 3: Readiness-Check Anpassung

Der aktuelle `readinessCheck.ts` hat ein Problem: Er filtert nicht nach `doc_type` bei der document_links-Abfrage. Er findet zwar Links zur Property, aber prueft nicht ob es WEG_JAHRESABRECHNUNG oder GRUNDSTEUER_BESCHEID ist.

**Fix**: Die Query muss ueber einen JOIN auf `documents.doc_type` filtern, nicht nur auf `document_links.object_id`.

---

## Teil 4: Demo-Kontobewegungen (demoKontoData.ts)

Komplette Ueberarbeitung mit `buildDemoTransactions()` Generator:

### Monatliches Muster (Jan 2025 – Feb 2026 = 14 Monate)

Pro Monat 6 Buchungen:
- 3x Mieteingang (Warmmiete): +1.150 / +1.580 / +750
- 3x Hausgeld-Lastschrift: -380 / -450 / -250

### Quartalsweise Grundsteuer (Feb, Mai, Aug, Nov)

- BER-01: -130 (= 520/4)
- MUC-01: -160 (= 640/4)
- HH-01: -80 (= 320/4)

### Sonderbuchungen

- Nov 2025: Heizungsreparatur BER-01: -450 (Sondereigentum)

### Gesamt: ~97 Transaktionen

Saldo kumulativ ab Startsaldo 5.200,00 EUR berechnet, absteigend sortiert fuer Anzeige.

---

## Teil 5: Armstrong KB Update (optional)

Die 7 Eintraege in `armstrongNKKnowledge.ts` sind bereits angelegt. Falls Sie eigene Texte liefern, werden diese ersetzt. Andernfalls werden die bestehenden Eintraege als DB-Seed in `armstrong_knowledge_items` eingefuegt.

---

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/engines/nkAbrechnung/readinessCheck.ts` | Fix: doc_type-Filter beim Readiness-Check |
| `src/constants/demoKontoData.ts` | Komplett neu: buildDemoTransactions() mit 97 Buchungen |
| DB-Migration | Seed: nk_periods (3), nk_cost_items (~33), documents (6), document_links (6) |
| `src/constants/armstrongNKKnowledge.ts` | Optional: Ihre Texte einsetzen |

---

## Implementierungsreihenfolge

| Schritt | Was |
|---------|-----|
| 1 | DB-Migration: Demo-Seed (nk_periods, nk_cost_items, documents, document_links) |
| 2 | Fix readinessCheck.ts (doc_type-Filter) |
| 3 | buildDemoTransactions() in demoKontoData.ts |
| 4 | Funktionstest: NK-Abrechnung Tab auf BER-01 oeffnen, Readiness gruen, Berechnung starten |

