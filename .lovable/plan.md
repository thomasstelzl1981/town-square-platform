
# Analyse: Manager-Module, Client-Module und Zone 1 Operative Desks

## Architektur-Regel

```text
Client (Zone 2)  -->  Operative Desk (Zone 1)  -->  Manager (Zone 2)
     MOD-XX              Z1 Desk                      MOD-YY
```

Kunden haben nur Client-Module. Manager haben zusaetzlich ein Manager-Modul. Jede Verbindung zwischen Client und Manager MUSS ueber ein Zone-1-Desk laufen. Kein direkter Z2-zu-Z2-Kontakt.

---

## IST-Zustand: Mapping-Tabelle

| # | Client-Modul (Z2) | Zone 1 Desk | Manager-Modul (Z2) | Operative Desk Manifest | Status |
|---|-------------------|-------------|--------------------|-----------------------|--------|
| 1 | MOD-07 Finanzierung | FutureRoom | MOD-11 Finanzierungsmanager | Registriert (futureroom → MOD-11) | OK |
| 2 | MOD-08 Investment-Suche | Acquiary | MOD-12 Akquisemanager | Registriert (acquiary → MOD-12) | OK |
| 3 | MOD-06 Verkauf | Sales Desk | MOD-09 Immomanager | Registriert (sales-desk → MOD-09) | OK |
| 4 | MOD-05 Pets (Service) | Pet Desk | MOD-22 Pet Manager | FEHLER: Registriert als MOD-05, nicht MOD-22 | PROBLEM |
| 5 | MOD-13 Projektmanager | Projekt Desk | MOD-13 Projektmanager | Registriert (projekt-desk → MOD-13) | UNKLAR |
| 6 | Leads (Z3 Websites) | Lead Desk | MOD-10 Lead Manager | Registriert (lead-desk → MOD-10) | OK |
| 7 | MOD-18 Finanzen | Finance Desk | ??? | FEHLT im Operative Desk Manifest | PROBLEM |
| 8 | MOD-04 Immobilien | ??? | ??? | Kein Desk vorhanden | OFFEN |

---

## Gefundene Probleme

### Problem 1: Pet Desk zeigt auf falsches Modul

In `operativeDeskManifest.ts`:
```text
Pet Desk → managerModuleCode: 'MOD-05' (Pets = CLIENT/Service-Modul)
```

**Korrekt muesste es sein:**
```text
Pet Desk → managerModuleCode: 'MOD-22' (Pet Manager = MANAGER-Modul)
```

MOD-05 (Pets) ist das Client/Service-Modul, in dem Tierhalter ihre Haustiere verwalten. MOD-22 (Pet Manager) ist das Manager-Modul fuer Franchise-Partner. Der Desk muss also BEIDE referenzieren:
- `clientModuleCode: 'MOD-05'` (Tierhalter-Seite)
- `managerModuleCode: 'MOD-22'` (Franchise-Partner-Seite)

### Problem 2: Finance Desk fehlt im Manifest

In `routesManifest.ts` existieren Routes fuer `finance-desk` (Z1):
```text
/admin/finance-desk          → Dashboard
/admin/finance-desk/inbox    → Inbox
/admin/finance-desk/zuweisung → Zuweisung
/admin/finance-desk/faelle   → Faelle
/admin/finance-desk/monitor  → Monitor
```

**Aber:** Der Finance Desk ist NICHT in `operativeDeskManifest.ts` registriert. Es fehlt die formale 1:1:1-Zuordnung:
- Client: MOD-18 (Finanzen) — Kunde verwaltet Konten, Versicherungen, Vorsorge
- Z1 Desk: finance-desk — Governance ueber Finanzberater-Zuweisungen
- Manager: ??? — Kein separates Manager-Modul vorhanden

**Frage:** Wird MOD-18 zukuenftig ein Manager-Pendant erhalten? Oder handelt Finance Desk die Governance direkt (ohne Z2-Manager)?

### Problem 3: MOD-13 ist hybrid (Client + Manager)

`routesManifest.ts` zeigt:
```text
MOD-13: visibility: { org_types: ["client", "partner"] }
```

MOD-13 ist sowohl fuer Clients als auch fuer Partner sichtbar. Wenn ein Client ein Projekt erstellt und ein Manager es uebernimmt, laufen beide im selben Modul. Das widerspricht dem Prinzip, dass Client- und Manager-Module getrennt sind.

**Moegliche Loesung:** MOD-13 als reines Manager-Modul definieren. Clients interagieren mit Projekten ueber MOD-08 (Investment-Suche, als Kaeufer) oder MOD-06 (Verkauf, als Eigentuemer). Der Projekt Desk (Z1) routet zwischen diesen.

### Problem 4: Operative Desk Manifest kennt kein `clientModuleCode`

Das aktuelle Interface `OperativeDeskDefinition` hat nur:
```text
managerModuleCode: string    // Z2 Manager
websiteProfileId: string     // Z3 Website
```

