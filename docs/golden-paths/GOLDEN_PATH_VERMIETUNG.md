# Golden Path: Vermietung (MSV)

> **Pfad:** MOD-04 (Immobilie) → MOD-05 (MSV) → MOD-20 (Miety Portal)
> **Status:** FROZEN v1.0

---

## Übersicht

Der Vermietungsprozess führt von der Immobilienverwaltung (MOD-04) über die Miet- und Sonderverwaltung (MOD-05) bis zur Mieter-Interaktion (MOD-20 Miety Portal).

## Phasen

### Phase 1: Objekt-Vorbereitung (MOD-04)
- Immobilie mit Einheiten im Portfolio anlegen
- Vermietereinheit (Kontext) mit Steuerdaten konfigurieren
- ActionKey: `RENTAL_START` → Vermietungsprozess starten

### Phase 2: Vermietung (MOD-05)
- **Objekte-Tab:** Übersicht aller vermietbaren Einheiten
- **Vermietung-Tab:** Aktive Vermietungsvorgänge
  - Miet-Exposé erstellen (RentalExposeDetail)
  - Interessenten verwalten
  - Mietvertrag digital vorbereiten
- **Mieteingang-Tab (Premium):** Zahlungstracking
- MSV-Enrollment: `msv_enrollments` verknüpft Property mit MSV-Modul

### Phase 3: Mieter-Onboarding (MOD-20)
- Mieter erhält Einladung via `renter_invites`
- Registrierung über Zone 3 Miety Website
- Zugang zum Miety Portal (MOD-20) mit:
  - Mietvertrag einsehen
  - Schadensmeldung
  - Dokumente hochladen
  - Kommunikation mit Vermieter

### Phase 4: Laufende Verwaltung
- Mieteingang-Tracking (Premium Feature)
- Nebenkostenabrechnung
- Mieterhöhungen
- Vertragsverlängerungen / Kündigungen
- Leases-Tabelle: `leases` (Public ID: SOT-MV-*)

## Datenfluss

```
properties (MOD-04)
  └── units
       └── msv_enrollments (MOD-05 Aktivierung)
       └── leases (Mietverträge)
            └── renter_invites (Mieter-Einladung)
                 └── renter_profiles (MOD-20)
```

## Camunda ActionKeys
- `RENTAL_START` → Vermietungsprozess starten

## DMS-Struktur
```
MOD_05/
  └── {property_public_id}/
       └── {unit}/
            ├── Mietvertrag
            ├── Übergabeprotokoll
            └── Nebenkostenabrechnung
```
