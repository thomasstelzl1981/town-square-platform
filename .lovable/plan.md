
# Architekturplan: Manager-Tenant-Lifecycle und Cross-Tenant-Orchestrierung

## 1. Ueberblick: Das Gesamtbild

Das System bedient zwei fundamental verschiedene Nutzergruppen in Zone 2:

- **Kunden (Clients):** Privatpersonen/Unternehmen die ihre Immobilien, Finanzen, Dokumente verwalten. Registrieren sich selbst. Erhalten 14 Basis-Module.
- **Manager (Partner):** Freiberufliche Spezialisten die im Auftrag der Plattform Kunden betreuen. Werden von Zone 1 freigeschaltet. Erhalten 14 Basis-Module PLUS ihr jeweiliges Manager-Modul.

Kunden und Manager sehen sich **niemals** direkt. Jede Interaktion laeuft ueber Zone 1 (Backbone-Orchestrierung).

### Die 6 Manager-Module (korrigierte Zuordnung)

| Manager-Modul | Code | Rolle | Zone-1-Desk | Client-Modul (Gegenstueck) |
|---|---|---|---|---|
| Immo-Manager (Vertrieb) | MOD-09 | sales_partner | Sales Desk | MOD-06 (Verkauf) |
| Lead Manager | MOD-10 | sales_partner | Lead Desk | -- (Z3-Intake) |
| Finanzierungsmanager | MOD-11 | finance_manager | FutureRoom | MOD-07 (Finanzierung) |
| Akquise-Manager | MOD-12 | akquise_manager | Acquiary | MOD-08 (Investment-Suche) |
| Projektmanager | MOD-13 | super_user* | Projekt Desk | -- (kein Client-Modul) |
| Pet Manager | MOD-22 | super_user* | Pet Desk | MOD-05 (Pets) |

*MOD-13 und MOD-22 haben aktuell keine dedizierte membership_role -- das ist einer der zu loesenden Punkte.

### Datenfluss-Prinzip

```text
KUNDE (Client-Tenant)                    MANAGER (Partner-Tenant)
   |                                           |
   |  "Ich brauche eine Finanzierung"          |  "Ich betreue Kunden"
   |                                           |
   v                                           v
MOD-07: Finanzierungsanfrage              MOD-11: Manager-Workbench
   |                                           ^
   |  Status: 'submitted'                     |
   v                                           |
   +--------> ZONE 1 (FutureRoom Desk) --------+
              - Triage
              - Manager-Zuweisung
              - org_link erstellen
              - org_delegation erteilen
```

---

## 2. Ist-Zustand (Infrastruktur-Analyse)

### Was existiert und funktioniert

| Baustein | Status | Details |
|---|---|---|
| `organizations` Tabelle | Vorhanden | org_type enum: internal, partner, sub_partner, client, renter |
| `memberships` Tabelle | Vorhanden | membership_role enum: org_admin, sales_partner, finance_manager, akquise_manager, ... |
| `org_links` Tabelle | Vorhanden, LEER | from_org_id, to_org_id, link_type (manages/delegates_to), status |
| `org_delegations` Tabelle | Vorhanden, LEER | delegate_org_id, target_org_id, scopes (jsonb), status, expires_at |
| `tenant_tile_activation` | Vorhanden | tile_code + status pro Tenant |
| `get_tiles_for_role()` | Vorhanden | Mappt membership_role auf Tile-Array |
| `my_scope_org_ids()` | Vorhanden | Rekursive Funktion: eigene Org + Children + org_links (manages/delegates_to) |
| `handle_new_user()` | Vorhanden | Erstellt Client-Tenant (org_type=client, role=org_admin, 14 Basis-Tiles) |
| `operativeDeskManifest.ts` | Vorhanden | 7 Desks mit Client-Modul ↔ Z1-Desk ↔ Manager-Modul Mapping |

### Was FEHLT

| Luecke | Auswirkung |
|---|---|
| Kein Manager-Signup-Flow | Manager koennen sich nicht registrieren und die richtigen Module bekommen |
| Keine membership_role fuer MOD-13 und MOD-22 | Projektmanager und Pet Manager haben keine dedizierte Rolle |
| org_links/org_delegations sind leer | Cross-Tenant-Sichtbarkeit ist nicht getestet |
| Kein Zone-1-UI fuer Manager-Freischaltung | Admin kann keine Manager-Tenants erstellen/freischalten |
| Kein Golden Path fuer den Manager-Lifecycle | Der Prozess Signup → Verifizierung → Freischaltung → Kundenzuweisung ist nicht formalisiert |
| get_tiles_for_role() kennt MOD-22 nicht | Pet Manager ist nicht im Tile-Set enthalten |
| Kein Delegations-Scoping | org_delegations.scopes ist jsonb ohne definiertes Schema |

---

## 3. Architektur-Entscheidungen

### 3.1 Neue Rollen fuer MOD-13 und MOD-22

Aktuell fehlen dedizierte membership_roles. Vorschlag:

