
# MOD-11 Redesign — Vertikaler Flow mit 3 Tiles

## Ueberblick

MOD-11 wird von 4 Tabs (Dashboard, Faelle, Kommunikation, Status) auf **3 Tiles** umgebaut — nach dem gleichen Prinzip wie MOD-13 (Projekte): Widget-Cards oben zur Fallauswahl, dann vertikaler Scroll-Flow fuer die Bearbeitung.

**Es ist ein reines UI-Redesign.** Keine DB-Migrationen, keine neuen Hooks, keine neuen Edge Functions, keine Aenderungen an anderen Modulen.

```text
Tile 1: Dashboard          — Widget-Cards aller Faelle + Mandate-Eingang
Tile 2: Finanzierungsakte   — Vertikaler Flow (Zusammenfassung → Selbstauskunft → Objekt → Kalkulator → Notizen → Fertigstellen)
Tile 3: Einreichung         — Widget-Cards fertiger Faelle → Vertikaler Flow (Zusammenfassung → Bankauswahl → E-Mail-Versand)
```

Vorlagen entfaellt vorerst als eigener Tile (kann spaeter ergaenzt werden).

---

## Tile 1: Dashboard (FMDashboard.tsx — Redesign)

**Oben:** Header mit Titel "FINANZIERUNGSMANAGER" + "Neuer Fall" Button

**Widget-Cards** (wie ProjectCard in MOD-13):
- Horizontales Grid mit allen laufenden Faellen
- Jede Card zeigt: Antragsteller-Name, Public-ID, Darlehensbetrag, Status-Badge
- **Neu:** Wo eingereicht (Bankname), wann eingereicht, Bank-Status (Rueckmeldung/Abgelehnt/In Angebotserstellung/Zugesagt)
- Klick oeffnet die Finanzierungsakte (navigiert zu Tile 2 mit der requestId)
- Leerer Zustand mit Placeholder-Card wie in MOD-13

**Darunter:** Kompakte Widgets fuer Faellig/Ueberfaellig und Letzte Aktivitaeten (bestehend), plus Pipeline-Status und Kommunikation (bisher eigene Tabs, jetzt hier integriert).

---

## Tile 2: Finanzierungsakte (FMFallDetail.tsx — Komplettumbau)

Wird erreicht durch Klick auf eine Case-Card im Dashboard. Die bisherige Tab-Navigation (Selbstauskunft | Objekt | Finanzierung | Einreichung | Notizen) wird **komplett entfernt**. Stattdessen alle Sektionen vertikal untereinander in einem scrollbaren Container:

| Block | Inhalt |
|---|---|
| **Header** | Zurueck-Button, Public-ID, Name, Status-Badge, Status-Actions |
| **CaseStepper** | Bestehender Stepper (bleibt) |
| **Kurzbeschreibung** | Neue Card: Zusammenfassung in 4-6 Zeilen (Name, Objekt, Darlehenswunsch, Eingang) |
| **Selbstauskunft** | Bestehende 3-Spalten Side-by-Side Tabelle (PersonSection, EmploymentSection, BankSection, IncomeSection, ExpensesSection, AssetsSection) mit Speichern-Button |
| **Objekt-Daten** | Bestehende Objekt-Tabelle (aus Listing oder eigene Eingabe) |
| **Kalkulator** | 2-Spalten Grid: Links Darlehensparameter (editierbar), Rechts Kalkulations-Ergebnis |
| **Notizen** | Textarea + Timeline |
| **Fertigstellen-Button** | Grosser Button: "Finanzierungsakte fertigstellen" — setzt Status auf `ready_for_submission` |

Alles in `space-y-6`, keine Tabs, kein Switching. Einfach runterscrollen und bearbeiten.

---

## Tile 3: Einreichung (FMEinreichung.tsx — Neu)

### Ansicht 1: Uebersicht (Fallauswahl)

