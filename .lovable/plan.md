

# MOD-12 Akquise-Manager — Finaler Implementierungsplan

## Modul-Struktur: 4 Tiles (korrigiert)

| Tile | Route | Hauptfunktionen |
|------|-------|-----------------|
| **Dashboard** | `/portal/akquise-manager/dashboard` | • KPIs (Aktive Mandate, Objekteingänge, Freigegeben) • Schnellübersicht: Aktuelle Mandate + Objekte • Quick Actions: Neues Mandat, Objekt erfassen, Abgelehnte |
| **Mandate** | `/portal/akquise-manager/mandate` | • Liste aller eigenen + zugewiesenen Mandate • Klick → Workbench mit Tabs (Profil, Sourcing, Outreach, Objekte, Aktivitäten) • Neues Mandat erstellen (Kontakt-First Wizard) |
| **Objekteingang** | `/portal/akquise-manager/objekteingang` | • Zentrale Inbox aller eingegangenen Angebote/Exposés • Unabhängig von Mandats-Zuordnung sichtbar • Klick → Detail mit Kalkulation + Aktionen (Absage/Interesse/Preisvorschlag) |
| **Tools** | `/portal/akquise-manager/tools` | • Exposé-Upload mit Drag-and-Drop + KI-Extraktion • Standalone-Kalkulatoren (Bestand + Aufteiler) mit eigenem Drag-and-Drop • Portal-Recherche (ImmoScout, Immowelt) • Immobilienbewertung (KI + GeoMap) |

**Hinweis:** Das Tile "Kunden" wurde entfernt — Kontakte werden zentral in MOD-02 (KI Office) verwaltet.

---

## Implementierungsplan

### Phase 1–6: Wie bereits besprochen

(Routing-Fix, Mandats-Wizard, Objekteingang-Liste/Detail, Kalkulation, Action-Dialoge, Datenraum)

---

### Phase 7: Tools-Seite (erweitert)

#### 7.1 Exposé-Upload & Analyse

```text
┌────────────────────────────────────────────────────────────┐
│ 📄 EXPOSÉ-UPLOAD & ANALYSE                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      📎 Exposé hier ablegen oder klicken             │  │
│  │         PDF, DOCX, JPG, PNG                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Nach Upload:                                              │
│  → KI extrahiert Objektdaten automatisch                   │
│  → Kann einem Mandat zugeordnet werden                     │
│  → Aktionen: Absage / Interesse / Preisvorschlag           │
│                                                            │
│  [📊 Zur Bestandskalkulation] [📈 Zur Aufteilerkalkulation]│
└────────────────────────────────────────────────────────────┘
```

**Zweck:** Exposés hochladen, die NICHT per E-Mail kamen (z.B. aus Newslettern, von Kollegen) → werden in Objekteingang aufgenommen und können Mandaten zugeordnet werden.

---

#### 7.2 Standalone-Kalkulatoren (MIT Drag-and-Drop)

