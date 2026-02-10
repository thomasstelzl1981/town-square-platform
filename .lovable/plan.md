

# MIETY Komplett-Ueberarbeitung — Vorbereitete Vertraege + Lebendige Tabs

## Kernproblem

Alle 5 Tiles (ausser Uebersicht) zeigen nur "Legen Sie zuerst ein Zuhause an" — ein Fullscreen-Blocker (`NoHomesState`). Selbst im Dossier fehlen vorbereitete Kacheln fuer alle Mindestvertraege. Die Adresse aus den Profildaten wird nicht uebernommen.

## Loesung: 4 Aenderungspakete

### Paket 1: Profil-Prefill im Create-Formular

**Datei:** `src/pages/portal/miety/components/MietyCreateHomeForm.tsx`

Beim Laden werden `profiles.street`, `house_number`, `postal_code`, `city` abgefragt und als Defaults gesetzt. Der User sieht ein vorausgefuelltes Formular, kann aber aendern.

### Paket 2: Tab-Reihenfolge aendern

**Datei:** `src/manifests/routesManifest.ts`

Neue Reihenfolge der tiles im MOD-20 Block:
1. Uebersicht
2. Kommunikation
3. Zaehlerstaende
4. Versorgung
5. Versicherungen
6. Dokumente

Dieselbe Reihenfolge in den Routes in `MietyPortalPage.tsx`.

### Paket 3: Alle Tiles mit permanenten Kacheln (KERN)

**Datei:** `src/pages/portal/MietyPortalPage.tsx`

Komplette Ueberarbeitung: `NoHomesState` wird entfernt. Jeder Tab zeigt IMMER vorbereitete Kacheln — egal ob ein Home existiert oder nicht. Wenn kein Home existiert, oeffnet der "+ Anlegen" Button das Create-Formular inline.

**UebersichtTile:**
- Bleibt wie bisher (Home-Liste + Create), plus 4 Schnellzugriff-Kacheln (Strom, Internet, Hausrat, Zaehlerstaende) als Status-Cards

**KommunikationTile (Position 2):**
- Vermieter-Verlinkungskachel mit Einladungscode-Feld
- Schadensmeldung-Kachel (Platzhalter mit CTA)
- Dokumente-Bereich (Platzhalter "Korrespondenz")

**ZaehlerstaendeTile:**
- IMMER 4 Kacheln: Strom, Gas, Wasser, Heizung — mit "Erfassen" Button
- Kein NoHomesState Blocker

**VersorgungTile:**
- IMMER 4 vorbereitete Vertragskacheln:
  - Stromvertrag (Zap-Icon)
  - Gasvertrag (Flame-Icon)
  - Wasservertrag (Droplets-Icon)
  - Internet/Telefon (Wifi-Icon)
- Jede Kachel: Icon, Label, Anbieter/Kosten oder "Kein Vertrag hinterlegt", "+ Vertrag anlegen"
- "+ Weiteren Vertrag hinzufuegen" Button

**VersicherungenTile:**
- IMMER 2 vorbereitete Kacheln:
  - Hausratversicherung (Shield-Icon)
  - Haftpflichtversicherung (Shield-Icon)
- Jede Kachel mit Status oder "Nicht hinterlegt", "+ Hinzufuegen"
- "+ Weitere Versicherung" Button

**DokumenteTile (Position 6):**
- 6 Ordner-Kacheln als Vorschau (Vertraege, Zaehler, Versicherungen, Versorgung, Kommunikation, Sonstiges)
- Dokumenten-Zaehler + Upload-Hinweis

### Paket 4: Erweiterte Placeholder-Karten im Dossier + ContractDrawer defaultCategory

**Datei:** `src/pages/portal/miety/components/MietyContractsSection.tsx`

PLACEHOLDER_CARDS erweitern von 3 auf 7 Eintraege:
- strom, gas, wasser, internet, hausrat, haftpflicht, miete

Wenn `filterCategories` gesetzt ist, werden nur passende Placeholders gezeigt (z.B. bei Versicherungen nur hausrat + haftpflicht).

**Datei:** `src/pages/portal/miety/components/ContractDrawer.tsx`

Neue optionale Prop `defaultCategory?: string`. Wenn gesetzt, wird die Kategorie beim Oeffnen vorausgewaehlt.

## Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| `src/manifests/routesManifest.ts` | Tiles-Reihenfolge in MOD-20: Kommunikation auf Pos 2, Dokumente auf Pos 6 |
| `src/pages/portal/MietyPortalPage.tsx` | Komplett-Rewrite aller 6 Tile-Funktionen: NoHomesState weg, permanente Kacheln, ContractDrawer/MeterReadingDrawer inline, Kommunikation mit Vermieter-Kachel |
| `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` | Profildaten-Prefill aus `profiles` Tabelle |
| `src/pages/portal/miety/components/MietyContractsSection.tsx` | PLACEHOLDER_CARDS auf 7 erweitern (alle Mindestvertraege) |
| `src/pages/portal/miety/components/ContractDrawer.tsx` | Neue Prop `defaultCategory` fuer Vorauswahl |

## Keine Datenbank-Aenderungen

Alle Tabellen existieren bereits. `profiles` wird nur gelesen (SELECT).

