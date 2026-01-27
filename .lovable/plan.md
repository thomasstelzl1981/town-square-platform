

# MOD-06 Verkauf - Finaler Implementierungsplan (v2.0)

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

### 1. So funktioniert's
Einstiegsseite mit visuellen Flowcharts. Der Kunde sieht Schritt für Schritt, was passiert, wenn er was macht.

### 2. Objekte
Spiegelung aller Properties aus MOD-04 mit eingeschränkten, verkaufsrelevanten Daten. Klick öffnet Exposé-Editor.

### 3. Reporting
Performance-Daten: Views, Klicks, Anfragen pro Objekt und Kanal.

### 4. Vorgänge
Reservierungen, Notarbeauftragung, Notartermin - begleitet von den nötigen Vereinbarungen.

---

## Korrigierter Provisions- und Gebühren-Flow

```
EINZIGER VERKAUFSWEG: Über Partner-Netzwerk (+ optional Kaufy)
==============================================================

  Verkäufer                         System                    Partner
      │                                │                         │
      │ Exposé freigeben               │                         │
      │ (SALES_MANDATE)                │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │ Partner-Freigabe erteilen      │                         │
      │ - Provision: 3-15% netto       │                         │
      │ - PARTNER_RELEASE              │                         │
      │ - SYSTEM_SUCCESS_FEE_2000      │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │                                │  Objekt sichtbar in     │
      │                                │  MOD-09 Objektkatalog   │
      │                                ├────────────────────────>│
      │                                │                         │
      │ Optional: Kaufy aktivieren     │                         │
      │ (NUR nach Partner-Freigabe!)   │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │                                │  Objekt auf Kaufy.app   │
      │                                │  sichtbar               │
      │                                │                         │
      │                                │                         │
      │                        LEAD ENTSTEHT                     │
      │                        (Kaufy oder direkt)               │
      │                                │                         │
      │                                │  Lead geht an Partner   │
      │                                ├────────────────────────>│
      │                                │                         │
      │                                │                         │
      │<─────────── Reservierungsanfrage ────────────────────────┤
      │                                │                         │
      │ [Annehmen]                     │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │ [Notarauftrag]                 │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │                       ┌────────┴────────┐                │
      │                       │ VERKÄUFER ZAHLT │                │
      │                       │    100 EUR      │                │
      │                       └─────────────────┘                │
      │                                │                         │
      │ [Notartermin + BNL]            │                         │
      ├───────────────────────────────>│                         │
      │                                │                         │
      │                       ┌────────┴────────┐                │
      │                       │ VERKÄUFER ZAHLT │                │
      │                       │   1.900 EUR     │                │
      │                       └─────────────────┘                │
      │                                │                         │
      │                                │                         │
      │                       ┌────────┴────────┐       ┌────────┴────────┐
      │                       │ SYSTEMGEBÜHR    │       │ PROVISION       │
      │                       │ = 2.000 EUR     │       │ = X% vom KP     │
      │                       │ (vom Verkäufer) │       │ (vom Käufer)    │
      │                       └─────────────────┘       └─────────────────┘


POOL-LEAD AUS ZONE 1 (Lead wird Partner zugewiesen)
===================================================

  Zusätzlich zur Systemgebühr (2.000 EUR vom Verkäufer):

  PROVISION = X% vom Kaufpreis
       │
       ├──────> 1/3 an Platform (SoaT)
       │
       └──────> 2/3 an Partner
```

---