Gleiche Widget-Card-Ansicht wie im Dashboard, aber **nur Faelle mit Status `ready_for_submission` oder hoeher**. Klick auf eine Card oeffnet den Einreichungs-Flow.

### Ansicht 2: Vertikaler Einreichungs-Flow (nach Klick auf Fall)

| Block | Inhalt |
|---|---|
| **Header** | Zurueck-Button, Public-ID, Name, Status |
| **Zusammenfassung / Finanzierungs-Expose** | Professionelle Read-only Kurzzusammenfassung: Kundeninformationen, Finanzierungsdaten, Objektdaten, integrierte Selbstauskunft-Ansicht, Link zum DMS-Datenraum. PDF-Export Button (dieses Dokument geht als E-Mail-Anhang mit) |
| **Bankauswahl** | Bankkontakte aus dem bestehenden Hook `useFinanceBankContacts`. Checkbox-Liste, bis zu 3 Banken anhaekbar. KI-gestuetzte Bankempfehlung (Platzhalter-Button, spaetere Phase). Europace/Hypoport Plattform-Uebergabe (deaktiviert, Platzhalter) |
| **E-Mail-Versand** | Pro ausgewaehlter Bank ein personalisierter E-Mail-Entwurf (Vorschau). Enthalt automatisch: Betreff, Anschreiben, Finanzierungs-Expose als PDF-Anhang, Datenraum-Link. "Alle senden" Button fuer Serien-Versand |

---

## Dateiaenderungen

| Datei | Art | Beschreibung |
|---|---|---|
| `src/manifests/routesManifest.ts` | Aendern | MOD-11 Tiles: `dashboard`, `faelle` (umbenannt zu Finanzierungsakte), `einreichung`. Dynamic routes: `faelle/:requestId`, `einreichung/:requestId` |
| `src/pages/portal/FinanzierungsmanagerPage.tsx` | Aendern | Neue Route `einreichung/*` und `einreichung/:requestId` |
| `src/pages/portal/finanzierungsmanager/FMDashboard.tsx` | Aendern | Widget-Cards (analog ProjectCard) mit Einreichungs-Status. Kommunikation + Status als Widgets integriert |
| `src/pages/portal/finanzierungsmanager/FMFallDetail.tsx` | Aendern | Tabs entfernen, alle Sektionen vertikal als Card-Bloecke. Neuer Zusammenfassungs-Block oben. Fertigstellen-Button unten |
| `src/pages/portal/finanzierungsmanager/FMEinreichung.tsx` | **Neu** | Einreichungs-Uebersicht (Widget-Cards fertiger Faelle) |
| `src/pages/portal/finanzierungsmanager/FMEinreichungDetail.tsx` | **Neu** | Vertikaler Einreichungs-Flow: Zusammenfassung + Bankauswahl + E-Mail-Versand |
| `src/components/finanzierungsmanager/FinanceCaseCard.tsx` | **Neu** | Widget-Card Komponente fuer Finanzierungsfaelle (analog ProjectCard) |

**Entfaellt als eigene Tiles (Inhalte ins Dashboard integriert):**
- `FMKommunikation.tsx` — bleibt als Datei, Route wird Redirect auf Dashboard
- `FMStatus.tsx` — bleibt als Datei, Route wird Redirect auf Dashboard
- `FMFaelle.tsx` — wird nicht mehr als eigener Tile gebraucht, Dashboard uebernimmt die Fallauswahl

---

## Architektur-Auswirkungen

**Keine.** Es aendert sich ausschliesslich die UI-Struktur innerhalb von MOD-11:
- Keine DB-Migrationen
- Keine neuen Hooks (bestehende `useFinanceRequest`, `useFutureRoomCases`, `useFinanceBankContacts` decken alles ab)
- Keine neuen Edge Functions
- Keine Aenderungen an MOD-07 (Antragsteller-Seite) oder Zone 1
- Keine Aenderungen an anderen Modulen
- Zone 3 wird nicht beruehrt
