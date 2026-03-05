

# PV-Anlage Oberhaching → Thomas Stelzl privater Account

## Ist-Zustand
| Feld | Wert |
|------|------|
| PV-Anlage | EFH Oberhaching 32,4 kWp |
| Plant-ID | `00000000-0000-4000-a000-000000000901` (Demo-ID) |
| Aktueller Tenant | `c3123104-...` (Golden Tenant) |
| Owner | NULL |

## Ziel
Die Anlage soll in Thomas Stelzls privatem Account (`66175861-db5b-4997-8a13-9994c17136b3`) liegen.

## Aktion (Data Update, kein Schema-Change)

Ein UPDATE auf die `pv_plants` Tabelle:

```sql
UPDATE pv_plants
SET tenant_id = '66175861-db5b-4997-8a13-9994c17136b3',
    owner_user_id = 'b0d2bf55-887f-4678-878b-863af63c06b9'
WHERE id = '00000000-0000-4000-a000-000000000901';
```

Das verschiebt die Anlage vom Golden Tenant in den privaten Account und setzt Thomas als Owner.

## Voraussetzung
MOD-19 (Photovoltaik) muss für Tenant `66175861` aktiviert sein. Falls nicht, wird zusätzlich ein INSERT in `tenant_tile_activation` benötigt.

## Kein Code-Change nötig
Die Daten werden runtime per RLS/Tenant-Filter geladen.