| Modul | Neue membership_role | Tiles |
|---|---|---|
| MOD-13 Projektmanager | `project_manager` | 14 Basis + MOD-13 |
| MOD-22 Pet Manager | `pet_manager` | 14 Basis + MOD-22 |

Dies erfordert:
- Enum-Erweiterung: `ALTER TYPE membership_role ADD VALUE 'project_manager'` und `'pet_manager'`
- `get_tiles_for_role()` erweitern
- `rolesMatrix.ts` aktualisieren
- `ROLE_EXTRA_TILES` erweitern

### 3.2 Manager-Signup-Flow (3 Phasen)

**Phase A -- Selbstregistrierung (Zone 3/Public)**
1. Manager registriert sich ueber normalen Signup
2. System erstellt Client-Tenant (org_type=client, 14 Basis-Module) -- wie bisher
3. Manager beantragt "Manager-Status" ueber ein Formular (z.B. unter Stammdaten oder separater Route)
4. Antrag wird in einer neuen Tabelle `manager_applications` gespeichert

**Phase B -- Verifizierung (Zone 1)**
1. Zone 1 Admin sieht den Antrag im entsprechenden Operative Desk
2. Admin prueft Qualifikationen (§34i GewO fuer Finanzierung, etc.)
3. Admin genehmigt oder lehnt ab

**Phase C -- Freischaltung (Zone 1, automatisiert)**
Bei Genehmigung:
1. `organizations.org_type` von 'client' auf 'partner' aendern
2. `memberships.role` auf die passende Manager-Rolle aendern (z.B. finance_manager)
3. Manager-Modul-Tile aktivieren in `tenant_tile_activation`
4. Optional: `user_roles` Eintrag fuer app_role

### 3.3 Kunden-Zuweisung (Zone 1 Orchestrierung)

Wenn ein Kunde eine Anfrage stellt (z.B. Finanzierungsantrag):
1. Anfrage landet im Zone-1-Desk (z.B. FutureRoom)
2. Admin weist einen Manager zu
3. System erstellt `org_link` (from: Manager-Org, to: Client-Org, link_type: 'manages', status: 'active')
4. System erstellt `org_delegation` (delegate: Manager-Org, target: Client-Org, scopes: {modules: ['MOD-07'], read: true, write: false})
5. `my_scope_org_ids()` gibt dem Manager nun Sichtbarkeit auf die Client-Daten (gemaess Scopes)

### 3.4 Delegations-Schema (scopes)

```text
org_delegations.scopes = {
  "modules": ["MOD-07"],      // Welche Module-Daten sichtbar sind
  "access_level": "read",     // read | read_write
  "entity_types": ["finance_requests", "applicant_profiles", "documents"],
  "expires_days": 365         // Auto-Expiry
}
```

---

## 4. Benoetigte Golden Paths und Engines

### 4.1 Neuer Golden Path: GP-MANAGER-LIFECYCLE

Dies ist ein Cross-Zone Engine-Workflow (wie GP-LEAD oder GP-FINANCE-Z3):

```text
GP-MANAGER-LIFECYCLE
  Phase 1: APPLICATION (Z2 → Z1)
    Step 1: manager_application_submitted (user_task, Z2)
    Step 2: application_received_at_desk (service_task, Z1)
    
  Phase 2: VERIFICATION (Z1)
    Step 3: qualification_check (user_task, Z1)
    Step 4: compliance_review (user_task, Z1)
    Fail: on_rejected → notify_applicant, status='rejected'
    
  Phase 3: ACTIVATION (Z1)
    Step 5: org_type_upgrade (service_task, Z1)
    Step 6: tile_activation (service_task, Z1)
    Step 7: welcome_notification (service_task, Z1)
    
  Phase 4: ASSIGNMENT (Z1 → Z2)
    Step 8: first_client_assigned (wait_message, Z1)
    Step 9: org_link_created (service_task, Z1)
    Step 10: delegation_granted (service_task, Z1)
    
  Success: manager_active_with_clients
  
  Fail-States:
    on_timeout: 14d ohne Reaktion → Erinnerung
    on_rejected: Ablehnungsgrund + Re-Apply-Option
    on_error: Rollback org_type + Tiles
```

### 4.2 Neuer Golden Path: GP-CLIENT-ASSIGNMENT

Fuer die Zuweisung eines Kunden an einen Manager (wiederkehrender Prozess):

```text
GP-CLIENT-ASSIGNMENT
  Step 1: client_request_received (service_task, Z2-Client)
  Step 2: desk_triage (user_task, Z1)
  Step 3: manager_selected (user_task, Z1)
  Step 4: org_link_created (service_task, Z1)
  Step 5: delegation_scoped (service_task, Z1)
  Step 6: manager_notified (service_task, Z1)
  Step 7: manager_accepts (user_task, Z2-Manager)
  
  Fail-States:
    on_timeout: 48h → Re-Route an anderen Manager
    on_rejected: Manager lehnt ab → zurueck zu Step 3
    on_error: Delegation widerrufen
```

### 4.3 Keine neue Engine noetig

