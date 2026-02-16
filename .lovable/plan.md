
# Demo-Daten Engine: Vollstaendige Familie Mustermann mit allen Finanzvertraegen

## Ueberblick

Dieses Vorhaben umfasst vier zusammenhaengende Aenderungen:

1. **Neue Engine `src/engines/demoData/`** — Zentrale SSOT fuer saemtliche Demo-Daten und deren Steuerung
2. **SQL-Migration** — Hauptperson Thomas -> Max Mustermann umbenennen, 3 weitere Personen, 7 Versicherungen, 4 Vorsorgevertraege, 8 Abonnements einfuegen
3. **Neuer Tab "KV" (Krankenversicherung)** in MOD-18 Finanzanalyse
4. **Farbwechsel aller Demo-Widgets** von Emerald (gruen) auf Primary (blau)

## 1. Demo-Persona: Familie Mustermann

Die bestehende Hauptperson (Thomas, `b1f6d204-...`, `is_primary: true`) wird per SQL-UPDATE umbenannt — Login-Daten (auth.users) werden NICHT angefasst.

### Personen

| Person | Rolle | Geb. | Beruf | Versicherung |
|---|---|---|---|---|
| Max Mustermann | hauptperson (UPDATE bestehend) | 1982-03-15 | Selbstaendig (IT-Berater) | PKV |
| Lisa Mustermann | partner (INSERT neu) | 1985-07-22 | Angestellt (Marketing) | GKV |
| Felix Mustermann | kind (INSERT neu) | 2014-09-03 | Schueler | ueber Eltern |
| Emma Mustermann | kind (INSERT neu) | 2017-11-28 | Kindergarten | ueber Eltern |

### Sachversicherungen (insurance_contracts) — 7 Vertraege

| # | Kategorie | Versicherer | Beitrag/Monat | VN |
|---|---|---|---|---|
| 1 | haftpflicht | HUK-COBURG | 8,50 | Max |
| 2 | hausrat | Allianz | 15,90 | Max |
| 3 | wohngebaeude | ERGO | 42,00 | Max |
| 4 | rechtsschutz | ARAG | 28,50 | Max |
| 5 | kfz | HUK-COBURG | 89,00 | Max (Porsche) |
| 6 | kfz | Allianz | 62,00 | Lisa (BMW) |
| 7 | berufsunfaehigkeit | Alte Leipziger | 95,00 | Max |

### Vorsorgevertraege (vorsorge_contracts) — 4 Vertraege

| # | Typ | Anbieter | Beitrag/Monat | Person |
|---|---|---|---|---|
| 1 | Ruerup (Basisrente) | Alte Leipziger | 250,00 | Max (Selbstaendiger -> Ruerup) |
| 2 | bAV (Entgeltumwandlung) | Allianz | 200,00 | Lisa (Angestellte -> bAV) |
| 3 | Riester-Rente | DWS | 162,17 | Lisa (GKV, 2 Kinder) |
| 4 | Privater ETF-Sparplan | Vanguard | 300,00 | Max (flexibel) |

### Abonnements (user_subscriptions) — 8 Abos

| # | Merchant | Kategorie | Betrag | Frequenz |
|---|---|---|---|---|
| 1 | Netflix | streaming_video | 17,99 | monatlich |
| 2 | Spotify Family | streaming_music | 16,99 | monatlich |
| 3 | Amazon Prime | ecommerce_membership | 89,90 | jaehrlich |
| 4 | Microsoft 365 Family | software_saas | 99,00 | jaehrlich |
| 5 | ZEIT Digital | news_media | 19,99 | monatlich |
| 6 | Telekom Magenta L | telecom_mobile | 49,95 | monatlich |
| 7 | Vodafone Kabel | internet | 39,99 | monatlich |
| 8 | FitX Familie | fitness | 29,98 | monatlich |

### Bereits vorhandene Demo-Daten (bleiben unveraendert)

- 3 Immobilien (BER-01, MUC-01, HH-01) mit Landlord Context "Familie Mustermann"
- 2 Fahrzeuge (Porsche 911, BMW M5)
- 1 PV-Anlage (32,4 kWp)
- Leases, Loans, NK-Daten, V+V-Steuerdaten

## 2. Neuer Tab "KV" in Finanzanalyse

Der bestehende MOD-18 bekommt einen 7. Menue-Eintrag:

```text
Uebersicht | Investment | Versicherungen | Vorsorge | KV | Abos | Vorsorge & Testament
```

- **Route**: `/portal/finanzanalyse/kv`
- **Komponente**: `KrankenversicherungTab.tsx` — Zeigt PKV-Status (Max) und GKV-Status (Lisa) als Widgets
- **Registrierung**: In `routesManifest.ts` (MOD-18 tiles) und `FinanzanalysePage.tsx` (Route)