## Korrigierter Exposé-Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EXPOSÉ-WORKFLOW (KORRIGIERT)                             │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │  SCHRITT 1  │
     │   Objekt    │
     │   wählen    │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐     Armstrong generiert
     │  SCHRITT 2  │     automatisch Beschreibung
     │   Exposé    │
     │  erstellen  │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐     Pflichtfelder:
     │  SCHRITT 3  │     • Titel, Preis, Provision
     │   Exposé    │     • Min. 1 Bild
     │  freigeben  │     • Energieausweis
     │             │
     │ SALES_MANDATE     (Consent erforderlich)
     └──────┬──────┘
            │
            ▼
     ┌─────────────────────────────────────────────────────┐
     │  SCHRITT 4: PARTNER-FREIGABE                        │
     │  (PFLICHT für jede Veröffentlichung!)               │
     │                                                     │
     │  • Provision festlegen: 3-15% netto                 │
     │  • PARTNER_RELEASE Consent                          │
     │  • SYSTEM_SUCCESS_FEE_2000 Consent                  │
     │    (2.000 EUR bei erfolgreicher Vermittlung)        │
     │                                                     │
     │  Kosten für VERKÄUFER bei Erfolg:                   │
     │  • 100 EUR bei Notarauftrag                         │
     │  • 1.900 EUR nach Notartermin (BNL)                 │
     └──────┬──────────────────────────────────────────────┘
            │
            │ (Erst nach Partner-Freigabe verfügbar)
            │
            ▼
     ┌─────────────────────────────────────────────────────┐
     │  SCHRITT 5: VERÖFFENTLICHUNGSKANÄLE                 │
     │                                                     │
     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
     │  │   Partner   │  │    Kaufy    │  │   Scout24   │  │
     │  │  Netzwerk   │  │   Website   │  │  (Phase 2)  │  │
     │  │             │  │             │  │             │  │
     │  │  [Aktiv]    │  │  [Toggle]   │  │ [Demnächst] │  │
     │  │  (autom.)   │  │  (optional) │  │             │  │
     │  └─────────────┘  └─────────────┘  └─────────────┘  │
     │                                                     │
     │  Partner-Netzwerk: Automatisch aktiv nach Freigabe  │
     │  Kaufy: Optional zuschaltbar (Lead-Generierung)     │
     │  Scout24: Kostenpflichtig, Phase 2                  │
     └─────────────────────────────────────────────────────┘
```

---

## Modul-Abhängigkeiten (Übersicht)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ZONE 1 (ADMIN)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Agreements          Master-Templates       Lead Pool        Tile Catalog   │
│  (Consents)          (Zinsen, AfA)          (Leads)          (Pläne)        │
│       │                    │                    │                │          │
│  SALES_MANDATE             │                    │           Plan speichern  │
│  PARTNER_RELEASE           │                    │                           │
│  SYSTEM_SUCCESS_FEE_2000   │                    │                           │
└───────┼────────────────────┼────────────────────┼───────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ZONE 2 (PORTAL)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MOD-01 Stammdaten ◄──────► MOD-02 KI-Office                                │
│  (Kontakte)                 (Kontakte, Armstrong)                           │
│       │                            │                                         │
│       │                            │ Beschreibung generieren                 │
│       │                            ▼                                         │
│  MOD-04 Immobilien ──────► MOD-03 DMS                                       │
│  (Properties)               (Unterlagen, Bilder)                            │
│       │                            │                                         │
│       │ Spiegelung                 │                                         │
│       ▼                            ▼                                         │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                         MOD-06 VERKAUF                                 ║  │
│  ║                      (SOURCE OF TRUTH)                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════╣  │
│  ║  So funktioniert's │ Objekte │ Reporting │ Vorgänge                   ║  │
│  ║                    │         │           │                            ║  │
│  ║                    │    ▼    │           │                            ║  │
│  ║                    │ EXPOSÉ  │           │                            ║  │
│  ║                    │    │    │           │                            ║  │
│  ║                    │    ▼    │           │                            ║  │
│  ║             Partner-Freigabe (PFLICHT)                                ║  │
│  ║                    │    │                                             ║  │
│  ║          ┌─────────┴────┴─────────┐                                   ║  │
│  ║          ▼                        ▼                                   ║  │
│  ║    Partner-Netzwerk         Kaufy-Toggle                              ║  │
│  ║    (automatisch)            (optional)                                ║  │
│  ╚══════════┬═══════════════════════┬════════════════════════════════════╝  │
│             │                       │                                        │
│             ▼                       │                                        │
│       MOD-09 Vertriebspartner       │                                        │
│       (Objektkatalog)               │                                        │
│             │                       │                                        │
│             ▼                       │                                        │
│       MOD-10 Leads                  │                                        │
│       (Pipeline)                    │                                        │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ZONE 3 (WEBSITE)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            KAUFY.APP                                         │
│                                                                              │
│  /immobilien ──────► /expose/:id ──────► Lead-Anfrage ──────► Zone 1 Pool   │
│  (Liste)             (Detail)            (API)                ──► Partner    │
│                                                                              │
│  Kaufy dient der LEAD-GENERIERUNG für Vertriebspartner                      │
│  Inserat kostenlos, Vermittlung kostenpflichtig (Systemgebühr)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Virtueller Test (Korrigiert)

### Test-Szenario: Verkäufer Herr Müller verkauft MFH

**SCHRITT 1-3:** Wie bisher (Objekt wählen, Exposé erstellen, Pflichtfelder ausfüllen)

**SCHRITT 4: Exposé freigeben**
- Herr Müller klickt "Freigeben"
- SALES_MANDATE Consent wird angezeigt und bestätigt
- Status: 'active'

**SCHRITT 5: Veröffentlichungs-Optionen erscheinen**

```
VERÖFFENTLICHUNG
────────────────────────────────────────────────────

