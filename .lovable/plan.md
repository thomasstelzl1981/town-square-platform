
# Caring-Seite Redesign: Suche, Anbieter-Detail und Kalender-Buchung

## Uebersicht

Die Caring-Seite wird von einem Pflege-Kalender zu einer **Service-Suchmaschine** umgebaut. Zwei neue Seiten entstehen:
1. **Caring-Startseite** (Suche + Ergebnisse)
2. **Anbieter-Detailseite** (Profil + Kalender + Slot-Buchung)

Zusaetzlich wird eine **Backlog-Datei** fuer Engine-Anforderungen angelegt.

---

## Seite 1: Caring-Startseite (`/portal/pets/caring`)

### Layout von oben nach unten

```text
+----------------------------------------------------------+
|  CARING  (ModulePageHeader)                               |
|  "Finde den passenden Service fuer dein Tier"            |
+----------------------------------------------------------+
|                                                          |
|  [4 Service-Kacheln im WidgetGrid — Emerald-Glow]       |
|  +----------+ +----------+ +----------+ +----------+    |
|  | Pension  | | Tages-   | | Gassi-   | | Hunde-   |    |
|  |  (Home)  | | staette  | | Service  | | salon    |    |
|  |          | | (Sun)    | | (Foot)   | | (Scissor)|    |
|  +----------+ +----------+ +----------+ +----------+    |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  Suchfeld (volle Breite)                                 |
|  +----------------------------------------------------+  |
|  | PLZ oder Ort    |  Service-Typ (Dropdown)  | Suchen|  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  Ergebnis-Kacheln (WidgetGrid, 4 Spalten)               |
|  +----------+ +----------+ +----------+ +----------+    |
|  | Anbieter | | Anbieter | | Anbieter | |    ...   |    |
|  | Logo     | | Logo     | | Logo     | |          |    |
|  | Name     | | Name     | | Name     | |          |    |
|  | Rating   | | Rating   | | Rating   | |          |    |
|  | Services | | Services | | Services | |          |    |
|  +----------+ +----------+ +----------+ +----------+    |
|                                                          |
+----------------------------------------------------------+
```

### Details

- Die **4 Kacheln** oben bleiben bestehen, erhalten aber **Emerald-Glow** (da Demo-Daten) und ein DEMO-Badge
- Klick auf eine Kachel setzt den Service-Typ im Suchfeld
- **Alles unterhalb der Kacheln** (Pflege-Kalender, KPIs, Tabs, Event-Dialoge) wird komplett entfernt
- Das **Suchfeld** erstreckt sich ueber die volle Breite, aufgeteilt in:
  - Eingabefeld "PLZ oder Ort" (Text)
  - Select-Dropdown mit: Pension, Tagesstaette, Gassi-Service, Hundesalon, Welpenspielstunde
  - Such-Button
- **Ergebnisse** werden als Widget-Kacheln angezeigt (WidgetGrid), jede Kachel zeigt:
  - Firmenname
  - Bewertung (Sterne)
  - Angebotene Services (Badges)
  - Adresse
- Klick auf eine Anbieter-Kachel navigiert zu `/portal/pets/caring/:providerId`

---

## Seite 2: Anbieter-Detailseite (`/portal/pets/caring/:providerId`)

### Layout von oben nach unten