```text
┌────────────────────────────────────────────────────────────┐
│ 📊 STANDALONE-KALKULATOREN                                 │
│                                                            │
│  Schnelle Kalkulation ohne Mandat-Kontext                  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📎 Exposé hier ablegen für automatische Befüllung  │   │
│  │     oder Werte manuell eingeben                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  [ 🏠 Bestand (Hold) ]    [ 📊 Aufteiler (Flip) ]          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Eingabewerte (manuell oder aus Exposé):                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Kaufpreis    │ │ Fläche m²    │ │ Einheiten    │        │
│  │ [3.200.000]  │ │ [2.550]      │ │ [40]         │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ Jahresmiete  │ │ Faktor       │                         │
│  │ [217.687]    │ │ [14,7]       │                         │
│  └──────────────┘ └──────────────┘                         │
│                                                            │
│  [Berechnung starten]                                      │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📈 ERGEBNIS (Bestand / Aufteiler)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ (Vollständige Kalkulation mit Charts + Tabellen)     │  │
│  │ (Gleiche Darstellung wie im Objekteingang-Detail)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Hinweis: Diese Kalkulation wird nicht gespeichert.        │
│  Um sie zu speichern, erstellen Sie einen Objekteingang.   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Funktionen:**
1. **Drag-and-Drop Exposé-Upload** — PDF/DOCX ablegen
2. **KI-Extraktion** — Werte werden automatisch befüllt (Kaufpreis, Fläche, Miete, etc.)
3. **Manuelle Eingabe** — Alternative: Werte selbst eingeben
4. **Tab-Auswahl** — Bestand (Hold) oder Aufteiler (Flip)
5. **Vollständige Kalkulation** — Slider, Charts, Tabellen (identisch zum Objekteingang-Detail)
6. **Kein DB-Speichern** — Rein temporär für schnelle Analyse

**Unterschied zu 7.1:**
- 7.1 = Exposé hochladen → wird als Objekteingang gespeichert → kann Mandat zugeordnet werden
- 7.2 = Schnelle Kalkulation → nur temporär → für Ad-hoc-Analysen ohne Persistenz

---

#### 7.3 Portal-Recherche

```text
┌────────────────────────────────────────────────────────────┐
│ 🔍 PORTAL-RECHERCHE                                        │
│                                                            │
│  Portal: [ImmoScout24 ▼]  Region: [Berlin ▼]               │
│  Preis: [500k] - [2M]     Objektart: [MFH ▼]               │
│                                                            │
│  [🔎 Objekte suchen]  [👥 Makler suchen]                   │
│                                                            │
│  Ergebnisse:                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ (Liste gefundener Objekte/Makler via Apify)          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

#### 7.4 Immobilienbewertung

```text
┌────────────────────────────────────────────────────────────┐
│ 🏠 IMMOBILIENBEWERTUNG                                     │
│                                                            │
│  Freitext-Suche:                                           │
│  [MFH Berliner Allee 45, 10115 Berlin, 8 WE            ]   │
│                                                            │
│  [🧠 KI-Recherche starten]  [📍 GeoMap-Analyse starten]    │
│                                                            │
│  Tabs: [Standort] [Markt] [Risiken] [Empfehlung]           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ (Strukturierte Ergebnisse aus KI + GeoMap)           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Zusammenfassung der Änderungen

| Aspekt | Status |
|--------|--------|
| Tile "Kunden" | ❌ Entfernt (Kontakte in MOD-02) |
| Tile "Objekteingang" | ✅ Hinzugefügt (zentrale Inbox) |
| 4 Tiles gesamt | ✅ Dashboard, Mandate, Objekteingang, Tools |
| 7.1 Exposé-Upload | ✅ Mit Drag-and-Drop, speichert als Objekteingang |
| 7.2 Standalone-Kalkulatoren | ✅ **Jetzt auch mit Drag-and-Drop** für Exposé-Befüllung |
| Objekteingang als Inbox | ✅ Zeigt ALLE eingegangenen Angebote (E-Mail + manuell) |

---

## Acceptance Criteria (erweitert)

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Navigation prüfen | 4 Tiles: Dashboard, Mandate, Objekteingang, Tools (KEIN "Kunden") |
| 2 | Objekteingang öffnen | Zeigt alle Angebote (E-Mail-Inbound + manuell hochgeladen) |
| 3 | Tools → Exposé-Upload | Drag-and-Drop → KI-Extraktion → wird als Objekteingang gespeichert |
| 4 | Tools → Standalone-Kalkulator | **Drag-and-Drop → KI-Extraktion → Werte werden befüllt** |
| 5 | Standalone-Kalkulator manuell | Werte eingeben → Berechnung funktioniert |
| 6 | Standalone-Kalkulator Charts | Bestand: 30-Jahres-Charts; Aufteiler: Kosten/Erlöse/Gewinn |
| 7 | Kein DB-Speichern in Standalone | Hinweis wird angezeigt, Daten sind nur temporär |