[ ] Partner-Freigabe erteilen
    (Pflicht für alle Veröffentlichungen)
    [Partner-Freigabe starten]

Kaufy-Website:
[ ] Auf Kaufy veröffentlichen
    ⚠️ Erst nach Partner-Freigabe verfügbar

ImmobilienScout24:
[Demnächst verfügbar]

────────────────────────────────────────────────────
```

**Kaufy-Toggle ist DEAKTIVIERT** bis Partner-Freigabe erteilt wurde.

**SCHRITT 6: Herr Müller klickt "Partner-Freigabe starten"**

```
PARTNER-NETZWERK FREIGABE
─────────────────────────────────────────────────────

Ihr Objekt wird für unsere verifizierten Vertriebspartner
sichtbar. Leads von der Kaufy-Website gehen ebenfalls
an unsere Partner.

PROVISION FÜR PARTNER
Partner-Provision: [====*====] 7.0% netto
(wird bei erfolgreichem Verkauf vom Käufer gezahlt)

IHRE KOSTEN BEI ERFOLGREICHER VERMITTLUNG
─────────────────────────────────────────────────────
Bei Verkauf über unser Netzwerk zahlen SIE als Verkäufer:

• 100 EUR bei Beauftragung des Kaufvertragsentwurfs
• 1.900 EUR nach Notartermin (bei BNL-Eingang)
──────────────────────────────────────────────────────
Gesamt: 2.000 EUR erfolgsabhängig

ZUSTIMMUNGEN
─────────────────────────────────────────────────────
[x] Ich gebe das Objekt für das Partner-Netzwerk frei
    und akzeptiere die Provisionsvereinbarung
    (PARTNER_RELEASE)

[x] Ich akzeptiere die Systemgebühr von 2.000 EUR
    bei erfolgreichem Verkauf über das Netzwerk
    (SYSTEM_SUCCESS_FEE_2000)

[Abbrechen]            [Partner-Freigabe aktivieren]
```

**Nach Bestätigung:**
- `user_consents` INSERT (PARTNER_RELEASE)
- `user_consents` INSERT (SYSTEM_SUCCESS_FEE_2000)
- `listing_partner_terms` INSERT
- `listing_publications` INSERT (channel='partner_network')
- Objekt erscheint in MOD-09 Objektkatalog
- **Kaufy-Toggle wird AKTIVIERBAR**

**SCHRITT 7: Herr Müller aktiviert optional Kaufy**

```
VERÖFFENTLICHUNG
────────────────────────────────────────────────────

[x] Partner-Freigabe erteilt ✓
    Provision: 7.0% | Aktiv seit 15.01.2026

Kaufy-Website:
[x] Auf Kaufy veröffentlichen
    (Lead-Generierung für Vertriebspartner)
    Aktiv seit 15.01.2026

