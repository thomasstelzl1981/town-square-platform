
# Zuhause-Akte: Inline-Dossier mit erweiterten Gebaeudedaten

## Ist-Zustand
- Klick auf "Oeffnen" navigiert zu separater Route `/portal/immobilien/zuhause/zuhause/:homeId`
- Demo-Adresse stimmt bereits mit Stammdaten ueberein (Sauerlacher Strasse 30, 82041 Oberhaching)
- Demo-Home ist als "Miete" markiert, obwohl es ein Haus mit 300m2 und 6 Zimmern ist — wird auf "Eigentum" geaendert
- Keine erweiterten Gebaeudedaten (Baujahr, Verkehrswert etc.)

## Geplante Aenderungen

### 1. Datenbank: `miety_homes` erweitern

Neue Spalten:
| Spalte | Typ | Default |
|--------|-----|---------|
| `construction_year` | integer | null |
| `market_value` | numeric | null |
| `floor_count` | integer | null |
| `bathrooms_count` | numeric | null |
| `heating_type` | text | null |
| `has_garage` | boolean | false |
| `has_garden` | boolean | false |
| `has_basement` | boolean | false |
| `last_renovation_year` | integer | null |
| `plot_area_sqm` | numeric | null |

Demo-Datensatz aktualisieren: `ownership_type` von 'miete' auf 'eigentum' setzen plus Demo-Werte fuer die neuen Felder (Baujahr 2005, Verkehrswert 850000, 2 Etagen, 2 Baeder, Gas-Heizung, Garage+Garten+Keller, Grundstueck 620m2).

### 2. Datenbank: Neue Tabelle `miety_loans`

Fuer Eigentum — Immobiliendarlehen:
| Spalte | Typ |
|--------|-----|
| `id` | uuid PK |
| `home_id` | uuid FK -> miety_homes |
| `tenant_id` | uuid |
| `bank_name` | text |
| `loan_amount` | numeric |
| `interest_rate` | numeric |
| `monthly_rate` | numeric |
| `start_date` | date |
| `end_date` | date |
| `remaining_balance` | numeric |
| `loan_type` | text |
| `notes` | text |

RLS: tenant_id-basiert, gleiche Logik wie miety_homes.

### 3. Datenbank: Neue Tabelle `miety_tenancies`

Fuer Miete — Mietverhaeltnis:
| Spalte | Typ |
|--------|-----|
| `id` | uuid PK |
| `home_id` | uuid FK -> miety_homes |
| `tenant_id` | uuid |
| `landlord_name` | text |
| `landlord_contact` | text |
| `base_rent` | numeric |
| `additional_costs` | numeric |
| `total_rent` | numeric |
| `deposit_amount` | numeric |
| `lease_start` | date |
| `lease_end` | date (nullable) |
| `cancellation_period` | text |
| `notes` | text |

RLS: gleiche Logik.

### 4. UebersichtTile.tsx — Inline-Akte statt Navigation

**Muster wie Finanzanalyse:** `openCardId` State + `toggleCard` Funktion.

- Der "Oeffnen"-Button wird zum Toggle (klappt die Akte unterhalb der Widgets auf/zu)
- Statt `navigate(...)` wird `setOpenCardId(home.id)` aufgerufen
- Unterhalb des Widget-Grids wird bei geoeffneter Akte der bisherige `MietyHomeDossier`-Inhalt inline gerendert (2-Spalten-Layout mit Dokumentenbaum links, Accordion rechts)
- Die Accordion-Sektionen bleiben bestehen, ergaenzt um neue Sektionen

### 5. Neue Accordion-Sektionen im Dossier

**A) "Gebaeudedetails"** (zwischen Uebersicht und Vertraege):
- Kompaktes Grid mit: Baujahr, Verkehrswert, Etagen, Baeder, Heizung, Grundstueck, Garage/Garten/Keller
- Bearbeiten-Button fuehrt in den bestehenden Bearbeitungsmodus

**B) "Darlehen"** (nur bei ownership_type === 'eigentum'):
- Liste vorhandener Darlehen mit Bank, Betrag, Rate, Zinsbindung
- Plus-Button zum Hinzufuegen (Inline-Formular oder Drawer)

**C) "Mietverhaeltnis"** (nur bei ownership_type === 'miete'):
- Vermieter-Kontakt, Kaltmiete, Nebenkosten, Kaution, Kuendigungsfrist
- Bearbeiten/Anlegen Funktionalitaet

### 6. MietyCreateHomeForm.tsx erweitern

Neue Felder im Formular (unterhalb der bestehenden):
- Baujahr, Verkehrswert, Heizungsart (Select: Gas, Oel, Fernwaerme, Waermepumpe, Pellet)
- Etagen, Badezimmer, Grundstuecksflaeche
- Checkboxen: Garage, Garten, Keller
- Letzte Sanierung (Jahr)

### 7. Routing anpassen

Die separate Route `/portal/immobilien/zuhause/zuhause/:homeId` bleibt als Fallback bestehen, aber der primaere Zugang erfolgt jetzt inline in der UebersichtTile. Der "Oeffnen"-Button in der Adress-Kachel toggelt die Inline-Akte auf/zu.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| DB-Migration | miety_homes erweitern, miety_loans + miety_tenancies erstellen, Demo-Update |
| `src/pages/portal/miety/tiles/UebersichtTile.tsx` | Inline-Akte mit openCardId Pattern statt Navigation |
| `src/pages/portal/miety/components/MietyCreateHomeForm.tsx` | Neue Gebaeude-Felder |
| `src/pages/portal/miety/MietyHomeDossier.tsx` | Neue Accordion-Sektionen (Gebaeudedetails, Darlehen, Mietverhaeltnis) |
| Neue: `src/pages/portal/miety/components/BuildingDetailsSection.tsx` | Gebaeudedaten-Anzeige |
| Neue: `src/pages/portal/miety/components/LoanSection.tsx` | Darlehensliste mit CRUD |
| Neue: `src/pages/portal/miety/components/TenancySection.tsx` | Mietverhaeltnis mit CRUD |

## Technische Details

Das Inline-Pattern folgt exakt dem Finanzanalyse-Vorbild:

```text
// State
const [openCardId, setOpenCardId] = useState<string | null>(null);

// Toggle
const toggleCard = (id: string) => {
  setOpenCardId(prev => prev === id ? null : id);
};

// Widget mit Toggle statt Navigation
<Button onClick={() => toggleCard(home.id)}>
  {openCardId === home.id ? 'Schliessen' : 'Oeffnen'}
</Button>

// Inline-Akte unterhalb der Widgets
{openCardId && (
  <Card className="glass-card p-6 mt-4">
    {/* 2-Column Dossier content */}
  </Card>
)}
```