Die Manager-Freischaltung ist ein Governance-Workflow, keine Kalkulation. Die bestehende Golden Path Engine (ENG-GOLDEN) reicht aus. Die Logik (org_type aendern, Tiles aktivieren, org_link erstellen) sind DB-Operationen, keine Berechnungen.

---

## 5. Datenbank-Aenderungen

### 5.1 Neue Tabelle: manager_applications

```text
manager_applications
  id: uuid (PK)
  tenant_id: uuid (FK organizations)
  user_id: uuid (FK auth.users)
  requested_role: membership_role
  qualification_data: jsonb  -- Zertifikate, §34i Nachweis, etc.
  status: text  -- draft, submitted, in_review, approved, rejected
  reviewed_by: uuid
  reviewed_at: timestamptz
  rejection_reason: text
  created_at: timestamptz
  updated_at: timestamptz
```

### 5.2 Enum-Erweiterungen

```text
ALTER TYPE membership_role ADD VALUE 'project_manager';
ALTER TYPE membership_role ADD VALUE 'pet_manager';
```

### 5.3 get_tiles_for_role() erweitern

```text
WHEN 'project_manager' THEN RETURN base_tiles || ARRAY['MOD-13'];
WHEN 'pet_manager' THEN RETURN base_tiles || ARRAY['MOD-22'];
```

### 5.4 Delegations-Scope-Validierung

Eine DB-Funktion die prueft ob ein Manager auf bestimmte Daten zugreifen darf:

```text
has_delegation_scope(manager_org_id, client_org_id, module_code) → boolean
```

---

## 6. Implementierungs-Phasenplan

### Phase 1: Fundament (jetzt umsetzbar)

| # | Aufgabe | Dateien |
|---|---|---|
| 1 | DB-Migration: membership_role enum + get_tiles_for_role() + manager_applications Tabelle | Migration SQL |
| 2 | rolesMatrix.ts aktualisieren: project_manager + pet_manager Rollen | src/constants/rolesMatrix.ts |
| 3 | Golden Path Definition: GP-MANAGER-LIFECYCLE + GP-CLIENT-ASSIGNMENT | src/manifests/goldenPaths/ |
| 4 | Golden Path Registry aktualisieren | spec/current/07_golden_paths/GOLDEN_PATH_REGISTRY.md |
| 5 | Context Resolver: GP-MANAGER-LIFECYCLE (prueft manager_applications Status) | src/goldenpath/contextResolvers.ts |

### Phase 2: Zone-1-UI (spaetere Phase)

| # | Aufgabe | Wo |
|---|---|---|
| 6 | Manager-Antraege im jeweiligen Desk anzeigen | Zone 1 Admin |
| 7 | Genehmigungs-Workflow mit org_type Upgrade + Tile-Aktivierung | Zone 1 Admin |
| 8 | Kunden-Zuweisung UI (org_link + org_delegation erstellen) | Zone 1 Desk |

### Phase 3: Zone-2-UI (spaetere Phase)

| # | Aufgabe | Wo |
|---|---|---|
| 9 | Manager-Bewerbungsformular (unter Stammdaten oder separater Route) | Zone 2 Portal |
| 10 | Manager-Dashboard: zugewiesene Kunden sehen | Manager-Module |
| 11 | RLS-Erweiterung: my_scope_org_ids() + has_delegation_scope() in relevanten Policies | DB |

### Phase 4: Demo-Daten und Testing

| # | Aufgabe |
|---|---|
| 12 | Demo-Manager-Tenant erstellen (org_type=partner, role=finance_manager) |
| 13 | Demo-org_link zwischen Golden Tenant und Manager-Tenant |
| 14 | Demo-org_delegation mit konkreten Scopes |
| 15 | E2E-Test: Manager sieht Client-Daten nur im zugewiesenen Scope |

---

## 7. Was NICHT geaendert wird

- Bestehende Client-Module (alle frozen ausser MOD-04, MOD-13, MOD-18)
- Bestehende Manager-Module (Implementierung bleibt, nur Zugangssteuerung wird formalisiert)
- handle_new_user() -- bleibt unveraendert (erstellt weiterhin Client-Tenants)
- Zone-3-Websites (keine Aenderung)
- Bestehende Engine-Workflows (MOD-04, MOD-07, etc.)

---

## 8. Zusammenfassung

| Entscheidung | Empfehlung |
|---|---|
| Neue Engine? | Nein -- Governance-Workflow, keine Kalkulation |
| Neue Golden Paths? | Ja -- GP-MANAGER-LIFECYCLE + GP-CLIENT-ASSIGNMENT |
| Neue DB-Tabelle? | Ja -- manager_applications |
| Neue Rollen? | Ja -- project_manager + pet_manager |
| Bestehende Golden Paths aendern? | Nein -- die existierenden 17+8 bleiben unveraendert |
| operativeDeskManifest aendern? | Nein -- Mapping ist bereits korrekt |

Die Phase 1 (Fundament) kann sofort umgesetzt werden, da sie nur nicht-frozen Dateien betrifft (constants, manifests, goldenpath, spec, DB-Migration). Die UI-Phasen koennen spaeter folgen.
