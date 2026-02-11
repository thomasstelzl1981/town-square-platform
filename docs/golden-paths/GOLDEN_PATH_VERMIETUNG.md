# Golden Path: Vermietung (MOD-04 → MOD-05 → MOD-20 Miety)

> **GP-ID:** GP-10
> **Pfad:** MOD-04 (Immobilie) → MOD-05 (MSV) → MOD-20 (Miety Portal)
> **SSOT-Status:** Code-Referenz geplant in `src/manifests/goldenPaths/GP_VERMIETUNG.ts`
> **Engine-Status:** NICHT REGISTRIERT (Prio 4)
> **Status:** IST-Analyse abgeschlossen, Engine-Einbettung ausstehend

---

## Übersicht

Der Vermietungsprozess führt von der Immobilienverwaltung (MOD-04) über die Miet- und Sonderverwaltung (MOD-05) bis zur Mieter-Interaktion (MOD-20 Miety Portal).

## IST-Zustand (Stand 2026-02-11)

### Was gebaut ist
- MOD-20 als Zone 2 Portal-Modul mit 5 Tiles (Übersicht, Versorgung, Versicherungen, Smart Home, Kommunikation)
- `renter_invites` Tabelle (DB-Insert durch MOD-05)
- `leases.renter_org_id` Feld in der Datenbank
- Miety-eigene Tabellen: `miety_homes`, `miety_contracts`, `miety_meter_readings`, `miety_eufy_accounts`

### Was FEHLT (Architektonische Lücken)
- **Kein Z1-Backbone:** MOD-05 → MOD-20 Flow geht nicht über Zone 1
- **Kein Cross-Tenant:** Renter-Org wird nicht erstellt, MOD-20 läuft im Vermieter-Tenant
- **Kein Datenraum-Sharing:** Separate Tabellen, keine gespiegelten Dokumente
- **Kein Email-Versand:** renter_invites ohne Edge Function
- **Kommunikation hardcoded:** Fake Vermieter-Daten

## Geplante Phasen (Engine-GP)

### Phase 1: Objekt-Vorbereitung (MOD-04)
- Immobilie mit Einheiten im Portfolio anlegen
- Vermietereinheit (Kontext) mit Steuerdaten konfigurieren

### Phase 2: Mietverhältnis anlegen (MOD-05)
- **Objekte-Tab:** Übersicht aller vermietbaren Einheiten
- **Vermietung-Tab:** Lease erstellen, Kontakt zuweisen
- MSV-Enrollment: `msv_enrollments` verknüpft Property mit MSV-Modul

### Phase 3: Mieter-Einladung (MOD-05 → Z1 → MOD-20)
- Einladung erstellen (`renter_invites`)
- **Z1 Backbone:** CONTRACT_RENTER_INVITE (geplant)
- Email-Versand via Edge Function (geplant)
- Renter-Org Provisioning via Z1 (geplant)

### Phase 4: Mieter-Onboarding (MOD-20)
- Mieter erhält Einladung und registriert sich
- Renter-Org (org_type: renter) wird erstellt
- Zugang zum Miety Portal mit:
  - Zuhause-Akte (auto-create aus Lease-Daten)
  - Versorgung & Versicherungen
  - Kommunikation mit echten Vermieter-Daten

### Phase 5: Datenraum-Sharing
- Access Grants für gemeinsame Dokumente (Mietvertrag, Übergabeprotokoll)
- Cross-Tenant Sichtbarkeit via `access_grants` (subject_type: organization)

### Phase 6: Laufende Verwaltung
- Mieteingang-Tracking (Premium Feature)
- Nebenkostenabrechnung
- Zählerstand-Erfassung (miety_meter_readings)
- Mieterhöhungen / Kündigungen

## GP-Bewertung (Entscheidungsmatrix)

| Kriterium | Erfüllt | Detail |
|-----------|---------|--------|
| 1. Cross-Zone Handoff | JA | Z2 (Vermieter) → Z1 → Z2 (Mieter) |
| 2. Multi-Modul Orchestrierung | JA | MOD-04 → MOD-05 → MOD-20 |
| 3. Status-Kette mit Gating | JA | Lease → Invite → Accept → Portal |
| 4. Externe I/O | JA | Email-Einladung (Resend) |
| 5. Camunda-Perspektive | MITTEL | Wait Message für Invite Accept |
| 6. Compliance / Audit | JA | DSGVO: Mieterdaten = PII |
| 7. Cross-Tenant Interaction | JA | Vermieter-Org → Renter-Org |

**Ergebnis:** 6 von 7 Kriterien erfüllt → **GOLDEN PATH PFLICHT**

## Datenfluss

```
properties (MOD-04)
  └── units
       └── msv_enrollments (MOD-05 Aktivierung)
       └── leases (Mietverträge)
            └── renter_invites (Mieter-Einladung)
                 └── [Z1 Backbone: CONTRACT_RENTER_INVITE]
                      └── renter_org (org_type: renter)
                           └── miety_homes (MOD-20)
                           └── access_grants (Datenraum)
```

## Contracts (geplant)
- `CONTRACT_RENTER_INVITE` — Z2 (MOD-05) → Z1 Handoff
- `CONTRACT_RENTER_ORG_PROVISION` — Z1 → Renter-Org Erstellung
- `CONTRACT_RENTER_DATA_ROOM` — Z1 → Access Grant für Datenraum

## DMS-Struktur
```
MOD_05/
  └── {property_public_id}/
       └── {unit}/
            ├── Mietvertrag
            ├── Übergabeprotokoll
            └── Nebenkostenabrechnung
```
