

# PetManagerAkte — Komplett-Redesign der Anbieter-Detailseite

## Uebersicht

Die aktuelle `CaringProviderDetail.tsx` wird zur **PetManagerAkte** umgebaut — analog zur Immobilienakte ein eigenstaendiges Dossier mit eigener ID-Struktur. Das Layout wird mobilfreundlich und in vier Bereiche aufgeteilt.

## Neues Layout

```text
+----------------------------------------------------------+
|  [Zurueck]                                    PetManagerAkte |
+----------------------------------------------------------+
|                                                          |
|  OBERER BEREICH (2 Spalten, mobile: gestapelt)           |
|                                                          |
|  +------------------------+ +------------------------+   |
|  |  BILDERGALERIE          | |  PROFIL & INFO         |   |
|  |  (Kachel, w-1/2)       | |  (w-1/2)               |   |
|  |                        | |                        |   |
|  |  [Bild1] [Bild2]       | |  Firmenname            |   |
|  |  [Bild3] [Bild4]       | |  Adresse               |   |
|  |  [Bild5] [Bild6]       | |  Tel / E-Mail          |   |
|  |  [Bild7] [Bild8]       | |  Rating (Sterne)       |   |
|  |  [Bild9] [Bild10]      | |  "Ueber uns" Bio-Text  |   |
|  |                        | |                        |   |
|  |  Klick = Lightbox      | |                        |   |
|  +------------------------+ +------------------------+   |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  UNTERER BEREICH (2 Spalten, mobile: gestapelt)          |
|                                                          |
|  +------------------------+ +------------------------+   |
|  |  LEISTUNGEN            | |  KALENDER              |   |
|  |  (Auswahl-Kachel)      | |  (2 Monate sichtbar)   |   |
|  |                        | |                        |   |
|  |  ( ) Pension           | |  [  Februar 2026  ]    |   |
|  |  ( ) Tagesstaette      | |  [  Maerz 2026    ]    |   |
|  |  ( ) Gassi-Service     | |                        |   |
|  |  ( ) Hundesalon        | |  Gruen = verfuegbar    |   |
|  |  ( ) Welpenspielstunde | |  Rot   = ausgebucht    |   |
|  |                        | |                        |   |
|  |  Preis: 45 EUR/Tag     | |                        |   |
|  +------------------------+ +------------------------+   |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SLOT-AUSWAHL (erscheint nach Tagesklick)                |
|  Bei "Pension": VON-BIS Datumsauswahl (range)            |
|  Bei anderen: Einzeltag + Zeitslots                      |
|                                                          |
|  +----------------------------------------------------+  |
|  | Von: 15.03.2026   Bis: 20.03.2026  (bei Pension)   |  |
|  | ODER                                                |  |
|  | Datum: 15.03.2026  [09:00] [10:00] [14:00]          |  |
|  |                                                    |  |
|  | Tier: [Select]   Anmerkungen: [Textarea]           |  |
|  | [Termin anfragen]                                  |  |
|  +----------------------------------------------------+  |
|                                                          |
+----------------------------------------------------------+
```

## Technische Aenderungen

### 1. Bildergalerie-Kachel (mobilfreundlich)

- Ersetzt das einzelne Cover-Image durch ein **5x2 Grid** (max 10 Bilder)
- Auf Desktop: `grid-cols-5 grid-rows-2` innerhalb einer Card
- Auf Mobile: horizontal scrollbar (`overflow-x-auto flex gap-2`)
- Klick auf ein Bild oeffnet eine einfache Lightbox (Dialog mit grossem Bild)
- Bilder kommen aus einem neuen Feld `gallery_images TEXT[]` auf `pet_providers`
- Fallback: Gradient-Placeholder fuer leere Slots

### 2. Profil/Info rechts neben der Galerie

- Firmenname, Adresse, Telefon, E-Mail, Rating, Bio
- Bleibt inhaltlich wie bisher, nur Layout aendert sich (halbe Breite rechts)

### 3. Leistungen-Kachel (links unten)

- Eigene Card mit Radiobuttons fuer die verfuegbaren Services
- Laedt Services aus `pet_services` fuer diesen Provider
- Zeigt Preis pro ausgewaehltem Service
- Auswahl steuert den Kalender-Modus (Pension = Range, Rest = Single)

### 4. Kalender (rechts unten)

- **Zwei Monate** nebeneinander anzeigen (`numberOfMonths={2}`)
- Wenn "Pension/Boarding" gewaehlt: `mode="range"` mit Von-Bis-Auswahl
- Wenn anderer Service gewaehlt: `mode="single"` wie bisher
- Verfuegbarkeits-Faerbung bleibt (gruen/rot)

### 5. Slot-Auswahl / Buchungsbereich

- Bei Pension: Zeigt den gewaehlten Zeitraum (Von–Bis) an
- Bei Einzel-Services: Zeigt Zeitslots wie bisher
- Tier-Auswahl + Anmerkungen + "Termin anfragen" Button (weiterhin nur visuell)

### 6. Cross-Tenant-Fix fuer Availability und Services

Die Hooks `useProviderAvailability` und `useProviderServices` filtern aktuell nach `activeTenantId`. Ein Client-Tenant sieht damit keine Daten eines Provider-Tenants. Loesung: Neue Hooks `usePublicProviderAvailability(providerId)` und `usePublicProviderServices(providerId)` die **nur** nach `provider_id` filtern (ohne tenant_id). Die RLS-Policies auf diesen Tabellen erlauben bereits Lesen fuer authentifizierte User.

### 7. Datenbank-Migration

- `ALTER TABLE pet_providers ADD COLUMN gallery_images TEXT[] DEFAULT '{}'`

### 8. Demo-Engine

- Die PetManagerAkte-ID (`d0000000-...0050`) ist bereits in der Demo-Engine registriert
- Keine weiteren Engine-Aenderungen noetig

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| DB-Migration | `gallery_images TEXT[]` auf `pet_providers` |
| `src/pages/portal/pets/CaringProviderDetail.tsx` | Komplett-Umbau zum neuen 4-Bereich-Layout |
| `src/hooks/usePetProviderSearch.ts` oder neuer Hook | `usePublicProviderServices` + `usePublicProviderAvailability` ohne tenant_id-Filter |

