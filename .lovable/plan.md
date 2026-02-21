

# Armstrong Erweiterung: Sprint 1-4 -- Wissen, Actions, ChipBar, Z3-Vertiefung

## Voraussetzungen

- **MOD-02 UNFREEZE**: User hat bestaetigt. `modules_freeze.json` wird temporaer auf `frozen: false` gesetzt fuer ArmstrongChipBar.tsx.
- armstrongManifest.ts und Edge Function sind nicht modul-gebunden -- frei editierbar.

## IST-Zustand

| Bereich | Status |
|---|---|
| KB-Artikel | 62 vorhanden (12 real_estate, 8 finance, 6 photovoltaik, 20 sales, 10 system, 4 tax_legal, 2 templates) |
| Module ohne Actions | MOD-15 (Fortbildung), MOD-22 (PetManager) -- MOD-21 hat bereits 10 ARM.BROWSER.* Actions |
| ChipBar-Abdeckung | 10 Module haben Chips, 12 Module ohne Chips |
| Z3 Prompts | Kaufy, FutureRoom, SoT vorhanden, aber ohne Einwandbehandlung/Vertiefung |

---

## Sprint 1: Wissen (20 neue KB-Artikel via DB-Inserts)

Keine Code-Aenderungen. 20 neue Artikel in `armstrong_knowledge_items` einfuegen.

### Kapitalanlage-Grundwissen (8 Artikel)
| item_code | category | subcategory | title_de |
|---|---|---|---|
| KB.INV.001 | investment | basics | Warum Immobilien als Kapitalanlage? |
| KB.INV.002 | investment | basics | Rendite-Dreieck: Brutto, Netto, EK-Rendite |
| KB.INV.003 | investment | basics | Hebelwirkung (Leverage-Effekt) einfach erklaert |
| KB.INV.004 | investment | tax | Steuervorteile: AfA, Werbungskosten, Zinsabzug |
| KB.INV.005 | investment | basics | Inflationsschutz durch Sachwerte |
| KB.INV.006 | investment | basics | Mietrendite vs. Wertsteigerung |
| KB.INV.007 | investment | strategy | Vermoegensspirale: Aufbau ueber mehrere Objekte |
| KB.INV.008 | investment | comparison | Vergleich: Immobilie vs. ETF vs. Festgeld vs. Gold |

### Finanzierungs-Vertiefung (6 Artikel, ergaenzend zu KB.FIN.001-008)
| item_code | category | subcategory | title_de |
|---|---|---|---|
| KB.FIN.009 | finance | strategy | Sondertilgung: Wann lohnt sie sich? |
| KB.FIN.010 | finance | strategy | Forward-Darlehen: Absicherung gegen Zinssteigerung |
| KB.FIN.011 | finance | basics | Eigenkapital: Minimum, Optimum, Strategien |
| KB.FIN.012 | finance | basics | Zinsbindung: 5, 10, 15, 20 Jahre -- Vor- und Nachteile |
| KB.FIN.013 | finance | analysis | Haushaltsrechnung: So kalkulieren Banken |
| KB.FIN.014 | finance | basics | KfW-Foerderung: Was Investoren wissen muessen |

### Standort- und Marktwissen (4 Artikel)
| item_code | category | subcategory | title_de |
|---|---|---|---|
| KB.MKT.001 | real_estate | market | A-, B-, C-Lagen erklaert |
| KB.MKT.002 | real_estate | market | Demografischer Wandel und Immobilienmarkt |
| KB.MKT.003 | real_estate | market | Mietspiegel und Vergleichsmiete verstehen |
| KB.MKT.004 | real_estate | market | Leerstandsquoten Deutschland: Ost vs. West |

### Einwandbehandlung (2 Artikel fuer Z3-Vertiefung)
| item_code | category | subcategory | title_de |
|---|---|---|---|
| KB.OBJ.001 | sales | objections | "Schulden sind doch schlecht" -- Leverage-Effekt erklaeren |
| KB.OBJ.002 | sales | objections | "ETF ist besser als Immobilien" -- Zahlenbasierter Vergleich |

