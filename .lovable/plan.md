
# Analyse: MOD-20 Miety — IST-Zustand, Dokumentationsluecken und GP-Bewertung

---

## 1. IST-Zustand: MOD-20 ist GEBAUT (aber anders als dokumentiert)

MOD-20 existiert als vollstaendiges Modul mit 5 Tiles (nicht 6 wie in der Doku):

```text
TILE                | ROUTE                          | STATUS
--------------------|--------------------------------|------------------
Uebersicht          | /portal/miety/uebersicht       | GEBAUT (Zuhause-Akte)
Versorgung          | /portal/miety/versorgung       | GEBAUT (Strom/Gas/Wasser/Internet)
Versicherungen      | /portal/miety/versicherungen   | GEBAUT (Hausrat/Haftpflicht)
Smart Home          | /portal/miety/smarthome        | GEBAUT (Eufy Kameras)
Kommunikation       | /portal/miety/kommunikation    | GEBAUT (WhatsApp/Email/Uebersetzer)
Zuhause/:homeId     | /portal/miety/zuhause/:homeId  | GEBAUT (Dossier-Detail)
```

DB-Tabellen (4 Miety-eigene):
```text
miety_homes           — Zuhause-Akte (Adresse, Typ, Flaeche)
miety_contracts       — Vertraege (Versorgung, Versicherung)
miety_meter_readings  — Zaehlerstaende
miety_eufy_accounts   — Smart Home Integration (Eufy)
```

---

## 2. Dokumentationsluecken (KRITISCH)

```text
DOKUMENT                              | PROBLEM
---------------------------------------|------------------------------------------------
docs/modules/MOD-20_MIETY.md          | Veraltet: beschreibt 6 Tiles inkl. "Dokumente"
                                       | und "Zaehlerstaende" als eigene Tiles.
                                       | Realitaet: 5 Tiles, "Zaehlerstaende" ist in
                                       | "Versorgung" integriert, "Dokumente" existiert
                                       | nicht als eigener Tile. "Smart Home" fehlt
                                       | komplett in der Doku.
                                       |
docs/modules/MOD-20_MIETY.md          | Datenmodell falsch: nennt "tenants",
                                       | "tenant_messages", "tenant_tickets" — diese
                                       | Tabellen existieren NICHT. Reale Tabellen
                                       | sind miety_homes, miety_contracts,
                                       | miety_meter_readings, miety_eufy_accounts.
                                       |
spec/current/00_frozen/SOFTWARE_       | Miety als "Extern / Andockpunkt" beschrieben.
FOUNDATION.md                          | FALSCH: Miety ist Zone 2 Portal-Modul
                                       | (/portal/miety), voll integriert.
                                       |
routesManifest.ts                      | KORREKT: 5 Tiles + 1 dynamic_route. Stimmt
                                       | mit Code ueberein.
                                       |
spec/current/06_api_contracts/         | KEIN Contract fuer MOD-05 -> MOD-20 Handoff
module_api_overview.md                 | (renter_invites). Nur informell erwaehnt.
                                       |
docs/golden-paths/                     | GOLDEN_PATH_VERMIETUNG.md existiert, aber
GOLDEN_PATH_VERMIETUNG.md             | ist NICHT engine-registriert und beschreibt
                                       | den idealen Zustand, nicht den IST-Zustand.
```

---

## 3. Cross-Modul Flow MOD-05 <-> MOD-20: IST-Analyse

Der tatsaechlich gebaute Flow:

