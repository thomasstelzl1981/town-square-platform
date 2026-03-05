

# Kontextbasiertes Modell-Routing: Indexierung vs. Engine-Verarbeitung

## Analyse: Was fehlt aktuell?

Das aktuelle Modell-Tiering waehlt das AI-Modell basierend auf **Dateieigenschaften** (Groesse, Dateiname). Es fehlt eine zweite Dimension: **Wozu wird das Dokument verarbeitet?**

```text
AKTUELL (eindimensional):                    NEU (zweidimensional):

Datei → selectModel(size, name) → Modell     Datei + ZWECK → selectModel() → Modell
                                              
Klein  → Flash Lite                          Indexierung + Klein  → Flash Lite ✓
Normal → Flash                               Indexierung + Normal → Flash Lite (!)
Komplex → Pro                                Indexierung + Komplex → Flash (!)
                                              
                                              Engine + Klein  → Flash
                                              Engine + Normal → Flash
                                              Engine + Komplex → Pro
```

## Die zwei Verarbeitungspfade

| Pfad | Zweck | Beispiel | Modell-Bedarf |
|------|-------|----------|--------------|
| **INDEX** | Armstrong findet und versteht Dokumente | Datenraum-Scan, Posteingang-Klassifizierung, Cloud-Sync | Flash Lite / Flash genuegt |
| **ENGINE** | Aktive Verarbeitung in Engines/Golden Paths | Immobilien-Parser, Finanzierungs-Extraktion, NK-Beleg-Parsing, Invoice-Parsing | Flash / Pro noetig |

### Warum das funktioniert

Beim **Indexieren** braucht Armstrong nur: Dokumenttyp, 5 Schluesselfelder, Zusammenfassung. Das kann Flash Lite zuverlaessig. Wenn Armstrong spaeter tiefere Details braucht, triggert er den On-Demand Deep-Extract (bereits implementiert).

Bei **Engine-Verarbeitung** (z.B. `sot-document-parser` mit parseMode `immobilie` oder `finanzierung`) muessen 15-30 strukturierte Felder praezise extrahiert werden — hier ist Flash oder Pro unverzichtbar.

## Technische Umsetzung

### 1. `sot-storage-extractor`: purpose-Parameter einfuehren

Der Extractor erhaelt einen neuen Parameter `purpose: 'index' | 'engine'` (Default: `'index'`).

- **`purpose: 'index'`** (Datenraum-Scan, Cloud-Sync, Posteingang-Erstklassifizierung):
  - `selectModel()` stuft alles eine Stufe herunter: Normal → Flash Lite, Komplex → Flash
  - Kein Pro-Modell fuer reine Indexierung
  - Maximal Flash fuer die schwierigsten Faelle

- **`purpose: 'engine'`** (On-Demand Deep-Extract, gezielte Verarbeitung):
  - Bisheriges Verhalten: Flash Lite / Flash / Pro je nach Komplexitaet

Aenderung in: `sot-storage-extractor/index.ts` — `selectModel()` erhaelt zweiten Parameter, `process-batch` und `deep-upgrade` Actions nutzen ihn.

### 2. `sot-document-parser`: callerContext-Parameter

Der Parser wird von verschiedenen Stellen aufgerufen:
- Vom Storage-Extractor (Indexierung) → kann guenstiger
- Von der UI (User laedt Immobilie/Finanzierung hoch) → braucht volle Power
- Vom Intake-System (Posteingang) → Zweistufig: erst klassifizieren (guenstig), dann parsen (voll)

Neuer optionaler Parameter `callerContext: 'index' | 'engine'` (Default: `'engine'` — bestehende Aufrufe behalten volle Power).

Wenn `callerContext === 'index'`: Model-Ceiling auf Flash (kein Pro).

Aenderung in: `sot-document-parser/index.ts` — Model-Tiering-Block (Zeile 635-644) erhaelt Ceiling-Logik.

### 3. Posteingang (`sot-inbound-receive`): Zweistufiger Flow

Aktuell verarbeitet der Posteingang jedes Attachment sofort mit voller Power. Neuer Flow:

1. **Stufe 1 — Klassifizierung** (Flash Lite): Dokumenttyp erkennen, Prioritaet bestimmen
2. **Stufe 2 — Engine-Parsing** (Flash/Pro): Nur wenn das Dokument einem aktiven Golden Path oder einer Engine zugeordnet wird (z.B. offene Finanzierung, aktiver Mietvertrag)

Aenderung in: `sot-inbound-receive/index.ts` — Zweistufige Verarbeitung mit purpose-Flag.

### 4. Armstrong Deep-Upgrade: Automatisch `purpose: 'engine'`

Der bereits implementierte On-Demand Deep-Extract in `sot-armstrong-advisor` triggert den Extractor mit `purpose: 'engine'` — wenn Armstrong tiefere Infos braucht, bekommt er die volle KI-Power.

Aenderung in: `sot-armstrong-advisor/index.ts` — Deep-Upgrade-Call erhaelt `purpose: 'engine'`.

## Kostenauswirkung

| Szenario: 70.000 PDFs | Aktuell (Tiering v1) | Neu (Purpose-aware) |
|------------------------|---------------------|---------------------|
| Datenraum-Scan (alle 70k) | ~$280 (Flash/Pro Mix) | ~$100 (Flash Lite/Flash, kein Pro) |
| Davon Engine-Verarbeitung (10k aktiv) | Im Scan enthalten | ~$40-80 (Flash/Pro on-demand) |
| **Gesamt** | **~$280** | **~$140-180** |

Die weitere Ersparnis ist ~40-50% gegenueber dem bereits implementierten Tiering, weil kein einziger Pro-Call fuer reine Indexierung verschwendet wird.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/sot-storage-extractor/index.ts` | `selectModel()` erhaelt `purpose`-Parameter, Model-Ceiling fuer Index-Modus |
| `supabase/functions/sot-document-parser/index.ts` | `callerContext`-Parameter, Model-Ceiling bei `'index'` |
| `supabase/functions/sot-inbound-receive/index.ts` | Zweistufiger Flow: Klassifizierung (Lite) → Engine-Parsing (Flash/Pro) |
| `supabase/functions/sot-armstrong-advisor/index.ts` | Deep-Upgrade-Call mit `purpose: 'engine'` |

