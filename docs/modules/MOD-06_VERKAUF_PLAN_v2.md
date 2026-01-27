# MOD-06 Verkauf - Finaler Implementierungsplan (v2.0)

> **Status:** Genehmigt und in Implementierung
> **Letzte Aktualisierung:** 2026-01-27
> **Verantwortlich:** Zone 2 Portal

---

## Modulzweck

**MOD-06 Verkauf** ist das Bestandsverkaufs- und Managementmodul für Eigentümer, die **einzelne Immobilien aus ihrem bestehenden Portfolio** verkaufen möchten.

### Geeignet für:
- Einzelne Bestandsimmobilien (Einfamilienhäuser, Mehrfamilienhäuser, Eigentumswohnungen)
- Privatverkäufer mit wenigen Objekten
- Vermieter, die Teile ihres Portfolios veräußern möchten

### NICHT geeignet für:
- Aufteilerobjekte (große MFH in ETW-Einzelverkauf)
- Neubauprojekte und Bauträgerobjekte
- Projektentwicklungen mit Massenvertrieb

---

## WICHTIG: Kaufy und Partner-Freigabe Zusammenhang

**Kaufy ist KEINE unabhängige Option.** Die Kaufy-Website dient als Lead-Generierungskanal für unsere Vertriebspartner.

**Logik:**
- Kaufy-Leads gehen an Vertriebspartner
- Ohne Partner-Freigabe kann Kaufy NICHT aktiviert werden
- Das Inserat auf Kaufy ist kostenlos, aber die erfolgreiche Vermittlung kostet den VERKÄUFER die Systemgebühr (2.000 EUR)

**Reihenfolge:**
1. Exposé freigeben (SALES_MANDATE)
2. Partner-Freigabe erteilen (PARTNER_RELEASE + SYSTEM_SUCCESS_FEE_2000)
3. ERST DANN kann Kaufy-Toggle aktiviert werden

---

## Die 4 Menüpunkte

| # | Tab | Beschreibung |
|---|-----|--------------|
| 1 | **So funktioniert's** | Einstiegsseite mit visuellen Flowcharts. Der Kunde sieht Schritt für Schritt, was passiert. |
| 2 | **Objekte** | Spiegelung aller Properties aus MOD-04. Klick öffnet Exposé-Editor. |
| 3 | **Reporting** | Performance-Daten: Views, Klicks, Anfragen pro Objekt und Kanal. |
| 4 | **Vorgänge** | Reservierungen, Notarbeauftragung, Notartermin - begleitet von Vereinbarungen. |

---

## Provisions- und Gebührenmodell

### Verkäufer zahlt bei erfolgreicher Vermittlung:

| Zeitpunkt | Betrag | Trigger |
|-----------|--------|---------|
| Notarauftrag | 100 EUR | Kaufvertragsanforderung |
| Nach Notartermin | 1.900 EUR | BNL-Eingang |
| **Gesamt** | **2.000 EUR** | Erfolgsabhängig |

### Pool-Lead-Split (Leads aus Zone 1):
- 1/3 an Platform (SoaT)
- 2/3 an Partner

---

## Exposé-Workflow

```
SCHRITT 1: Objekt wählen
    ↓
SCHRITT 2: Exposé erstellen (Armstrong generiert Beschreibung)
    ↓
SCHRITT 3: Exposé freigeben (SALES_MANDATE Consent)
    ↓
SCHRITT 4: Partner-Freigabe erteilen (PFLICHT!)
    • Provision: 3-15% netto
    • PARTNER_RELEASE Consent
    • SYSTEM_SUCCESS_FEE_2000 Consent
    ↓
SCHRITT 5: Veröffentlichungskanäle
    • Partner-Netzwerk (automatisch aktiv)
    • Kaufy-Website (optional)
    • Scout24 (Phase 2)
```

---

## Implementierungsphasen

### ✅ Phase 1: Struktur & Navigation (abgeschlossen)
- SubTabNav aus VerkaufPage.tsx entfernt
- 4-Tab-Struktur implementiert
- Default-Redirect auf "So funktioniert's"
- Tile-Catalog in DB aktualisiert

### Phase 2: Exposé-Editor (offen)
- Route /portal/verkauf/expose/:propertyId
- Auto-Create Listing mit Armstrong-Beschreibung
- Pflichtfeld-Validierung
- Freigabe mit SALES_MANDATE Consent
- Partner-Freigabe-Dialog mit Doppel-Consent
- Kaufy-Toggle (NUR nach Partner-Freigabe aktivierbar)

### Phase 3: Datenfluss & Integration (offen)
- MOD-09: Objektkatalog auf listing_publications
- Zone 3 Kaufy: Query mit channel='kaufy'
- Status-Spiegelung

### Phase 4: Vorgänge & Reporting (offen)
- Reservierungs-Workflow
- Notarauftrag-Trigger (100 EUR)
- BNL-Eintrag-Trigger (1.900 EUR)

---

## Akzeptanzkriterien

| ID | Kriterium | Status |
|----|-----------|--------|
| AC-01 | Tab "So funktioniert's" zeigt korrekten Workflow | ✅ |
| AC-02 | Default-Route ist /portal/verkauf/so-funktionierts | ✅ |
| AC-03 | Tab "Objekte" zeigt Properties LEFT JOIN Listings | 🔄 |
| AC-04 | Exposé-Freigabe erfordert SALES_MANDATE Consent | 🔄 |
| AC-05 | Partner-Freigabe erfordert PARTNER_RELEASE + SYSTEM_FEE | 🔄 |
| AC-06 | Kaufy-Toggle DEAKTIVIERT bis Partner-Freigabe | 🔄 |
| AC-07 | Partner-Dialog zeigt: VERKÄUFER zahlt 2.000 EUR | 🔄 |
| AC-08 | Zone 3 Kaufy zeigt nur Kaufy-freigegebene Exposés | 🔄 |
| AC-09 | MOD-09 zeigt nur Partner-freigegebene Exposés | 🔄 |
| AC-10 | Status "Reserviert" wird überall gespiegelt | 🔄 |

---

## Technische Details

### Routing
```
/portal/verkauf                    → Redirect zu so-funktionierts
/portal/verkauf/so-funktionierts   → SoFunktioniertsTab
/portal/verkauf/objekte            → ObjekteTab
/portal/verkauf/reporting          → ReportingTab
/portal/verkauf/vorgaenge          → VorgaengeTab
/portal/verkauf/expose/:propertyId → ExposeDetail (Phase 2)
```

### Dateien
- `src/pages/portal/VerkaufPage.tsx` - Hauptseite
- `src/pages/portal/verkauf/SoFunktioniertsTab.tsx` - ✅ NEU
- `src/pages/portal/verkauf/ObjekteTab.tsx` - Bestehend
- `src/pages/portal/verkauf/ReportingTab.tsx` - ✅ NEU
- `src/pages/portal/verkauf/VorgaengeTab.tsx` - Bestehend

### Gelöschte Dateien
- `AktivitaetenTab.tsx` - Ersetzt durch ReportingTab
- `AnfragenTab.tsx` - Integriert in Vorgänge

---

## Consent Templates (Zone 1)

| Code | Titel | Trigger |
|------|-------|---------|
| SALES_MANDATE | Verkaufsauftrag | Bei Exposé-Freigabe |
| PARTNER_RELEASE | Partner-Netzwerk Freigabe | Bei Partner-Freigabe |
| SYSTEM_SUCCESS_FEE_2000 | Systemgebühr 2.000 EUR | Mit Partner-Freigabe |
