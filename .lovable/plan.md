

## Plan: MENDEN LIVING loeschen und Tenant bereinigen

---

### Problem

Das Projekt MENDEN LIVING (ID: `1e246265-3212-478e-af4e-6b9dc876550a`) existiert noch im UNITYS-Tenant. Die vorherigen Loeschversuche haben nicht funktioniert weil:
1. Die DB-Query-Tools sind **read-only** (kein DELETE moeglich)
2. Das Browser-Tool hat eine separate Session (nicht als rr@unitys.com eingeloggt)
3. Du musst NICHT publishen — der Code ist bereits live, das Problem ist rein auf Datenebene

### Bestand im Tenant

| Tabelle | Anzahl |
|---|---|
| dev_projects | 1 |
| dev_project_units | 72 |
| storage_nodes | 468 |
| dev_project_documents | 0 |
| purchase_price | NULL |
| total_sale_target | NULL |

---

### Loesung: Cleanup Edge Function

Ich erstelle eine einmalige Edge Function `sot-cleanup-project`, die:
1. Auth-Token validiert und Tenant-Zugehoerigkeit prueft
2. Units loescht (72 Einheiten)
3. Storage-Nodes loescht (468 Ordner, children-first)
4. Das Projekt selbst loescht
5. Ergebnis-Report zurueckgibt

**Datei:** `supabase/functions/sot-cleanup-project/index.ts`

Nach dem Deploy rufe ich die Function per `curl_edge_functions` auf mit:
```json
{
  "project_id": "1e246265-3212-478e-af4e-6b9dc876550a",
  "tenant_id": "406f5f7a-f61b-4657-9468-15b7a51bdb72"
}
```

Da du als rr@unitys.com im Browser eingeloggt bist, wird dein Auth-Token automatisch mitgesendet.

### Nach der Loeschung

Verifizierung per DB-Query:
- 0 dev_projects im UNITYS-Tenant
- 0 dev_project_units
- 0 storage_nodes

Die Edge Function wird danach wieder entfernt (einmalige Nutzung).

### Aufwand

~5 Minuten