ImmobilienScout24:
[Demnächst verfügbar]
```

**Ergebnis:** Objekt ist jetzt auf Kaufy.app UND im Partner-Katalog sichtbar.

---

## Implementierungsphasen (Komprimiert)

### Phase 1: Struktur & Navigation (1 Tag)
- SubTabNav aus VerkaufPage.tsx entfernen
- 4-Tab-Struktur implementieren: So funktioniert's, Objekte, Reporting, Vorgänge
- Default-Redirect auf "So funktioniert's"
- Sidebar-Routing anpassen

### Phase 2: Exposé-Editor (3 Tage)
- Tab "So funktioniert's" mit Flowcharts und Erklärungen
- Tab "Objekte" mit Properties LEFT JOIN Listings (keine Toggles)
- Route /portal/verkauf/expose/:propertyId
- Auto-Create Listing mit Armstrong-Beschreibung
- Pflichtfeld-Validierung
- Freigabe mit SALES_MANDATE Consent
- Partner-Freigabe-Dialog mit Doppel-Consent
- Kaufy-Toggle (NUR nach Partner-Freigabe aktivierbar)
- Scout24-Button (UI only, deaktiviert)

### Phase 3: Datenfluss & Integration (1.5 Tage)
- MOD-09: TabsList entfernen, Objektkatalog auf listing_publications
- Zone 3 Kaufy: Query auf listing_publications mit channel='kaufy'
- Status-Spiegelung (Reserviert) in allen Kontexten
- listing_views Tabelle für Reporting

### Phase 4: Vorgänge & Reporting (1.5 Tage)
- Tab "Reporting" mit View-Statistiken
- Tab "Vorgänge" mit Reservierungs-Workflow
- Notarauftrag-Trigger (100 EUR)
- BNL-Eintrag-Trigger (1.900 EUR)

### Phase 5: Finaler Check & Plan-Speicherung (0.5 Tage)
- Abgleich aller Komponenten mit diesem Plan
- Virtuelle Durchläufe aller Szenarien
- Plan als Dokument in Zone 1 Tile Catalog speichern
- Dokumentation der Agreement-Templates

---

## Akzeptanzkriterien

| ID | Kriterium |
|----|-----------|
| AC-01 | Tab "So funktioniert's" zeigt korrekten Workflow |
| AC-02 | Default-Route ist /portal/verkauf/so-funktionierts |
| AC-03 | Tab "Objekte" zeigt Properties LEFT JOIN Listings, KEINE Toggles |
| AC-04 | Exposé-Freigabe erfordert SALES_MANDATE Consent |
| AC-05 | Partner-Freigabe erfordert PARTNER_RELEASE + SYSTEM_FEE Consent |
| AC-06 | Kaufy-Toggle ist DEAKTIVIERT bis Partner-Freigabe erteilt |
| AC-07 | Partner-Freigabe-Dialog zeigt klar: VERKÄUFER zahlt 2.000 EUR |
| AC-08 | Zone 3 Kaufy zeigt nur Kaufy-freigegebene Exposés |
| AC-09 | MOD-09 zeigt nur Partner-freigegebene Exposés |
| AC-10 | Status "Reserviert" wird überall gespiegelt |
| AC-11 | Notarauftrag löst 100 EUR Gebühr aus (beim Verkäufer) |
| AC-12 | BNL-Eintrag löst 1.900 EUR Gebühr aus (beim Verkäufer) |

---

## Zusammenfassung der Korrekturen

1. **Kaufy ist abhängig von Partner-Freigabe** - kein unabhängiger Kanal
2. **Systemgebühr zahlt VERKÄUFER** - nicht der Partner (klar im Dialog)
3. **Reihenfolge:** Freigabe → Partner-Freigabe → dann erst Kaufy möglich
4. **Kaufy = Lead-Generierung** für Vertriebspartner, nicht "kostenloser" Verkaufskanal

---

## Nächste Schritte nach Freigabe

1. Plan in Zone 1 Tile Catalog als Dokument speichern
2. Phase 1 beginnen: Struktur & Navigation
3. Nach jeder Phase: Abgleich mit diesem Plan

**Geschätzter Gesamtaufwand:** 7-8 Tage

---

**Bitte um Freigabe zur Implementierung.**