```text
VERMIETER-SEITE (MOD-04/05)              MIETER-SEITE (MOD-20)
================================          ================================

MOD-04: Immobilie anlegen                 MOD-20: "Zuhause-Akte"
  |                                         |
  v                                         v
MOD-04 TenancyTab:                        Uebersicht: Auto-Create aus
  - Lease anlegen (leases)                  Profildaten (miety_homes)
  - Kontakt zuweisen                        |
  |                                         v
  v                                       Versorgung: Eigene Vertraege
"Einladen" Button                           (miety_contracts, Kategorie
  |                                          strom/gas/wasser/internet)
  v                                         |
renter_invites (DB Insert)                  v
  - lease_id                              Versicherungen: Eigene Vertraege
  - contact_id                              (miety_contracts, Kategorie
  - email                                   hausrat/haftpflicht)
  |                                         |
  v                                         v
??? (Kein Edge Function,                  Smart Home: Eufy-Kameras
     kein Email-Versand                     (miety_eufy_accounts)
     implementiert!)                        |
                                            v
                                          Kommunikation: WhatsApp/Email
                                            HARDCODED Vermieter-Daten!
                                            ("Mueller Hausverwaltung GmbH")
                                            Einladungscode-Feld vorhanden
                                            aber NICHT funktional.
```

---

## 4. Architektonische Befunde

```text
BEFUND                                  | SCHWERE  | DETAIL
----------------------------------------|----------|----------------------------------
A) KEIN Backbone (Z1) im Flow           | HOCH     | MOD-05 schreibt direkt in
                                        |          | renter_invites. Kein Z1-Governance,
                                        |          | kein Contract, kein Ledger-Event.
                                        |          |
B) Kein Cross-Tenant implementiert      | HOCH     | renter_org_id existiert in leases
                                        |          | (DB-Feld), aber die renter-org
                                        |          | Erstellung passiert NICHT.
                                        |          | MOD-20 laeuft aktuell im SELBEN
                                        |          | Tenant wie der Vermieter.
                                        |          |
C) Kein Datenraum-Sharing               | MITTEL   | Mieter und Vermieter teilen sich
                                        |          | KEINE Dokumente. MOD-20 hat eigene
                                        |          | Tabellen (miety_*), die vom
                                        |          | Vermieter-Datenbestand isoliert
                                        |          | sind. Der "gemeinsame Datenraum"
                                        |          | existiert NICHT.
                                        |          |
D) Kommunikation ist Hardcoded          | MITTEL   | "Mueller Hausverwaltung GmbH" +
                                        |          | fake Kontaktdaten. Keine echte
                                        |          | Vermieter-Verbindung.
                                        |          |
E) Einladungs-Email nicht implementiert | MITTEL   | renter_invites wird in DB
                                        |          | geschrieben, aber kein Edge
                                        |          | Function / Resend fuer Email.
                                        |          |
F) Doku-Drift                           | HOCH     | MOD-20_MIETY.md beschreibt
                                        |          | falsches Datenmodell, falsche
                                        |          | Tiles, falschen Status ("Extern").
                                        |          |
G) Doppelte Route                       | NIEDRIG  | MietyPortalPage.tsx Zeile 1079+1080
                                        |          | hat "kommunikation" Route doppelt.
```

---

## 5. Golden Path Bewertung: GP-10 Vermietung

Basierend auf der Entscheidungsmatrix:

```text
KRITERIUM                          | ERFUELLT? | DETAIL
-----------------------------------|-----------|-----------------------------
1. Cross-Zone Handoff              | JA        | Z2 (Vermieter) -> Z2 (Mieter)
                                   |           | = Cross-Tenant, muss ueber Z1
2. Multi-Modul Orchestrierung      | JA        | MOD-04 -> MOD-05 -> MOD-20
3. Status-Kette mit Gating         | JA        | Lease -> Invite -> Accept ->
                                   |           | Portal-Zugang -> Datenraum
4. Externe I/O                     | JA        | Email-Einladung (Resend)
5. Camunda-Perspektive             | MITTEL    | Wait Message fuer Invite Accept
6. Compliance / Audit              | JA        | DSGVO: Mieterdaten = PII
7. Cross-Tenant Interaction        | JA(!)     | Vermieter-Org -> Renter-Org
                                   |           | = Kern-Anwendungsfall

ERGEBNIS: 6 von 7 Kriterien erfuellt
=> GOLDEN PATH PFLICHT (nicht "spaeter"!)
```

