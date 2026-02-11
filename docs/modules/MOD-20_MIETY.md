# MOD-20: Miety (Home Dossier / Zuhause-Akte)

> **SSOT-Status:** Dieses Dokument reflektiert den IST-Zustand (Stand 2026-02-11).
> **Code-Referenz:** `src/pages/portal/MietyPortalPage.tsx`, `src/pages/portal/miety/MietyHomeDossier.tsx`

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/miety` |
| **Icon** | `Home` |
| **Org-Types** | `client` |
| **Requires Activation** | Ja |
| **Display Order** | 20 |

## Tiles (5 Tiles + 1 Dynamic Route)

### 1. Übersicht (Zuhause-Akte)
- **Route:** `/portal/miety/uebersicht`
- **Beschreibung:** Mieter-Dashboard mit Zuhause-Karten
- **Inhalte:**
  - Zuhause-Karten (miety_homes) mit Adresse, Typ, Fläche
  - Schnellzugriff auf Dossier-Detail
  - Auto-Create aus Profildaten

### 2. Versorgung
- **Route:** `/portal/miety/versorgung`
- **Beschreibung:** Strom, Gas, Wasser, Internet
- **Funktionen:**
  - Verträge verwalten (miety_contracts, Kategorie: strom/gas/wasser/internet)
  - Zählerstände erfassen (miety_meter_readings)
  - Anbieter-Übersicht
  - Quadratische Kacheln (aspect-square)

### 3. Versicherungen
- **Route:** `/portal/miety/versicherungen`
- **Beschreibung:** Hausrat & Haftpflicht
- **Funktionen:**
  - Versicherungs-Verträge (miety_contracts, Kategorie: hausrat/haftpflicht)
  - Quadratische Kacheln (aspect-square)

### 4. Smart Home
- **Route:** `/portal/miety/smarthome`
- **Beschreibung:** Eufy Smart Home Integration
- **Funktionen:**
  - Eufy-Konto verknüpfen (miety_eufy_accounts)
  - Kamera-Status anzeigen
  - Edge Function: `eufy-connect`

### 5. Kommunikation
- **Route:** `/portal/miety/kommunikation`
- **Beschreibung:** Kontakt zum Vermieter
- **Funktionen:**
  - WhatsApp-Integration (Deep Link)
  - E-Mail-Kontakt
  - KI-Übersetzer
  - Einladungscode-Feld (UI vorhanden, NICHT funktional)
- **⚠️ Bekannte Einschränkung:** Vermieter-Daten sind aktuell hardcoded ("Mueller Hausverwaltung GmbH"). Keine echte Vermieter-Verbindung.

### Dynamic Route: Zuhause-Detail
- **Route:** `/portal/miety/zuhause/:homeId`
- **Beschreibung:** Dossier-Detailansicht (MietyHomeDossier)
- **Inhalte:**
  - Accordion-basierte Akte (Adresse, Verträge, Zählerstände, Dokumente, Kommunikation)

## Datenmodell (IST-Zustand)

### Primäre Tabellen
- `miety_homes` — Zuhause-Akte (Adresse, Typ, Fläche, Zimmer)
- `miety_contracts` — Verträge (Versorgung + Versicherung, kategorisiert)
- `miety_meter_readings` — Zählerstände (Strom, Gas, Wasser, Heizung)
- `miety_eufy_accounts` — Smart Home Credentials (verschlüsselt)

### Beziehungen
- 1:N User → miety_homes
- 1:N miety_homes → miety_contracts
- 1:N miety_homes → miety_meter_readings
- 1:1 User → miety_eufy_accounts

## Cross-Modul Integration (IST-Zustand)

### Verbindung zu MOD-05 (MSV)
- `renter_invites` — Einladung durch Vermieter (DB-Insert vorhanden, Email-Versand NICHT implementiert)
- `leases.renter_org_id` — DB-Feld vorhanden, Cross-Tenant Erstellung NICHT implementiert

### ⚠️ Architektonische Lücken
1. **Kein Backbone (Z1):** MOD-05 → MOD-20 Handoff geht nicht über Zone 1
2. **Kein Cross-Tenant:** MOD-20 läuft im selben Tenant wie der Vermieter
3. **Kein Datenraum-Sharing:** Separate miety_*-Tabellen, keine gespiegelten Dokumente
4. **Kein Contract:** `CONTRACT_RENTER_INVITE` fehlt

### Ziel-Architektur (geplant)
- Einladung via Edge Function (Resend Email)
- Renter-Org Erstellung (eigener Tenant, org_type: renter)
- Cross-Tenant Datenraum via access_grants
- Echte Vermieter-Verbindung in Kommunikation
- Golden Path Engine-Integration (GP_VERMIETUNG.ts)

## Abhängigkeiten
- **MOD-05 (MSV):** Mietverhältnis-Daten, Einladungen
- **MOD-04 (Immobilien):** Objektdaten, Einheiten
- **MOD-03 (DMS):** Dokumenten-Zugang (geplant via access_grants)
