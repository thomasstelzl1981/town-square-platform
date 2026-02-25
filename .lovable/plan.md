

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
| `DEMO_HIDDEN_AREAS` geleert | ✅ Erledigt — alle Module sichtbar |
| Vehicle CSV Enum-Fix | ✅ Erledigt — petrol/hybrid_petrol |
| Storage-Nodes im Demo-Tenant bereinigt | ✅ Erledigt — 26 Nodes geloescht |
| Demo-Tenant: Operative Daten | ❌ **0 Daten** — Seed steht noch aus |

---

### Was jetzt gemacht werden muss (1 Schritt)

#### Einmaliger Seed-Lauf

Im Armstrong/Zone 1 Admin den "Testdaten" Tab oeffnen und "Alle aktivieren" klicken.
Die Seed Engine laeuft dann gegen den Demo-Tenant (`c3123104-e2ec-47ca-9f0a-616808557ece`).

**Bekannte Einschraenkung:** `dev_project_units` hat keine Seed-Funktion — das Projekt "Residenz am Stadtpark" wird ohne Einheiten angelegt.

---

### Was NICHT in diesem Schritt gemacht wird

- Golden Tenant leeren (erst nach erfolgreichem Seed-Verifizierung)
- `module_code MOD_13 → MOD-13` Vereinheitlichung (groesserer Umbau)
- `dev_project_units` Seed-Funktion (separater Schritt)
- MOD-13 Tab-zu-Block-Umbau (architektonische Aenderung)