Korrektur zur bisherigen Einstufung:
Die Einstufung "GP-10 = SPAETER, warten auf MOD-20" war FALSCH.
MOD-20 ist gebaut. Der Flow ist teilweise implementiert (renter_invites,
leases.renter_org_id). Was fehlt ist die Backbone-Konformitaet und
der tatsaechliche Cross-Tenant-Mechanismus.

---

## 6. Empfehlung: Was jetzt zu tun ist

```text
PRIORITAET | AKTION                              | AUFWAND
-----------|--------------------------------------|--------
SOFORT     | docs/modules/MOD-20_MIETY.md         | KLEIN
           | aktualisieren auf IST-Zustand        |
           | (5 Tiles, korrekte Tabellen,          |
           | Zone 2, nicht "Extern")               |
           |                                      |
SOFORT     | SOFTWARE_FOUNDATION.md               | KLEIN
           | korrigieren: Miety = Zone 2           |
           | Portal-Modul, nicht "Extern"          |
           |                                      |
SOFORT     | Doppelte Route in                    | TRIVIAL
           | MietyPortalPage.tsx Z.1080 entfernen  |
           |                                      |
RUNDE 1    | GP-10 Vermietung als Engine-GP        | MITTEL
(mit       | erstellen (GP_VERMIETUNG.ts)          |
Prio 1-3)  | mit Backbone-Touchpoints:             |
           | - Z2 Invite -> Z1 Governance          |
           | - Z1 -> Renter-Org Provisioning       |
           | - Z1 -> Datenraum Access Grant        |
           |                                      |
RUNDE 1    | CONTRACT_RENTER_INVITE.md             | KLEIN
           | erstellen (Z2->Z1 Handoff)            |
           |                                      |
SPAETER    | Tatsaechliche Implementierung:        | GROSS
           | - Edge Function fuer Invite-Email     |
           | - Renter-Org Erstellung               |
           | - Cross-Tenant Datenraum              |
           | - Echte Vermieter-Verbindung           |
           | in Kommunikation statt Hardcode       |
```

---

## 7. Aktualisierte Golden Path Prioritaetsliste

```text
PRIORITAET | GP                    | AKTION
-----------|-----------------------|----------------------------
Fertig     | MOD-04 Immobilien     | Engine-registriert
Prio 1     | Finanzierung (07/11)  | Engine-Definition erstellen
Prio 2     | Akquise Mandat (08/12)| Engine-Definition erstellen
Prio 3     | Projekte (MOD-13)     | Engine-Definition erstellen
Prio 4     | Vermietung (05/20)    | HOCHGESTUFT von "spaeter"!
           |                       | MOD-20 ist gebaut, GP noetig
Prio 5     | Lead-Generierung      | Engine-Definition erstellen
Spaeter    | Sanierung             | Optional, bei Camunda
Kein GP    | Social Mandate        | Contract reicht
Kein GP    | Data Room Access      | Contract reicht
Kein GP    | Onboarding            | Contract reicht
```

---

## 8. Zusammenfassung

MOD-20 Miety ist funktional gebaut als "Home Dossier" (Zuhause-Akte)
mit eigenem Datenbestand (miety_*). Der Cross-Modul-Flow MOD-05 -> MOD-20
ist teilweise implementiert (renter_invites + leases.renter_org_id),
aber:

1. NICHT backbone-konform (kein Z1 Governance)
2. NICHT cross-tenant (laeuft im selben Tenant)
3. NICHT dokumentiert (Doku ist veraltet/falsch)
4. KEIN gemeinsamer Datenraum (separate Tabellen)

Die Einstufung als "spaeter" in der GP-Inventur muss auf PRIO 4
korrigiert werden. MOD-20 existiert, und der Flow braucht einen
Golden Path mit Backbone-Touchpoints.