Jeder Artikel wird als SQL INSERT mit:
- `scope: 'global'`, `status: 'published'`, `confidence: 'high'`
- `content_type: 'article'`, `version: '1.0.0'`
- Inhalt: 200-400 Woerter, praxisnah, positiv, mit Disclaimer wo noetig

---

## Sprint 2: Fehlende Actions (armstrongManifest.ts + Edge Function)

### 2a: Neue Action-Definitionen im Manifest (8 Actions)

| Action Code | Modul | execution_mode | cost_model |
|---|---|---|---|
| ARM.MOD15.EXPLAIN_MODULE | MOD-15 | readonly | free |
| ARM.MOD15.RECOMMEND_COURSE | MOD-15 | readonly | free |
| ARM.MOD15.TRACK_PROGRESS | MOD-15 | readonly | free |
| ARM.MOD22.EXPLAIN_MODULE | MOD-22 | readonly | free |
| ARM.MOD22.VIEW_PIPELINE | MOD-22 | readonly | free |
| ARM.MOD22.DRAFT_CUSTOMER_EMAIL | MOD-22 | draft_only | free |
| ARM.MOD01.EXPLAIN_MODULE | MOD-01 | readonly | free |
| ARM.MOD01.CHECK_COMPLETENESS | MOD-01 | readonly | free |

MOD-20 hat bereits `ARM.MOD20.MAGIC_INTAKE_CONTRACT`. Neue readonly Actions:
| ARM.MOD20.EXPLAIN_MODULE | MOD-20 | readonly | free |
| ARM.MOD20.EXPLAIN_RIGHTS | MOD-20 | readonly | free |
| ARM.MOD20.CHECK_NK | MOD-20 | readonly | free |

MOD-21 hat bereits 10 ARM.BROWSER.* Actions -- keine neuen noetig.

### 2b: MVP_EXECUTABLE_ACTIONS in Edge Function erweitern

Alle neuen readonly/draft_only Actions zur Liste hinzufuegen:
```text
ARM.MOD15.EXPLAIN_MODULE
ARM.MOD15.RECOMMEND_COURSE
ARM.MOD15.TRACK_PROGRESS
ARM.MOD22.EXPLAIN_MODULE
ARM.MOD22.VIEW_PIPELINE
ARM.MOD22.DRAFT_CUSTOMER_EMAIL
ARM.MOD01.EXPLAIN_MODULE
ARM.MOD01.CHECK_COMPLETENESS
ARM.MOD20.EXPLAIN_MODULE
ARM.MOD20.EXPLAIN_RIGHTS
ARM.MOD20.CHECK_NK
```

### 2c: Neue Action Cases im executeAction-Block

Die meisten neuen Actions sind `readonly` und liefern statischen Erklaerungstext. Nur `ARM.MOD22.DRAFT_CUSTOMER_EMAIL` und `ARM.MOD20.CHECK_NK` benoetigen etwas Logik:

- **EXPLAIN_MODULE Actions** (MOD-15, MOD-22, MOD-01, MOD-20): Geben eine strukturierte Modulbeschreibung zurueck
- **ARM.MOD15.RECOMMEND_COURSE**: Readonly -- gibt allgemeine Kursempfehlungen
- **ARM.MOD15.TRACK_PROGRESS**: Readonly -- Hinweis auf Fortbildungs-Dashboard
- **ARM.MOD22.VIEW_PIPELINE**: Readonly -- Hinweis auf PetManager-Pipeline
- **ARM.MOD22.DRAFT_CUSTOMER_EMAIL**: Draft-only -- gibt ein E-Mail-Template zurueck
- **ARM.MOD20.EXPLAIN_RIGHTS**: Readonly -- Mieterrechte-Ueberblick
- **ARM.MOD20.CHECK_NK**: Readonly -- Nebenkosten-Prueflogik erklaeren
- **ARM.MOD01.CHECK_COMPLETENESS**: Readonly -- Profil-Vollstaendigkeits-Hinweise

