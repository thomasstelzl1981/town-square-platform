
# Umsetzung: IHK-Scraper, LinkedIn-Vorbereitung und Registry-Import-Widget

## Uebersicht

Drei verbleibende Bausteine aus dem Kategorie-Strategie-Plan werden umgesetzt:
1. IHK-Vermittlerregister Apify-Scraper im Research Engine
2. LinkedIn-API Stub fuer Family Offices (Architektur-Vorbereitung)
3. Armstrong-UI-Widget fuer BaFin/IHK Registry-Imports

---

## 1. IHK-Vermittlerregister Apify-Scraper

**Datei:** `supabase/functions/sot-research-engine/index.ts`

Der bestehende `handleStrategyStep` gibt fuer `ihk_scrape` aktuell nur `status: "deferred"` zurueck. Das wird ersetzt durch einen echten Apify-Aufruf gegen das Vermittlerregister.

Neue Funktion `scrapeIhkRegister`:
- Nutzt den Apify `web-scraper` Actor
- Start-URL: `https://www.vermittlerregister.info/recherche?a=suche`
- Parameter: PLZ-Prefix, Erlaubnistyp (34d/f/h/i)
- Parst die Ergebnistabelle (Name, Registrierungs-Nr., PLZ, Ort, Erlaubnistyp)
- Gibt `RegistryEntry[]`-kompatible Ergebnisse zurueck
- Kosten: ~0.02 EUR pro Aufruf (Apify Compute Units)

Aenderung in `handleStrategyStep`:
- `ihk_scrape` ruft `scrapeIhkRegister()` auf statt "deferred" zurueckzugeben
- Ergebnisse werden als ContactResults zurueckgegeben
- Ledger wird aktualisiert mit den gefundenen Feldern

---

## 2. LinkedIn-API Stub (Architektur-Vorbereitung)

**Datei:** `supabase/functions/sot-research-engine/index.ts`

Der `linkedin_future` Step wird zu einem echten Architektur-Stub:
- Pruefen ob ein `LINKEDIN_API_KEY` Secret existiert
- Wenn ja: Basis-Implementierung mit LinkedIn Sales Navigator API
- Wenn nein: Saubere Rueckgabe mit `status: "not_configured"` und Hinweis auf benoetigtes Secret
- Typen fuer LinkedIn-Response vorbereiten

**Datei:** `src/engines/marketDirectory/spec.ts`
- Neuer Kommentarblock fuer LinkedIn-Integration
- `LinkedInContact` Interface hinzufuegen (Vorbereitung)

---

## 3. Registry-Import-Widget (Armstrong UI)

**Neue Datei:** `src/components/armstrong/RegistryImportCard.tsx`

Card-Komponente im gleichen Stil wie `EmailEnrichmentCard`:
- Titel: "Register-Import (BaFin / IHK)"
- Beschreibung: "Banken und Vermittler aus offiziellen Registern importieren"
- Dropdown fuer Kategorie-Auswahl (bank_retail, bank_private, insurance_broker_34d, etc.)
- Datei-Upload (CSV) fuer BaFin-Register
- Button "Import starten" ruft `sot-registry-import` Edge Function auf
- Fortschrittsanzeige: importiert / uebersprungen / Fehler
- Anzeige der letzten Imports (Query auf `contact_strategy_ledger`)

**Datei:** `src/pages/portal/ArmstrongInfoPage.tsx`
- Import der neuen `RegistryImportCard`
- Platzierung im "Services & Add-Ons"-Bereich (nach EmailEnrichmentCard und WhatsAppArmstrongCard)

---

## Technische Details

### IHK Scraper Logik (Pseudocode)

```text
scrapeIhkRegister(plzPrefix, erlaubnisTyp, apiToken):
  1. Apify web-scraper starten mit URL:
     vermittlerregister.info/recherche?plz={plzPrefix}&erlaubnis={typ}
  2. Page Function parst Tabelle:
     - Spalten: Name, Reg-Nr., PLZ, Ort, Erlaubnis
  3. Map zu ContactResult[]:
     - name, postal_code, city, registry_id
     - confidence: 40 (nur Basisdaten)
     - source: "ihk_register"
```

### Registry Import Card (Benutzerfluss)

```text
1. Benutzer waehlt Kategorie (z.B. "Filialbank")
2. Benutzer laedt BaFin-CSV hoch
3. Klick auf "Import starten"
4. POST an sot-registry-import mit:
   { source: "bafin_register", tenant_id, category_code, csv_content }
5. Ergebnis wird angezeigt:
   "142 importiert, 23 Duplikate uebersprungen, 0 Fehler"
6. Naechster Schritt: Enrichment per Google Places + Firecrawl
```

### Betroffene Dateien (Zusammenfassung)

| Datei | Aenderung |
|---|---|
| `supabase/functions/sot-research-engine/index.ts` | IHK-Scraper + LinkedIn-Stub |
| `src/engines/marketDirectory/spec.ts` | LinkedIn-Interface (Vorbereitung) |
| `src/components/armstrong/RegistryImportCard.tsx` | Neue UI-Komponente |
| `src/pages/portal/ArmstrongInfoPage.tsx` | Import + Platzierung der neuen Card |

### Modul-Zuordnung (Freeze-Check)

- `src/components/armstrong/*` --> MOD-02 (Office) --> frozen: false --> OK
- `src/pages/portal/ArmstrongInfoPage.tsx` --> MOD-02 (Office) --> frozen: false --> OK
- `src/engines/marketDirectory/spec.ts` --> ausserhalb Module --> OK
- `supabase/functions/*` --> ausserhalb Module --> OK

Alle Dateien sind editierbar.
