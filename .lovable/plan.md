

## Naechste Schritte — Implementierungsplan

### Status: Was ist bereits erledigt?

| Schritt | Status |
|---------|--------|
| Demo-Tenant `tenant_mode = 'demo'` | ✅ Erledigt (DB bestaetigt) |
| Alle 22 Module aktiviert | ✅ Erledigt (MOD-00 bis MOD-22) |
| `DEMO_TENANT_ID` in 3 Dateien umgestellt | ✅ Erledigt |
| `useDemoAutoLogin`: Seed/Cleanup entfernt | ✅ Erledigt |
| `useDemoToggles`: Auto-ON fuer Demo-Session | ✅ Erledigt |
| `PortalLayout`: Seeding-State entfernt | ✅ Erledigt |
| Demo-Tenant: Operative Daten | ❌ **0 Daten** — Seed steht noch aus |

---

### Was jetzt implementiert werden muss (4 Schritte)

#### Schritt 1: `DEMO_HIDDEN_AREAS` leeren

`src/config/demoAccountConfig.ts` Z.16:
```typescript
// IST:
export const DEMO_HIDDEN_AREAS = ['operations'] as const;
// SOLL:
export const DEMO_HIDDEN_AREAS = [] as const;
```
Damit werden alle Module inkl. Manager-Module (Projekte, Akquise, Finanzierungsmanager, etc.) im Demo-Account sichtbar.

#### Schritt 2: Vehicle CSV Enum-Fix

`public/demo-data/demo_vehicles.csv` — 6 Zeilen aendern:

| Zeile | IST | SOLL |
|-------|-----|------|
| 2 | `Benzin` | `petrol` |
| 3 | `Mild-Hybrid (Benzin)` | `hybrid_petrol` |
| 4 | `Benzin` | `petrol` |
| 5 | `Benzin` | `petrol` |
| 6 | `Benzin` | `petrol` |
| 7 | `Benzin` | `petrol` |

#### Schritt 3: Storage-Nodes im Demo-Tenant bereinigen (vor dem Seed)

SQL ausfuehren um die 26 bestehenden Root-Nodes zu loeschen, damit der Seed keine Unique-Constraint-Konflikte bekommt:

```sql
DELETE FROM storage_nodes 
WHERE tenant_id = 'c3123104-e2ec-47ca-9f0a-616808557ece';
```

#### Schritt 4: Einmaliger Seed-Lauf

Nach den Code-Aenderungen muss der Seed einmalig ausgefuehrt werden. Dazu:
- Im Armstrong/Zone 1 Admin den "Testdaten" Tab oeffnen
- "Alle aktivieren" klicken — die Seed Engine laeuft dann gegen den Demo-Tenant (da `DEMO_TENANT_ID` bereits umgestellt ist)

**Bekannte Einschraenkung:** `dev_project_units` hat keine Seed-Funktion — das Projekt "Residenz am Stadtpark" wird ohne Einheiten angelegt. Das ist ein separater Fix fuer danach.

---

### Was NICHT in diesem Schritt gemacht wird

- Golden Tenant leeren (erst nach erfolgreichem Seed-Verifizierung)
- `module_code MOD_13 → MOD-13` Vereinheitlichung (groesserer Umbau, betrifft DB-Constraint + Edge Function + storageManifest — separater Schritt)
- `dev_project_units` Seed-Funktion (separater Schritt nach Seed-Verifizierung)
- MOD-13 Tab-zu-Block-Umbau (architektonische Aenderung, eigener Scope)

