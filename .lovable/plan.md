

## Tiefenanalyse — Ursachen und Befunde

### Problem 1: "MM" im Avatar und "Max Mustermann" im Header

**Ursache gefunden:** Beim letzten DB-Update wurden `first_name` und `last_name` korrigiert, aber das Feld `display_name` wurde NICHT aktualisiert.

| Feld | Aktueller Wert | Soll-Wert |
|------|---------------|-----------|
| `first_name` | Thomas | Thomas |
| `last_name` | Stelzl | Stelzl |
| `display_name` | **Max Mustermann** | **Thomas Stelzl** |

Der Header (`PortalHeader.tsx` Zeile 48-50) und die SystemBar berechnen die Initialen aus `display_name`:
```
profile.display_name.split(' ').map(n => n[0]).join('') → "MM"
```

**Fix:** Ein einzelnes SQL-Update: `UPDATE profiles SET display_name = 'Thomas Stelzl' WHERE id = 'd028bc99-...'`

---

### Problem 2: Kontakte, Kredite, Investments — Daten sichtbar obwohl "Golden Tenant leer"

**Ursache gefunden:** Du bist aktuell NICHT auf dem Golden Tenant eingeloggt, sondern auf dem **Demo Tenant**.

| Attribut | Wert |
|----------|------|
| `active_tenant_id` im Profil | `c3123104-e2ec-47ca-9f0a-616808557ece` (= **Demo Tenant**) |
| Golden Tenant | `a0000000-0000-4000-a000-000000000001` |

Die Daten die du siehst sind Demo-Tenant-Daten — korrekt dort geseedet:
- 5 Kontakte (Bergmann, Hoffmann, Max Mustermann, Lisa Mustermann, Weber) → Demo Tenant
- 2 Privatkredite (BMW Bank 22.400 EUR, Santander 4.800 EUR) → Demo Tenant
- Investment "Depot aktiv 29.431 EUR" → Demo Tenant
- Household Person "Max Mustermann Hauptperson" → Demo Tenant

**Der Golden Tenant selbst ist tatsächlich leer (0 Records in allen Tabellen).** Das Problem ist, dass dein Account auf den falschen Tenant zeigt.

**Fix:** `UPDATE profiles SET active_tenant_id = 'a0000000-0000-4000-a000-000000000001' WHERE id = 'd028bc99-...'`

---

### Problem 3: DEMO_FAMILY in data.ts enthält hardcodiert "Max Mustermann"

Die Datei `src/engines/demoData/data.ts` (Zeile 98-103) definiert:
```typescript
export const DEMO_FAMILY = [
  { id: DEMO_PRIMARY_PERSON_ID, role: 'hauptperson', firstName: 'Max', lastName: 'Mustermann', ... },
  ...
];
```

Das ist **kein Verstoß** gegen die Demo-Data-Governance, weil diese Daten ausschließlich im Demo-Account (`c3123104-...`) verwendet werden. Aber es erklärt, warum du im Demo-Tenant überall "Max Mustermann" siehst — das ist designed so.

---

### Implementierungsplan

**Schritt 1 — DB: `display_name` korrigieren**

```sql
UPDATE profiles 
SET display_name = 'Thomas Stelzl' 
WHERE id = 'd028bc99-6e29-4fa4-b038-d03015faf222';
```

**Schritt 2 — DB: `active_tenant_id` auf Golden Tenant umschalten**

```sql
UPDATE profiles 
SET active_tenant_id = 'a0000000-0000-4000-a000-000000000001' 
WHERE id = 'd028bc99-6e29-4fa4-b038-d03015faf222';
```

Danach wirst du beim Login den **leeren Golden Tenant** sehen — keine Kontakte, keine Kredite, keine Investments, keine "Max Mustermann" Household Person.

**Schritt 3 — Verifizierung**

- Header zeigt "TS" statt "MM"
- Dropdown zeigt "Thomas Stelzl"
- Kontakte: 0
- Darlehen: 0
- Investments: Keine Person, kein Depot
- Finanzanalyse Übersicht: Leerer State

**Kein Code-Change nötig.** Das Problem war rein ein Datenbank-Zustand (vergessenes `display_name` Update + falscher active_tenant_id).

