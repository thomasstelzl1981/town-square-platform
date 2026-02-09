

# MOD-19 Photovoltaik: Anpassung "Volle Sichtbarkeit ohne Daten"

## Problem

Im aktuellen Plan wuerde ein Nutzer ohne PV-Anlagen nur leere Seiten mit "Neue Anlage anlegen" Buttons sehen. Die Menuestruktur, Akte, Monitoring-Kurven und Dokumente-Aufbau waeren unsichtbar.

## Loesung: "Showcase Empty States"

Jeder der 4 Tabs zeigt auch ohne Daten die **komplette Seitenstruktur** mit Platzhaltern, Skeleton-Previews und erklaerenden Elementen. Der Nutzer sieht sofort, was ihn erwartet.

---

### Tab 1: Anlagen (ohne Daten)

Statt nur einem Button zeigt die Seite:

```text
+------------------------------------------+
| ANLAGEN              [+ Neue Anlage]     |
|              [Demo-Anlagen erzeugen]     |
+------------------------------------------+
| Vorschau: So sieht Ihr PV-Portfolio aus  |
+------------------------------------------+
| Beispiel-Tabelle (ausgegraut/muted):     |
| Name  | Ort  | kWp | Status | Leistung  |
| ---   | ---  | --- | ---    | ---        |
| (Platzhalter-Zeile 1, muted)            |
| (Platzhalter-Zeile 2, muted)            |
+------------------------------------------+
| Akte-Vorschau Card (muted):             |
| "So sieht eine PV-Akte aus"             |
| Sections: Standort, Zaehler, MaStR,     |
|   Technik, Monitoring, Dokumente         |
| (alle als Labels sichtbar, Werte "---") |
+------------------------------------------+
| CTA: "Erste Anlage anlegen"             |
+------------------------------------------+
```

Die Beispiel-Tabelle und Akte-Vorschau sind mit `opacity-50` oder `bg-muted` gestylt und klar als Vorschau gekennzeichnet.

### Tab 2: Monitoring (ohne Daten)

```text
+------------------------------------------+
| MONITORING                               |
+------------------------------------------+
| KPI-Karten (Platzhalter, muted):        |
| [Gesamtleistung: -- W]                  |
| [Ertrag heute: -- kWh]                  |
| [Monatsertrag: -- kWh]                  |
| [Offline: --]                            |
+------------------------------------------+
| Demo-Tageskurve (statisch, muted):      |
| Glockenfoermige Kurve (Recharts)         |
| mit Label "Beispiel-Tageskurve 9,8 kWp" |
| (echte Datenpunkte aus DemoGenerator,    |
|  aber als "Preview" markiert)            |
+------------------------------------------+
| Hinweis-Card:                            |
| "Legen Sie eine Anlage an oder erzeugen |
|  Sie Demo-Anlagen, um Live-Monitoring   |
|  zu aktivieren."                         |
| [Demo-Anlagen erzeugen] [Anlage anlegen] |
+------------------------------------------+
```

Die **statische Demo-Kurve** wird direkt aus `DemoLiveGenerator.ts` erzeugt (24h Punkte fuer 9,8 kWp) und als Vorschau-Chart angezeigt. Kein Polling, nur einmal gerendert.

### Tab 3: Dokumente (ohne Daten)

```text
+------------------------------------------+
| DOKUMENTE                                |
+------------------------------------------+
| Ordnerstruktur-Vorschau (muted):        |
| > 01_Stammdaten                          |
| > 02_MaStR_BNetzA                        |
| > 03_Netzbetreiber                       |
| > 04_Zaehler                             |
| > 05_Wechselrichter_und_Speicher         |
| > 06_Versicherung                        |
| > 07_Steuer_USt_BWA                      |
| > 08_Wartung_Service                     |
+------------------------------------------+
| Checkliste-Vorschau (muted):            |
| [ ] Inbetriebnahmeprotokoll             |
| [ ] Netzbetreiber-Bestaetigung          |
| [ ] Anmeldebestaetigung MaStR           |
| [ ] Zaehlerprotokoll                    |
| [ ] Versicherungsnachweis               |
| [ ] Wartungsvertrag                     |
+------------------------------------------+
| "Diese Struktur wird automatisch fuer   |
|  jede neue PV-Anlage angelegt."          |
| [Anlage anlegen]                         |
+------------------------------------------+
```

### Tab 4: Einstellungen (immer voll sichtbar)

Dieser Tab braucht **keine Daten** und ist ohnehin komplett. Die 3 Connector-Karten (SMA, Solar-Log, finAPI) und Monitoring-Settings werden immer angezeigt, unabhaengig davon, ob Anlagen existieren.

---

## Technische Umsetzung

Jeder Tab bekommt eine `hasPlants` Boolean-Abfrage. Wenn `false`:

- Die **Seitenstruktur** (Tabelle, KPIs, Tree, Checkliste) wird trotzdem gerendert, aber mit Platzhalter-Daten und `className="opacity-50 pointer-events-none"`
- Ein ueberlagernder **Hinweis-Banner** oder CTA-Bereich bleibt interaktiv
- Der `DemoLiveGenerator` liefert eine statische 24h-Kurve fuer die Monitoring-Vorschau

Kein zusaetzlicher DB- oder Routing-Aufwand -- nur UI-Logik in den 4 Tab-Komponenten.

---

## Aenderung gegenueber dem genehmigten Plan

| Aspekt | Vorher | Jetzt |
|--------|--------|-------|
| Anlagen (leer) | Nur EmptyState + CTA | Volle Tabelle + Akte-Vorschau (muted) + CTA |
| Monitoring (leer) | "Demo aktivieren" CTA | KPI-Karten + Beispiel-Tageskurve + CTA |
| Dokumente (leer) | EmptyState | Ordnerstruktur + Checkliste (muted) + CTA |
| Einstellungen (leer) | War schon komplett | Keine Aenderung |

Der Rest des Plans (DB, Routing, Hooks, DMS, Dashboard-Widget, Demo-Seed, Akte, Wizard) bleibt **unveraendert**. Nur die Empty-State-Logik in den 4 Tab-Komponenten wird erweitert.

