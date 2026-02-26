

## Plan: Alle Module einfrieren

### Aktuelle unfrozen Module (laut `modules_freeze.json`):
- **MOD-01** (Stammdaten) — frozen: false
- **MOD-13** (Projekte) — frozen: false  
- **MOD-20** (Miety/Zuhause) — frozen: false
- **MOD-22** (PetManager) — frozen: false

### Änderung:
**Datei:** `spec/current/00_frozen/modules_freeze.json`

Alle 4 Module auf `"frozen": true` setzen mit Reason "Production freeze" und aktuellem Timestamp.

### Hinweis zu MOD-11:
Der Finanzierungsmanager (MOD-11) ist aktuell **frozen**. Sobald du mir sagst, was dort geändert werden soll, sage bitte **"UNFREEZE MOD-11"** dazu.

