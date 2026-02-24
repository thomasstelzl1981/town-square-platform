

# Plan: Hardcoded-Daten entfernen und Doppelungen mit /admin/tiles bereinigen

## Analyse-Ergebnis

### Hardcoded-Daten (Verstoesse)

**1. ManagerFreischaltung.tsx (Zeilen 75-89)**
Zwei lokale Objekte duplizieren Daten aus `rolesMatrix.ts`:

```text
ROLE_LABELS = {                      ← Duplikat von ROLES_CATALOG[].label
  finance_manager: 'Finanzierungsmanager',
  akquise_manager: 'Akquise-Manager',
  sales_partner: 'Vertriebspartner',
  project_manager: 'Projektmanager',
  pet_manager: 'Pet Manager',
}

ROLE_MODULE_MAP = {                  ← Duplikat von ROLE_EXTRA_TILES
  finance_manager: 'MOD-11',
  akquise_manager: 'MOD-12',
  sales_partner: 'MOD-09 + MOD-10',
  project_manager: 'MOD-13',
  pet_manager: 'MOD-22',
}
```

**2. RolesManagement.tsx (Zeilen 376-399)**
Hardcoded Arrays fuer Enum-Badges statt Ableitung aus ROLES_CATALOG:

```text
['platform_admin', 'org_admin', 'sales_partner', ...]     ← hardcoded
['platform_admin', 'super_user', 'client_user', ...]      ← hardcoded
['internal_ops', 'renter_user', ...]                       ← hardcoded
['moderator', 'user']                                      ← hardcoded
```

**3. Falsche Modul-Anzahl "21" statt "22"**
- RolesManagement.tsx Zeile 62: "1 System-Rolle + 5 User-Rollen"  (korrekt: 8 Rollen)
- RolesManagement.tsx Zeile 117: "Alle 21 Module" (korrekt: 22)
- RolesManagement.tsx Zeile 161: "21 Module x 6 Rollen" (korrekt: 22 x 8)
- rolesMatrix.ts MODULES_CATALOG: Enthaelt nur 21 Eintraege, MOD-22 fehlt

### Funktions-Doppelung mit /admin/tiles

| Funktion | Wo jetzt | Auch in /admin/tiles? | Aktion |
|----------|----------|----------------------|--------|
| Rollen-Katalog (8 Rollen anzeigen) | RolesManagement Tab 1 | Nein | Behalten |
| Modul-Rollen-Matrix (Kreuzmatrix) | RolesManagement Tab 2 | Nein | Behalten |
| Governance (Eroeffnungsprozess-Flow) | RolesManagement Tab 3 | Teilweise (Rollen-Aktivierung) | Reduzieren |
| DB-Enums anzeigen | RolesManagement Tab 3 | Nein | Behalten, aber aus SSOT ableiten |
| Rollen-Uebersicht (Kacheln) | ManagerFreischaltung Tab 3 | JA (Rollen-Aktivierung) | Entfernen |
| Partner-Verifizierung | PartnerVerification | Nein | Keine Aenderung noetig |

### PartnerVerification.tsx
Keine Hardcoded-Daten gefunden. Liest korrekt aus der DB (`partner_verifications` + `organizations`). Keine Doppelung mit TileCatalog. **Keine Aenderung noetig.**

---

## Aenderungen

### 1. rolesMatrix.ts — MOD-22 in MODULES_CATALOG ergaenzen

MOD-22 (PetManager) fehlt im `MODULES_CATALOG` Array. Dadurch zeigt die Modul-Rollen-Matrix nur 21 statt 22 Module.

- MOD-22 als neuen Eintrag hinzufuegen
- Kommentar "21 Module" auf "22 Module" korrigieren
- `ALL_TILES` Kommentar aktualisieren

### 2. ManagerFreischaltung.tsx — Hardcoded Maps entfernen

- `ROLE_LABELS` entfernen, stattdessen Hilfsfunktion die `ROLES_CATALOG.find(r => r.code === role || r.membershipRole === role)?.label` nutzt
- `ROLE_MODULE_MAP` entfernen, stattdessen `ROLE_EXTRA_TILES[role]?.join(' + ')` nutzen
- "Rollen-Uebersicht" Card im Tab "Aktive Manager" (Zeilen 558-580) entfernen — diese Info wird jetzt vollstaendig von `/admin/tiles > Rollen-Aktivierung` und `/admin/roles > Rollen-Katalog` abgedeckt

### 3. RolesManagement.tsx — Hardcoded Enums durch SSOT ersetzen

- Hardcoded membership_role-Array (Zeile 376-385) ersetzen durch dynamische Ableitung aus `ROLES_CATALOG` (aktive) und `LEGACY_ROLES` (legacy)
- Hardcoded app_role-Array (Zeile 389-401) ersetzen durch dynamische Ableitung aus `ROLES_CATALOG` (die ein `appRole` haben) und Legacy-Array
- Texte "21 Module" auf "22 Module" korrigieren
- "6 Rollen" auf "8 Rollen" korrigieren (pet_manager und project_manager fehlen in der Beschreibung)

### 4. RolesManagement.tsx — Governance-Tab entschlacken

Der Governance-Tab zeigt eine Mapping-Tabelle (Rolle → Module-Anzahl), die jetzt auch in `/admin/tiles > Rollen-Aktivierung` steht. Diese Tabelle wird durch einen Verweis auf `/admin/tiles` ersetzt, um Doppelpflege zu vermeiden. Die restlichen Governance-Infos (Eroeffnungsprozess-Flow, org_admin vs platform_admin Erklaerung, DB-Enum-Status) bleiben erhalten.

---

## Zusammenfassung der Datei-Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/constants/rolesMatrix.ts` | MOD-22 in MODULES_CATALOG, Kommentare korrigieren |
| `src/pages/admin/ManagerFreischaltung.tsx` | ROLE_LABELS und ROLE_MODULE_MAP entfernen, aus ROLES_CATALOG ableiten; Rollen-Uebersicht Card entfernen |
| `src/pages/admin/RolesManagement.tsx` | Hardcoded Enum-Arrays durch SSOT ersetzen; Zahlen korrigieren (22 Module, 8 Rollen); Governance-Tab Mapping-Tabelle durch Link zu /admin/tiles ersetzen |
| `src/pages/admin/PartnerVerification.tsx` | Keine Aenderung |

### Modul-Freeze-Check

Alle betroffenen Dateien liegen ausserhalb der Modul-Pfade:
- `src/constants/rolesMatrix.ts` — kein Modul
- `src/pages/admin/*` — kein Modul-Pfad
- Ergebnis: **Nicht frozen, Aenderungen erlaubt**

