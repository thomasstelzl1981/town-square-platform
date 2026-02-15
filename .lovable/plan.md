

# PV-Widget reparieren: RLS-Policies + Demo-Daten-Abgleich

## Analyse-Ergebnis

### Kernproblem: RLS blockiert den Zugriff auf `pv_plants`

Die Netzwerk-Logs zeigen: `GET /pv_plants?tenant_id=eq.a0000000-...` gibt `[]` zurueck, obwohl ein Datensatz existiert. Die Ursache ist ein fehlerhaftes RLS-Policy-Muster:

Die PERMISSIVE SELECT Policy verwendet `my_scope_org_ids(auth.uid())`. Diese Funktion erwartet eine **Organisations-ID** als Parameter, bekommt aber die **User-UUID**. Dadurch gibt sie nur `[d028bc99-...]` (die User-ID) zurueck — nicht die Tenant-ID `a0000000-...`. Da die Plant `tenant_id = a0000000-...` hat, scheitert der Zugriff.

Zum Vergleich: Die `properties`-Tabelle nutzt korrekt die `memberships`-Tabelle fuer RLS und funktioniert einwandfrei.

**Betroffene Tabellen mit dem gleichen fehlerhaften Muster:**
- `pv_plants` (4 PERMISSIVE Policies: SELECT, INSERT, UPDATE, DELETE)
- `pv_connectors` (1 ALL Policy)
- `pv_measurements` (1 ALL Policy)

### Zweitproblem: DB-Daten stimmen nicht mit Demo-Daten ueberein

| Feld | Datenbank | DEMO_PLANT (Frontend) |
|------|-----------|----------------------|
| name | "EFH SMA 9,8 kWp" | "EFH Oberhaching 32,4 kWp" |
| kwp | 9.80 | 32.4 |
| city | Berlin | Deisenhofen |
| street | Schadowstr. | Sauerlacher Str. |

Das Dashboard-Widget `PVLiveWidget` liest aus der DB via `usePvPlants()`. Selbst wenn RLS gefixt wird, stimmen die Daten nicht mit der Demo-Akte ueberein.

## Technische Umsetzung

### Schritt 1: SQL Migration — RLS Policies reparieren

Alle fehlerhaften `my_scope_org_ids(auth.uid())`-Policies durch das korrekte `memberships`-Pattern ersetzen:

**pv_plants (4 Policies ersetzen):**

```text
-- SELECT
DROP POLICY "Tenant members can view pv_plants" ON pv_plants;
CREATE POLICY "Tenant members can view pv_plants" ON pv_plants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_plants.tenant_id)
  );

-- INSERT, UPDATE, DELETE analog
```

**pv_connectors + pv_measurements (je 1 ALL Policy ersetzen):**

```text
-- Gleicher Fix: my_scope_org_ids -> memberships-Join
DROP POLICY "Access pv_connectors via plant tenant" ON pv_connectors;
CREATE POLICY "Access pv_connectors via plant tenant" ON pv_connectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = pv_connectors.tenant_id)
  );
```

### Schritt 2: SQL Migration — Demo-Plant-Daten aktualisieren

Den bestehenden DB-Eintrag (`00000000-0000-4000-a000-000000000901`) auf die korrekten Oberhaching-Demodaten updaten:

```text
UPDATE pv_plants SET
  name = 'EFH Oberhaching 32,4 kWp',
  kwp = 32.4,
  city = 'Deisenhofen',
  street = 'Sauerlacher Str.',
  house_number = '30',
  postal_code = '82041',
  commissioning_date = '2019-04-28',
  wr_manufacturer = 'SMA Solar Technology AG',
  wr_model = 'Sunny Tripower 15000 TL (2x)',
  has_battery = false,
  mastr_account_present = true,
  mastr_plant_id = 'SEE912345678',
  mastr_unit_id = 'SEE987654321',
  mastr_status = 'confirmed',
  grid_operator = 'Bayernwerk Netz GmbH',
  active_connector = 'demo_timo_leif',
  provider = 'demo'
WHERE id = '00000000-0000-4000-a000-000000000901';
```

### Schritt 3: Keine Code-Aenderung noetig

- `PVLiveWidget` liest korrekt aus `usePvPlants()` — sobald RLS gefixt ist, bekommt es die Plant
- `DashboardWidgetToggle` im Dossier funktioniert bereits (togglet `SYS.PV.LIVE` korrekt in `widget_preferences`)
- `AnlagenTab` zeigt die Demo-Plant korrekt an, das Dossier oeffnet sich inline
- Die Sparkline-Kurve und KPIs werden aus `usePvMonitoring` korrekt berechnet

### Ergebnis nach dem Fix

1. **Dashboard-Widget "PV Live"**: Zeigt die Oberhaching-Anlage mit Live-Sparkline, aktueller Leistung und Tagesertrag
2. **Toggle im Dossier**: Aktiviert/deaktiviert das Dashboard-Widget (funktioniert bereits, nur die Daten fehlten)
3. **Anlagen-Tab**: DB-Plant und Demo-Plant zeigen konsistente Daten

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| SQL Migration | CREATE | RLS fix (6 Policies) + Demo-Plant-Daten Update |