```text
+----------------------------------------------------------+
|  [Zurueck-Button]                                        |
+----------------------------------------------------------+
|                                                          |
|  TITELBILD (Cover, volle Breite, h-48, Placeholder)     |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  PROFIL-BEREICH                                          |
|  Firmenname (text-2xl bold)                              |
|  Adresse  |  Telefon  |  E-Mail                         |
|  Rating (Sterne)                                         |
|                                                          |
|  "Ueber uns"                                             |
|  Bio-Text / Werbetext des Anbieters                     |
|                                                          |
|  Angebotene Services (Badge-Liste)                       |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  KALENDER                                                |
|  +----------------------------------------------------+  |
|  |              Monats-Kalender                        |  |
|  |   Gruene Tage = freie Termine verfuegbar           |  |
|  |   Rote Tage = ausgebucht / geblockt                |  |
|  |   Graue Tage = Vergangenheit                       |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SLOT-AUSWAHL (erscheint nach Klick auf gruenen Tag)    |
|  +----------------------------------------------------+  |
|  | Datum: 15. Maerz 2026                               |  |
|  |                                                    |  |
|  | [09:00] [10:00] [11:00] [14:00] [15:00] [16:00]   |  |
|  |                                                    |  |
|  | Tier: [Select]   Anmerkungen: [Textarea]           |  |
|  |                                                    |  |
|  | [Termin anfragen]                                  |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

### Details

- **Titelbild**: Platzhalter-Gradient (kein echtes Bild vorhanden, `pet_providers` hat kein `cover_image_url`-Feld — kommt spaeter via DB-Migration)
- **Profil**: Daten aus `pet_providers` (company_name, address, phone, email, bio, rating_avg)
- **Services**: Aus `pet_services` geladen, gefiltert auf diesen Provider
- **Kalender**: Nutzt die vorhandene `Calendar`-Komponente (react-day-picker). Tage werden farblich markiert:
  - **Gruen**: Provider hat `pet_provider_availability`-Eintraege fuer diesen Wochentag UND der Tag ist nicht in `pet_provider_blocked_dates`
  - **Rot/Grau**: Geblockte oder vergangene Tage
- **Slot-Auswahl**: Beim Klick auf einen gruenen Tag werden die verfuegbaren Zeitfenster aus `pet_provider_availability` (start_time, end_time, max_bookings) angezeigt
- **Buchung**: Der "Termin anfragen"-Button ist vorerst **visuell aktiv, aber nicht funktional verknuepft** — ein Toast zeigt "Buchung wird spaeter ueber Zone 1 orchestriert"

---

## Technische Aenderungen

### Datenbank

**Migration**: `pet_providers` erhaelt zwei neue Spalten:
- `cover_image_url TEXT` — Titelbild fuer die Detail-Seite
- `service_area_postal_codes TEXT[]` — Array von PLZs fuer die Suchfunktion

### Routing

**`src/pages/portal/PetsPage.tsx`**: Neue Route hinzufuegen:
```
caring/provider/:providerId  →  CaringProviderDetail (lazy)
```

### Neue Dateien

1. **`src/pages/portal/pets/CaringProviderDetail.tsx`** — Anbieter-Detailseite mit Profil, Kalender, Slot-Auswahl
2. **`spec/backlog/pet-engine-requirements.md`** — Backlog-Datei fuer Engine-Anforderungen

### Geaenderte Dateien

1. **`src/pages/portal/pets/PetsCaring.tsx`** — Kompletter Umbau:
   - Kacheln behalten, Emerald-Glow + DEMO-Badge hinzufuegen
   - Alles unterhalb der Kacheln entfernen (Pflege-Kalender, KPIs, Tabs, Dialoge)
   - Suchfeld (PLZ + Service-Typ + Button) einfuegen
   - Ergebnis-Grid mit Anbieter-Kacheln
   
2. **`src/pages/portal/PetsPage.tsx`** — Route fuer Provider-Detail hinzufuegen

3. **`src/hooks/usePetBookings.ts`** — Neuer Hook `useSearchProviders(postalCode, serviceCategory)` fuer die Suche (vorerst laedt er alle Provider, da PLZ-Filterung Engine-Sache ist)

### Backlog-Datei: `spec/backlog/pet-engine-requirements.md`

Inhalt:
- Zone-1-Orchestrierung fuer Buchungen (kein direkter Z2-zu-Z2-Schreibvorgang)
- PLZ-basierte Provider-Zuordnung ueber Zone 1
- Verfuegbarkeits-Abgleich (Slots vs. bestehende Buchungen)
- Cross-Tenant-Isolation: Anbieter und Kunden sind verschiedene Tenants
- Provider-Verifizierung vor Sichtbarkeit
- Buchungs-Workflow: requested → confirmed → in_progress → completed
- Cover-Bild-Upload fuer Provider (Storage)
- Welpenspielstunde als neuer `pet_service_category`-Enum-Wert (`puppy_class`)

---

## Zusammenfassung der betroffenen Dateien

| Datei | Aktion |
|-------|--------|
| DB-Migration | Neue Spalten `cover_image_url`, `service_area_postal_codes` + Enum-Wert `puppy_class` |
| `src/pages/portal/pets/PetsCaring.tsx` | Kompletter Umbau (Suche + Ergebnisse) |
| `src/pages/portal/pets/CaringProviderDetail.tsx` | Neue Datei (Anbieter-Profil + Kalender) |
| `src/pages/portal/PetsPage.tsx` | Neue Sub-Route |
| `src/hooks/usePetBookings.ts` | Neuer Such-Hook |
| `spec/backlog/pet-engine-requirements.md` | Neue Backlog-Datei |