Da `insurance_category` keinen Wert `krankenversicherung` hat und PKV/GKV strukturell anders funktionieren als Sachversicherungen (Beitragsbemessungsgrenze, Arbeitgeberanteil, Zusatzbeitrag), wird dies als eigener Tab mit eigener Datenstruktur (JSONB-Details in einem neuen `kv_contracts`-Feld oder separater Tabelle) umgesetzt. Alternativ: rein clientseitige Demo-Darstellung fuer den ersten Wurf mit spaeterer DB-Erweiterung.

## 3. Demo-Daten Engine

### Dateistruktur

```text
src/engines/demoData/
  spec.ts      — TypeScript-Interfaces
  data.ts      — Alle hartcodierten Konstanten und UUIDs
  engine.ts    — Utility-Funktionen
  index.ts     — Re-Exports
```

### `spec.ts` — Interfaces

- `DemoPersona` — Name, Geburt, Rolle, Beruf, KV-Typ (PKV/GKV)
- `DemoInsuranceContract` — Kategorie, Versicherer, Beitrag, Intervall, VN
- `DemoVorsorgeContract` — Typ, Anbieter, Beitrag, Person
- `DemoSubscription` — Merchant, Kategorie, Betrag, Frequenz
- `DemoRealEstatePortfolio` — Property-IDs, Context-ID, Vehicle-IDs, PV-IDs
- `DemoEntityIds` — Gesamtliste aller festen UUIDs
- `DemoDataSpec` — Buendelt alles: personas, insurances, vorsorge, subscriptions, portfolio

### `data.ts` — Konstanten

Alle Demo-Daten als typsichere Konstanten mit festen UUIDs (Praefix `e0000000-` fuer neue Entitaeten):

- `DEMO_FAMILY: DemoPersona[]` — 4 Personen
- `DEMO_INSURANCES: DemoInsuranceContract[]` — 7 Vertraege
- `DEMO_VORSORGE: DemoVorsorgeContract[]` — 4 Vertraege
- `DEMO_SUBSCRIPTIONS: DemoSubscription[]` — 8 Abos
- `DEMO_PORTFOLIO` — Referenzen auf bestehende Property/Vehicle/PV-IDs
- `ALL_DEMO_IDS: string[]` — Alle UUIDs in einer Liste

### `engine.ts` — Funktionen

| Funktion | Beschreibung |
|---|---|
| `isDemoId(id: string): boolean` | Prueft ob eine UUID zum Demo-Set gehoert (Lookup in Set fuer O(1)) |
| `getDemoSpec(): DemoDataSpec` | Liefert das vollstaendige Demo-Paket |
| `getDemoPersons(): DemoPersona[]` | Nur Personen |
| `getDemoInsurances(): DemoInsuranceContract[]` | Nur Versicherungen |
| `getAllDemoIds(): string[]` | Alle IDs fuer Filterung |
| `getEmptyState(): Record<string, 0>` | Erwartete Zaehler bei deaktiviertem Demo |

### Registrierung

- `src/engines/index.ts` — Re-Export der demoData Engine
- `src/config/demoDataRegistry.ts` — Neuer Eintrag mit Pfad, Modul SYSTEM, Typ hardcoded

## 4. Farbwechsel: Emerald -> Primary Blue

### Zentrale Aenderung in `designManifest.ts`

```text
VORHER:
  CARD: bg-emerald-50/40 border-emerald-200/60 ...shimmer from-emerald-300/60
  HOVER: hover:border-emerald-300/80
  BADGE: bg-emerald-100 text-emerald-700 border-emerald-200

NACHHER:
  CARD: bg-primary/5 border-primary/30 ...shimmer from-primary/40 via-primary/60
  HOVER: hover:border-primary/50
  BADGE: bg-primary/10 text-primary border-primary/20
```

### Hardcoded Emerald-Stellen bereinigen

| Datei | Aenderung |
|---|---|
| `UebersichtTab.tsx` | `ring-emerald-400/50` -> `ring-primary/50` |
| `PortfolioTab.tsx` | `ring-emerald-500 border-emerald-400` -> `ring-primary border-primary` |
| `SanierungTab.tsx` | `ring-emerald-500` -> `ring-primary` |
| `LandingPageTab.tsx` | `ring-emerald-500` -> `ring-primary` |
| `ResearchTab.tsx` | `ring-emerald-500` -> `ring-primary` |
| `VorsorgedokumenteTab.tsx` | `ring-emerald-500/50` -> bleibt (ist "completed" state, nicht Demo) |

## 5. Sichtbarkeitsregel: Demo-Daten nur fuer eigenen Login

### Bestehende Architektur (bereits korrekt)

Die Demo-Daten werden per SQL mit `tenant_id = 'a0000000-0000-4000-a000-000000000001'` eingefuegt. RLS-Policies auf allen Tabellen (`insurance_contracts`, `vorsorge_contracts`, `user_subscriptions`, `household_persons`) filtern per `get_user_tenant_id()`. Das bedeutet:

