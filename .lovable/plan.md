

# Phase B: tenant_id NOT NULL Haertung (15 sichere Tabellen)

## Scope

15 Tabellen mit 0 NULL-Werten werden auf `NOT NULL` gehaertet. Plus 1 Fix fuer den einzelnen NULL-Record in `data_event_ledger`.

3 Tabellen bleiben bewusst nullable (globale Templates/Katalogdaten):
- `document_checklist_items` (31 NULL)
- `integration_registry` (37 NULL)
- `msv_templates` (17 NULL)

---

## Migration

### Schritt 1: data_event_ledger NULL-Record fixen

```sql
UPDATE data_event_ledger 
SET tenant_id = '00000000-0000-0000-0000-000000000000' 
WHERE tenant_id IS NULL;
```

### Schritt 2: NOT NULL auf 15 Tabellen setzen

| Tabelle | NULL-Count | Aktion |
|---------|-----------|--------|
| acq_inbound_messages | 0 | SET NOT NULL |
| acq_mandate_events | 0 | SET NOT NULL |
| acq_offer_activities | 0 | SET NOT NULL |
| acq_offer_documents | 0 | SET NOT NULL |
| acq_offers | 0 | SET NOT NULL |
| acq_outbound_messages | 0 | SET NOT NULL |
| cars_offers | 0 | SET NOT NULL |
| data_event_ledger | 1 (wird gefixt) | SET NOT NULL |
| finance_submission_logs | 0 | SET NOT NULL |
| lead_assignments | 0 | SET NOT NULL |
| leads | 0 | SET NOT NULL |
| pv_connectors | 0 | SET NOT NULL |
| pv_measurements | 0 | SET NOT NULL |
| test_data_registry | 0 | SET NOT NULL |
| user_consents | 0 | SET NOT NULL |

### Schritt 3: Backlog-Dateien aktualisieren

- `spec/audit/db_optimization_backlog.json` -- Phase B Status auf "done" setzen
- `spec/audit/github_optimization_review_backlog.json` -- Vermerk hinzufuegen

---

## Risiko

**Niedrig.** Alle 15 Tabellen haben bereits 0 NULL-Werte (bzw. 1 der gefixt wird). Die Trigger setzen `tenant_id` automatisch bei INSERT. Bestehende Applikationslogik ist nicht betroffen.