Es fehlt:
```text
clientModuleCode: string     // Z2 Client-Pendant
```

Ohne dieses Feld kann das System die vollstaendige Z2-Client ↔ Z1-Desk ↔ Z2-Manager Kette nicht programmatisch abbilden.

### Problem 5: MOD-04 Immobilien hat kein Desk

MOD-04 (Immobilien) ist das zentrale Client-Modul fuer Immobilienbesitzer. Es gibt kein dediziertes Z1-Desk dafuer. Aktuell fliesst die Governance indirekt:
- Verkauf (MOD-06) → Sales Desk → MOD-09
- Investment (MOD-08) → Acquiary → MOD-12
- Finanzierung (MOD-07) → FutureRoom → MOD-11

MOD-04 selbst hat jedoch keinen eigenen Desk, da es rein private Daten verwaltet (Portfolio, BWA, Steuer). Das ist architektonisch korrekt — MOD-04 hat keine Manager-Interaktion, es ist ein reines Self-Service-Modul.

---

## Vollstaendiges Ziel-Mapping

| Client-Modul | Funktion | Z1 Desk | Manager-Modul | Z3 Website |
|-------------|----------|---------|---------------|------------|
| MOD-07 Finanzierung | Selbstauskunft + Anfrage erstellen | FutureRoom | MOD-11 FM | finance_broker |
| MOD-08 Investment-Suche | Objekte suchen + Mandat erteilen | Acquiary | MOD-12 Akquise | acquisition_agent |
| MOD-06 Verkauf | Immobilie zum Verkauf listen | Sales Desk | MOD-09 Immomanager | sales_partner |
| MOD-05 Pets | Haustiere verwalten + Services buchen | Pet Desk | MOD-22 Pet Manager | pet_services |
| MOD-18 Finanzen | Konten/Versicherungen/Vorsorge | Finance Desk | (keiner / TBD) | (keiner) |
| MOD-04 Immobilien | Portfolio, BWA, Steuer | (keiner — Self-Service) | (keiner) | (keiner) |
| (Z3 Leads) | Website-Kontaktformulare | Lead Desk | MOD-10 Lead Manager | (alle Z3 Sites) |
| (Z3 Projekte) | Projekt-Landing-Pages | Projekt Desk | MOD-13 Projektmanager | project_developer |

---

## Empfohlene Aenderungen

### 1. `operativeDeskManifest.ts` — Interface erweitern

Neues Feld `clientModuleCode` hinzufuegen, um die vollstaendige Dreierkette abzubilden:

```text
OperativeDeskDefinition {
  deskId: string;
  displayName: string;
  managerModuleCode: string;     // Z2 Manager
  clientModuleCode: string;      // Z2 Client (NEU)
  websiteProfileId: string;      // Z3 Website
  ...
}
```

### 2. Pet Desk korrigieren

```text
Pet Desk:
  clientModuleCode: 'MOD-05'    // Pets (Tierhalter)
  managerModuleCode: 'MOD-22'   // Pet Manager (Franchise-Partner)
```

### 3. Finance Desk registrieren

```text
{
  deskId: 'finance-desk',
  displayName: 'Finance Desk',
  clientModuleCode: 'MOD-18',    // Finanzen (Kunde)
  managerModuleCode: '',         // Kein Manager-Modul (vorerst)
  websiteProfileId: '',
  route: 'finance-desk',
  icon: 'LineChart',
  responsibilities: [
    'Finanzberater-Zuweisung',
    'Service-Portfolio-Governance',
    'Kunden-Intake-Triage',
    'Monitoring',
  ],
}
```

### 4. Alle bestehenden Desks um `clientModuleCode` ergaenzen

| Desk | clientModuleCode | managerModuleCode |
|------|-----------------|-------------------|
| Sales Desk | MOD-06 | MOD-09 |
| Lead Desk | (Z3 only) | MOD-10 |
| Pet Desk | MOD-05 | MOD-22 (FIX!) |
| FutureRoom | MOD-07 | MOD-11 |
| Acquiary | MOD-08 | MOD-12 |
| Projekt Desk | (Z3 only) | MOD-13 |
| Finance Desk (NEU) | MOD-18 | (keiner) |

### 5. MOD-13 Visibility klaeren

MOD-13 hat `org_types: ["client", "partner"]`. Wenn es ein reines Manager-Modul sein soll, aendern zu `["partner"]`. Clients interagieren mit Projekten ueber MOD-08 (Suche) oder MOD-06 (Verkauf).

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/operativeDeskManifest.ts` | Interface um `clientModuleCode` erweitern, Pet Desk korrigieren (MOD-22), Finance Desk hinzufuegen |
| `src/manifests/routesManifest.ts` | MOD-13 visibility pruefen (client + partner → nur partner?) |
| Keine weiteren Dateien | Die Helpers `getDeskByModule()` etc. funktionieren weiterhin, neuer Helper `getDeskByClientModule()` hinzufuegen |