---

## Sprint 3: ChipBar-Erweiterung (ArmstrongChipBar.tsx)

Erfordert **UNFREEZE MOD-02**.

9 neue Module in `MODULE_CHIPS` hinzufuegen:

```text
MOD-00: Morgen-Briefing, Aufgabe erstellen, Notiz erstellen
MOD-01: Profil-Vollstaendigkeit, Modul erklaeren
MOD-03: Dokument suchen, Upload erklaeren
MOD-05: Modul erklaeren
MOD-06: Modul erklaeren
MOD-09: Modul erklaeren
MOD-10: Modul erklaeren
MOD-14: Rechercheauftrag erstellen
MOD-15: Kurs empfehlen, Modul erklaeren
MOD-20: NK pruefen, Vertrag aus Dokument
MOD-22: Pipeline anzeigen, Modul erklaeren
```

---

## Sprint 4: Zone 3 Vertiefung (Edge Function)

### 4a: Kaufy System Prompt erweitern

Den bestehenden `KAUFY_IMMO_ADVISOR_PROMPT` um einen neuen Block `EINWANDBEHANDLUNG` ergaenzen:
- "Schulden sind schlecht" → Leverage-Effekt, nominale Schuld vs. Realwert
- "ETF ist besser" → Zahlenbasierter Vergleich: Hebel, Steuereffekt, Cashflow
- "Immobilien sind riskant" → Risikovergleich: Klumpen vs. Diversifikation, Nutzwert

### 4b: FutureRoom System Prompt erweitern

Zusaetzliche Vertiefungsmodule:
- Nachfass-Fragen nach Quick-Check (Objekttyp, Zeitrahmen)
- Unterlagen-Erklaerung (Warum braucht die Bank diese Dokumente?)
- Ablauf-Transparenz (Was passiert nach der Anfrage? Zeitstrahl)

### 4c: SoT System Prompt erweitern

Zusaetzliche Module:
- Branchen-Personas (Makler, Finanzberater, Investor, Bautraeger, Verwalter) mit spezifischen Modul-Sets
- Live-Kalkulation (Einsparungspotenzial: Zeit + Kosten)
- Vergleich zum Status Quo ("Wie machen Sie das heute?" → SoT-Loesung)

---

## Phase 7 (nach Sprint 4): Re-Freeze MOD-02

`modules_freeze.json`: MOD-02 zurueck auf `frozen: true`.

---

## Betroffene Dateien

| Datei | Sprint | Aenderung |
|---|---|---|
| spec/current/00_frozen/modules_freeze.json | Pre/Post | MOD-02 unfreeze/refreeze |
| Datenbank (armstrong_knowledge_items) | S1 | 20 neue KB-Artikel als SQL Inserts |
| src/manifests/armstrongManifest.ts | S2 | 11 neue Action-Definitionen |
| supabase/functions/sot-armstrong-advisor/index.ts | S2, S4 | 11 neue executeAction Cases + MVP_EXECUTABLE + Prompt-Erweiterung |
| src/components/chat/ArmstrongChipBar.tsx | S3 | 11 neue MODULE_CHIPS Eintraege (MOD-02) |

## Reihenfolge

1. modules_freeze.json: MOD-02 unfreeze
2. DB-Migration: 20 KB-Artikel einfuegen (Sprint 1)
3. armstrongManifest.ts: 11 neue Actions (Sprint 2)
4. sot-armstrong-advisor/index.ts: MVP_EXECUTABLE + 11 Action Cases (Sprint 2)
5. ArmstrongChipBar.tsx: 11 neue Chip-Sets (Sprint 3)
6. sot-armstrong-advisor/index.ts: 3 System-Prompts erweitern (Sprint 4)
7. Edge Function deployen
8. modules_freeze.json: MOD-02 refreeze