- Nur der User, dessen `tenant_id` dem Demo-Tenant entspricht, sieht die Demo-Daten
- Andere Accounts (Vertriebspartner, spaetere Kunden) sehen NICHTS davon
- Die `useDemoToggles`-Steuerung ist zusaetzlich per `userId` im localStorage gescoped (Zeile 27: `${STORAGE_KEY_PREFIX}_${userId}`)

### Deaktivierungs-Flow

Wenn ein User die Demo-Daten ueber den Stammdaten-Tab "Demo-Daten" deaktiviert:

1. `useDemoToggles` setzt `toggles[processId] = false` im localStorage
2. Jedes Modul prueft `isEnabled('GP-XXX')` und rendert bei `false` KEINEN Demo-Widget
3. Bestehende DB-Eintraege bleiben erhalten (kein DELETE), werden aber clientseitig ausgeblendet
4. Die Engine-Funktion `isDemoId(id)` ermoeglicht zusaetzliche Filterung in Daten-Hooks: `items.filter(i => !isDemoId(i.id))` wenn Toggle off ist
5. Ergebnis: Komplett leeres Portal mit Empty-State-CTAs ("Neue Versicherung anlegen", etc.)

### Spaeterer Mehrmandanten-Betrieb

Da alle Demo-Daten an `tenant_id = 'a0000000-...-001'` gebunden sind und RLS strikt per Tenant filtert, sind die Demo-Daten fuer andere Tenants grundsaetzlich unsichtbar. Kein zusaetzlicher Code noetig.

## 6. SQL-Migration — Zusammenfassung

Eine einzelne Migration mit folgenden Schritten:

1. **UPDATE** `household_persons` SET first_name='Max', last_name='Mustermann', birth_date='1982-03-15', ... WHERE id = 'b1f6d204-...' (bestehende Hauptperson)
2. **INSERT** 3 neue `household_persons` (Lisa, Felix, Emma) mit festen UUIDs, ON CONFLICT DO NOTHING
3. **INSERT** 7 `insurance_contracts` mit festen UUIDs
4. **INSERT** 4 `vorsorge_contracts` mit festen UUIDs
5. **INSERT** 8 `user_subscriptions` mit festen UUIDs

## 7. Vollstaendige Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|---|---|---|
| `src/engines/demoData/spec.ts` | NEU | Alle Interfaces |
| `src/engines/demoData/data.ts` | NEU | Alle Konstanten mit UUIDs |
| `src/engines/demoData/engine.ts` | NEU | isDemoId, getDemoSpec, etc. |
| `src/engines/demoData/index.ts` | NEU | Re-Exports |
| `src/pages/portal/finanzanalyse/KrankenversicherungTab.tsx` | NEU | KV-Tab mit PKV/GKV-Widgets |
| SQL-Migration | NEU | Personen + Versicherungen + Vorsorge + Abos |
| `src/config/designManifest.ts` | EDIT | DEMO_WIDGET: emerald -> primary |
| `src/config/demoDataRegistry.ts` | EDIT | Neuer Engine-Eintrag |
| `src/engines/index.ts` | EDIT | demoData re-export |
| `src/manifests/routesManifest.ts` | EDIT | KV-Tile bei MOD-18 einfuegen |
| `src/pages/portal/FinanzanalysePage.tsx` | EDIT | KV-Route hinzufuegen |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | EDIT | ring-emerald -> ring-primary |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | EDIT | ring-emerald -> ring-primary |
| `src/pages/portal/immobilien/SanierungTab.tsx` | EDIT | ring-emerald -> ring-primary |
| `src/pages/portal/projekte/LandingPageTab.tsx` | EDIT | ring-emerald -> ring-primary |
| `src/pages/portal/communication-pro/recherche/ResearchTab.tsx` | EDIT | ring-emerald -> ring-primary |

## 8. Ergebnis nach Umsetzung

- **Stammdaten**: Max Mustermann als Hauptperson mit Familie (Lisa, Felix, Emma)
- **Finanzanalyse Uebersicht**: 4 Personen-Cards
- **Versicherungen-Tab**: 7 vorausgefuellte Vertraege
- **Vorsorge-Tab**: 4 Vertraege (Ruerup, bAV, Riester, ETF)
- **KV-Tab (NEU)**: PKV-Widget (Max) + GKV-Widget (Lisa)
- **Abos-Tab**: 8 Abonnements (~175 EUR/Monat)
- **Immobilien**: Unveraendert (3 Properties, 2 Autos, 1 PV)
- **Alle Demo-Widgets**: Blauer Rand statt gruen
- **Toggle off**: Leeres Portal, keine Demo-Daten sichtbar
- **Andere Accounts**: Sehen nie Demo-Daten (RLS per tenant_id)
