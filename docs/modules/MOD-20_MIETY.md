# MOD-20: Miety

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/miety` |
| **Icon** | `Home` |
| **Org-Types** | `client` |
| **Requires Activation** | Ja |
| **Display Order** | 20 |

## ⚠️ EXCEPTION: 6 Tiles

**MOD-20 ist die einzige Ausnahme vom 4-Tile-Pattern.** Das Mieter-Portal benötigt 6 funktionale Bereiche für eine vollständige Mieter-Experience.

## Beschreibung

Miety ist das Mieter-Portal für Endnutzer. Es ermöglicht Mietern die Verwaltung ihrer Wohnung, Kommunikation mit dem Vermieter, Zählerstandserfassung und Versorgungsmanagement.

## Tiles (6-Tile-Exception)

### 1. Übersicht
- **Route:** `/portal/miety/uebersicht`
- **Beschreibung:** Mieter-Dashboard
- **Inhalte:**
  - Wohnungsübersicht
  - Nächste Termine
  - Offene Aufgaben
  - Wichtige Mitteilungen

### 2. Dokumente
- **Route:** `/portal/miety/dokumente`
- **Beschreibung:** Mietvertrag & Unterlagen
- **Inhalte:**
  - Mietvertrag
  - Nebenkostenabrechnungen
  - Hausordnung
  - Protokolle

### 3. Kommunikation
- **Route:** `/portal/miety/kommunikation`
- **Beschreibung:** Chat mit Vermieter
- **Funktionen:**
  - Nachrichten
  - Schadensmeldungen
  - Terminanfragen
  - Reparatur-Tickets

### 4. Zählerstände
- **Route:** `/portal/miety/zaehlerstaende`
- **Beschreibung:** Verbrauchserfassung
- **Funktionen:**
  - Zähler-Ablesung
  - Foto-Upload
  - Verbrauchshistorie
  - Vergleich zum Vorjahr

### 5. Versorgung
- **Route:** `/portal/miety/versorgung`
- **Beschreibung:** Strom, Gas, Wasser
- **Funktionen:**
  - Anbieter-Übersicht
  - Tarif-Vergleich
  - Anbieterwechsel
  - Verbrauchsoptimierung

### 6. Versicherungen
- **Route:** `/portal/miety/versicherungen`
- **Beschreibung:** Hausrat & Haftpflicht
- **Funktionen:**
  - Versicherungs-Übersicht
  - Angebotsvergleich
  - Schadensmeldung
  - Dokumente

## Datenmodell

### Primäre Tabellen
- `tenants` — Mieter-Daten
- `leases` — Mietverhältnisse (aus MOD-05)
- `meter_readings` — Zählerstände (zu erstellen)
- `tenant_messages` — Kommunikation
- `tenant_tickets` — Schadensmeldungen

### Beziehungen
- 1:1 Mieter → Mietverhältnis (aktiv)
- 1:N Mietverhältnis → Zählerstände
- 1:N Mieter → Messages/Tickets

## Integration

### Abhängigkeiten
- **MOD-05 (MSV):** Mietverhältnis-Daten
- **MOD-04 (Immobilien):** Objektdaten
- **MOD-03 (DMS):** Dokumenten-Zugang

### Mieter-Zugang
- Einladung durch Vermieter via `/miety/invite`
- Eigene `client`-Organisation vom Typ `renter`
- Eingeschränkte Sichtbarkeit auf eigene Wohnung
