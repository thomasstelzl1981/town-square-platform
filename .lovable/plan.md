
# MOD-06 Verkauf - Vollständiges Audit & Soll-Ist-Vergleich

## Executive Summary

Dieses Audit dokumentiert den Implementierungsstand nach Abschluss der Phasen 1-4 und vergleicht ihn mit dem genehmigten Plan (MOD-06 Verkauf v2.0).

---

## 1. MOD-06 VERKAUF - Soll-Ist-Vergleich

### 1.1 Menüstruktur (Sidebar)

| # | SOLL (Plan) | IST (Implementiert) | Status |
|---|-------------|---------------------|--------|
| 1 | So funktioniert's | So funktioniert's | ✅ OK |
| 2 | Objekte | Objekte | ✅ OK |
| 3 | Reporting | Reporting | ✅ OK |
| 4 | Vorgänge | Vorgänge | ✅ OK |

**Bewertung:** ✅ 4/4 Menüpunkte korrekt implementiert

### 1.2 Tab "So funktioniert's"

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| Hinweis: Nur für Bestandsimmobilien | ✅ | Korrekt angezeigt |
| Hinweis: Nicht für Bauträger/Aufteiler | ✅ | Korrekt angezeigt |
| Workflow-Schritte 1-5 visualisiert | ✅ | Alle Schritte sichtbar |
| Schritt 1: Objekt wählen | ✅ | Angezeigt |
| Schritt 2: Exposé erstellen | ✅ | Armstrong-Erwähnung |
| Schritt 3: Exposé freigeben | ✅ | Pflichtfelder genannt |
| Schritt 4: Partner-Freigabe | ✅ | Consent-Hinweise |
| Schritt 5: Veröffentlichen | ✅ | Kaufy, Partner, Scout24 |
| Post-Flow: Anfrage → Notar | ✅ | Vollständig |
| Button "Jetzt Objekt auswählen" | ✅ | Vorhanden |
| Default-Route (/so-funktionierts) | ✅ | Korrekt |

**Bewertung:** ✅ Vollständig Plan-konform

### 1.3 Tab "Objekte"

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| Properties LEFT JOIN Listings | ✅ | Query korrekt |
| Spalte: Code | ✅ | Vorhanden |
| Spalte: Objekt (Adresse) | ✅ | Vorhanden |
| Spalte: Preis | ✅ | Vorhanden |
| Spalte: Exposé-Status | ✅ | Badges: Entwurf/Aktiv/etc. |
| Spalte: Kanäle (nur Badges) | ✅ | K/P Icons |
| KEINE Toggles in Liste | ✅ | Korrekt - keine Toggles |
| Eye-Icon → Exposé | ✅ | Navigation funktional |
| Suchfeld | ✅ | Vorhanden |
| Empty State | ✅ | "Objekt anlegen" Button |

**Bewertung:** ✅ Vollständig Plan-konform

### 1.4 Tab "Reporting"

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| View-Statistiken | ⚠️ | Empty State vorhanden |
| listing_views Tabelle | ❓ | Tabelle erstellt? |

**Bewertung:** ⚠️ Basis-UI vorhanden, Daten fehlen

### 1.5 Tab "Vorgänge"

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| Reservierungs-Workflow | ✅ | UI vorhanden |
| Status-Cards (Reservierung, Notar, BNL) | ✅ | Korrekt angezeigt |
| Empty State | ✅ | "Keine aktiven Vorgänge" |

**Bewertung:** ✅ UI Plan-konform

### 1.6 Exposé-Editor (/portal/verkauf/expose/:propertyId)

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| Route implementiert | ✅ | ExposeDetail.tsx |
| Auto-Create Listing (draft) | ✅ | Bei erstem Öffnen |
| Titel, Preis, Provision editierbar | ✅ | Formular vorhanden |
| Provisions-Slider (3-15%) | ✅ | Slider-Komponente |
| Beschreibung editierbar | ✅ | Textarea |
| Armstrong KI-Button | ✅ | "Mit KI generieren" |
| Objektdaten (read-only aus MOD-04) | ✅ | Property-Infos |
| Pflichtfeld-Validierung | ✅ | Checkliste |
| SALES_MANDATE Consent | ✅ | Dialog implementiert |
| Partner-Freigabe Dialog | ✅ | PartnerReleaseDialog.tsx |
| Doppel-Consent (PARTNER_RELEASE + SYSTEM_FEE) | ✅ | 2 Checkboxen |
| Kaufy-Toggle (erst nach Partner-Freigabe) | ✅ | Deaktiviert bis Freigabe |
| Scout24 Button (Phase 2, deaktiviert) | ✅ | "Demnächst verfügbar" |
| Systemgebühr-Hinweis (2.000 EUR) | ✅ | In Dialog angezeigt |

