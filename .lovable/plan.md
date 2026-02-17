

## Fix: Datenisolierung MOD-05 vs. MOD-22 + PM Demo-Toggle

### Problem

1. `usePets()` laedt alle Pets des Tenants ohne Filter — MOD-22 Business-Tiere (Rocky, Mia, Oskar) erscheinen in "Meine Tiere" (MOD-05)
2. `PMKunden.tsx` nutzt `isDemoId()`-Checks fuer Tier-Abfragen, obwohl die Daten jetzt in der DB liegen
3. Kein separater Demo-Toggle fuer Pet Manager (MOD-22) in Zone 1

### Schritt 1: `usePets()` Filter — Datenisolierung

**Datei:** `src/hooks/usePets.ts`

Die Funktion `usePets()` wird angepasst, sodass sie nur Tiere mit `owner_user_id = user.id` zurueckgibt. Das sind die persoenlichen MOD-05 Tiere des eingeloggten Users.

```text
Vorher:  .eq('tenant_id', activeTenantId)
Nachher: .eq('tenant_id', activeTenantId).eq('owner_user_id', user.id)
```

Damit verschwinden Rocky, Mia, Oskar aus "Meine Tiere" — sie haben `owner_user_id = NULL`.

### Schritt 2: `PMKunden.tsx` — isDemoId-Check entfernen

**Datei:** `src/pages/portal/petmanager/PMKunden.tsx`

Die Funktion `usePetsForCustomer()` (Zeile 32-51) hat einen `isDemoId()`-Branch, der Demo-Tiere aus dem clientseitigen Array liest. Da die Daten jetzt in der DB sind, wird dieser Check entfernt — alle Abfragen gehen direkt an die DB.

```text
Vorher:
  if (isDemoId(customerId)) {
    return DEMO_PM_PETS.filter(...)
  }

Nachher:
  // Direkt DB-Query, kein isDemoId-Check
  const { data } = await supabase.from('pets').select(...).eq('customer_id', customerId);
```

Ebenso werden die nicht mehr benoetigten Imports (`isDemoId`, `DEMO_PM_PETS`, `DEMO_PM_BOOKINGS`) entfernt.

### Schritt 3: PM Demo-Toggle in Zone 1

**Datei:** `src/engines/demoData/goldenPathProcesses.ts` (oder wo GOLDEN_PATH_PROCESSES definiert ist)

Neuer Eintrag fuer den Pet Manager Demo-Toggle:

```text
{ id: 'GP-PET', label: 'Pet Manager Demo', module: 'MOD-22' }
```

**Datei:** `src/pages/admin/petmanager/PetDeskGovernance.tsx` (oder PetDesk-Hauptseite)

Ein Toggle-Switch im PetDesk-Header oder Governance-Tab, der `useDemoToggles().toggle('GP-PET')` aufruft. Wenn deaktiviert, werden die Demo-Datensaetze (Nummernkreis `d0...1xxx`) in den PM-Ansichten herausgefiltert.

### Schritt 4: Demo-Toggle in Zone 2 PM-Seiten anwenden

**Dateien:** `PMKunden.tsx`, `PMBuchungen.tsx`, `PMPension.tsx`, `PMServices.tsx`

Jede Seite konsumiert `useDemoToggles().isEnabled('GP-PET')`. Wenn deaktiviert, werden Datensaetze mit Demo-IDs (`d0...1xxx`) aus der Anzeige gefiltert — genau wie es `PetsMeineTiere.tsx` bereits fuer `GP-PETS` macht (Zeile 397).

### Dateien-Uebersicht

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/hooks/usePets.ts` | EDIT | Filter `.eq('owner_user_id', user.id)` hinzufuegen |
| `src/pages/portal/petmanager/PMKunden.tsx` | EDIT | isDemoId-Check entfernen, Imports aufraeumen |
| `src/manifests/goldenPathProcesses.ts` | EDIT | GP-PET Toggle-Eintrag hinzufuegen (falls nicht vorhanden) |
| `src/pages/admin/petmanager/PetDeskGovernance.tsx` | EDIT | Demo-Toggle-Switch fuer GP-PET einfuegen |
| `src/pages/portal/petmanager/PMBuchungen.tsx` | EDIT | GP-PET Demo-Filter anwenden |

### Ergebnis nach Umsetzung

- "Meine Tiere" (MOD-05) zeigt nur Luna + Bello (persoenliche Tiere)
- PM Kunden zeigt Berger, Richter, Stein mit Tierakten aus DB
- Demo-Toggle in Zone 1 PetDesk steuert Sichtbarkeit der PM-Demo-Daten
- Saubere Trennung: MOD-05 = `owner_user_id`, MOD-22 = `customer_id`