**Bewertung:** ✅ Vollständig Plan-konform

### 1.7 Consent-Dialoge

| Dialog | Status | Komponente |
|--------|--------|------------|
| SalesMandateDialog | ✅ | src/components/verkauf/SalesMandateDialog.tsx |
| PartnerReleaseDialog | ✅ | src/components/verkauf/PartnerReleaseDialog.tsx |

**Bewertung:** ✅ Beide Dialoge implementiert

---

## 2. MOD-09 VERTRIEBSPARTNER - Soll-Ist-Vergleich

### 2.1 Menüstruktur (Sidebar)

| # | SOLL (Plan) | IST (tile_catalog) | IST (Code) | Status |
|---|-------------|---------------------|------------|--------|
| 1 | Katalog | Objektkatalog | katalog | ⚠️ Name-Abweichung |
| 2 | Beratung | Beratung | beratung | ✅ OK |
| 3 | Pipeline | Netzwerk (!) | pipeline | ❌ MISMATCH |
| 4 | — | Auswahl | — | ❌ EXTRA |

**Kritische Probleme erkannt:**

1. **tile_catalog Datenbank enthält:**
   - `/portal/vertriebspartner/katalog` → "Objektkatalog"
   - `/portal/vertriebspartner/auswahl` → "Auswahl"
   - `/portal/vertriebspartner/beratung` → "Beratung"
   - `/portal/vertriebspartner/netzwerk` → "Netzwerk"

2. **VertriebspartnerPage.tsx Routes enthält:**
   - `katalog` → KatalogTab
   - `beratung` → BeratungTab
   - `pipeline` → PipelineTab

3. **App.tsx Routes enthält:**
   - `/portal/vertriebspartner/katalog`
   - `/portal/vertriebspartner/auswahl`
   - `/portal/vertriebspartner/beratung`
   - `/portal/vertriebspartner/netzwerk`

**Ergebnis:** Routen-Mismatch zwischen tile_catalog, Page-Routes und App.tsx → 404 Fehler!

### 2.2 Screenshot-Evidenz

Bei Navigation zu "Objektkatalog" erscheint 404 Error weil:
- Sidebar-Link zeigt auf `/portal/vertriebspartner/katalog` ✅
- VertriebspartnerPage rendert nested Routes
- App.tsx hat `/portal/vertriebspartner/katalog` → VertriebspartnerPage
- VertriebspartnerPage hat eigene Routes aber erwartet `/katalog` Suffix

**ROOT CAUSE:** Nested Routing-Konflikt zwischen App.tsx und VertriebspartnerPage.tsx

**Bewertung:** ❌ KRITISCHER FEHLER - Route nicht funktional

---

## 3. ZONE 3 KAUFY - Soll-Ist-Vergleich

### 3.1 KaufyImmobilien.tsx Query

| Anforderung | Status | Anmerkung |
|-------------|--------|-----------|
| Query auf listing_publications | ✅ | channel='kaufy' |
| Filter status='active' | ✅ | Korrekt |
| JOIN mit listings und properties | ✅ | Daten korrekt |
| Favorite-Funktion (localStorage) | ✅ | Implementiert |
| Empty State | ✅ | "Noch keine Objekte" |
| Status-Badge "Reserviert" | ✅ | Vorhanden |

**Bewertung:** ✅ Query Plan-konform

---

## 4. ZONE 1 ADMIN - Relevante Punkte

| Bereich | Status | Anmerkung |
|---------|--------|-----------|
| tile_catalog für MOD-06 | ✅ | 4 korrekte Sub-Tiles |
| tile_catalog für MOD-09 | ⚠️ | Abweichend (4 statt 3) |
| Agreements Templates | ❓ | Nicht überprüft |
| Master-Templates | ❓ | Nicht überprüft |

---

## 5. DATENBANK-STRUKTUREN

| Tabelle | Status | Verwendung |
|---------|--------|------------|
| listings | ✅ | MOD-06 Source of Truth |
| listing_publications | ✅ | Kanal-Steuerung |
| properties | ✅ | MOD-04 Stammdaten |
| listing_views | ❓ | Für Reporting benötigt |
| partner_deals | ✅ | MOD-09 Pipeline |

---

## 6. KRITISCHE FEHLER (Behebung erforderlich)

### FEHLER #1: MOD-09 Routing-Konflikt (KRITISCH)
**Problem:** 404 Error bei Navigation zu Submenüs
**Ursache:** Doppeltes Routing - App.tsx definiert Routes UND VertriebspartnerPage.tsx definiert nested Routes
**Lösung:** VertriebspartnerPage.tsx muss analog zu VerkaufPage.tsx mit `path="vertriebspartner/*"` in App.tsx konfiguriert werden

### FEHLER #2: tile_catalog Inkonsistenz (MITTEL)
**Problem:** tile_catalog hat "Auswahl" und "Netzwerk", Code hat "Pipeline"
**Ursache:** tile_catalog nicht synchronisiert mit Plan
**Lösung:** tile_catalog UPDATE auf: Katalog, Beratung, Pipeline

---

## 7. EMPFOHLENE PRÜFUNGEN VOR MANUELLER ABNAHME

### Funktionale Tests

| # | Testfall | Priorität |
|---|----------|-----------|
| T1 | MOD-06: Objekt ohne Listing anklicken → Exposé erstellt sich | HOCH |
| T2 | MOD-06: Exposé freigeben mit SALES_MANDATE | HOCH |
| T3 | MOD-06: Partner-Freigabe mit Doppel-Consent | HOCH |
| T4 | MOD-06: Kaufy-Toggle erst nach Partner-Freigabe aktiv | HOCH |
| T5 | MOD-09: Objektkatalog zeigt Partner-freigegebene Listings | HOCH |
| T6 | Zone 3: Kaufy/immobilien zeigt nur Kaufy-freigegebene | MITTEL |
| T7 | MOD-06: Vorgänge zeigt Reservierungen | MITTEL |
| T8 | MOD-06: Reporting zeigt Views | NIEDRIG |

### Datenfluss-Tests

| # | Testfall | Priorität |
|---|----------|-----------|
| D1 | Listing status='active' erscheint NICHT in Zone 3 ohne Kaufy-Pub | HOCH |
| D2 | Listing mit Partner-Freigabe erscheint in MOD-09 | HOCH |
| D3 | Status "reserved" spiegelt sich in allen Kontexten | MITTEL |

### Consent-Tests

| # | Testfall | Priorität |
|---|----------|-----------|
| C1 | SALES_MANDATE wird gespeichert | HOCH |
| C2 | PARTNER_RELEASE wird gespeichert | HOCH |
| C3 | SYSTEM_SUCCESS_FEE_2000 wird gespeichert | HOCH |

---

## 8. ZUSAMMENFASSUNG

### Positiv (Plan-konform implementiert)
- ✅ MOD-06 Verkauf: 4-Tab-Struktur korrekt
- ✅ "So funktioniert's" vollständig mit Workflow-Erklärung
- ✅ "Objekte" ohne Toggles, Properties LEFT JOIN Listings
- ✅ Exposé-Editor mit allen Consent-Gates
- ✅ Partner-Freigabe-Dialog mit 2.000 EUR Hinweis
- ✅ Kaufy-Toggle erst nach Partner-Freigabe
- ✅ Zone 3 Kaufy Query auf listing_publications

### Negativ (Korrektur erforderlich)
- ❌ MOD-09: Routing-Konflikt verursacht 404
- ⚠️ tile_catalog MOD-09: Menünamen nicht synchron
- ❓ listing_views Tabelle: Existenz prüfen
- ❓ user_consents: Tatsächliche Speicherung verifizieren

---

## 9. EMPFEHLUNG

**Vor manueller Freigabe müssen folgende Korrekturen erfolgen:**

1. **App.tsx:** Route ändern zu `path="vertriebspartner/*"` (analog zu verkauf/*)
2. **tile_catalog UPDATE:** MOD-09 Sub-Tiles auf Katalog, Beratung, Pipeline
3. **Listing_views Tabelle:** Existenz verifizieren oder erstellen

Nach diesen Korrekturen empfehle ich die manuelle Funktionsprüfung gemäß Testmatrix (Abschnitt 7).
