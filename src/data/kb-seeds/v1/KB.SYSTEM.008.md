---
item_code: KB.SYSTEM.008
category: system
content_type: checklist
title_de: "DSGVO-Checkliste (Governance)"
summary_de: "Checkliste der DSGVO- und Enterprise-Readiness Regeln fuer alle Entwicklungen."
version: "1.0.0"
status: "published"
scope: "global"
confidence: "verified"
valid_until: null
sources: []
---

# DSGVO-Checkliste

Diese Regeln stellen sicher, dass das System DSGVO-konform und enterprise-ready bleibt.

---

## K9: Soft Delete fuer PII-Tabellen

- [ ] Jede Tabelle mit personenbezogenen Daten MUSS `deleted_at TIMESTAMPTZ NULL` haben
- [ ] Betroffene Tabellen: `contacts`, `applicant_profiles`, `self_disclosures`, `profiles`, `leads`
- [ ] Neue Tabellen mit PII MUESSEN diese Spalte direkt mitbringen
- [ ] Loeschung erfolgt via Anonymisierung, nicht via `DELETE`

---

## K10: Datenauskunft (Art. 15)

- [ ] Datenexport-Funktion MUSS alle PII-Tabellen abdecken
- [ ] Export-Format: JSON oder PDF
- [ ] Alle personenbezogenen Daten eines Kontakts muessen exportierbar sein
- [ ] Implementierung: Spaeter via Edge Function

---

## K11: Consent Management (Art. 7)

- [ ] Consent Templates MUESSEN versioniert sein (`consent_templates` Tabelle)
- [ ] Jede Einwilligung referenziert eine Template-Version
- [ ] Template-Codes: SALES_MANDATE, SCHUFA_CONSENT, DATA_PROCESSING, etc.
- [ ] Einwilligungen sind widerrufbar (Status-Tracking in `user_consents`)

---

## K12: Audit Trail fuer PII (Art. 30)

- [ ] Audit Events MUESSEN bei schreibenden Operationen auf PII-Daten geschrieben werden
- [ ] Event-Typen: `pii.create`, `pii.update`, `pii.delete`, `pii.export`, `pii.view`
- [ ] Mindestens: actor_user_id, event_type, target_org_id, Zeitstempel
- [ ] Audit Events duerfen NIEMALS geloescht werden

---

## Betroffene PII-Tabellen

| Tabelle | PII-Daten | deleted_at |
|---------|-----------|------------|
| `contacts` | Name, Adresse, Telefon, E-Mail | Ja |
| `applicant_profiles` | Einkommen, Vermoegen, Arbeitgeber | Ja |
| `self_disclosures` | Komplette Selbstauskunft | Ja |
| `profiles` | Name, Adresse, Steuernummer | Ja |
| `leads` | Name, E-Mail, Telefon | Ja |
| `armstrong_action_runs` | Input/Output mit PII | Via `pii_present` + `retention_days` |

---

## Spaetere Implementierung (nicht jetzt)

Diese Punkte werden erst beim Go-Live oder fuer Enterprise-Kunden implementiert:

1. Datenexport-Edge-Function (Art. 15)
2. Anonymisierungs-Edge-Function (Art. 17)
3. Consent-UI in Zone 2
4. Retention-Policy Cron-Job
5. Audit-Trail Integration in Workflows
6. Datenschutzerklaerung (Zone 3)
7. Auftragsverarbeitungsvertrag (AVV)

---

## Validation

Diese Regeln werden validiert durch:
1. Schema-Pruefung: `deleted_at` auf allen PII-Tabellen vorhanden
2. `consent_templates` Tabelle mit versionierten Eintraegen
3. Audit Events bei PII-Schreibzugriffen (spaetere Implementierung)
4. Governance Review bei neuen Tabellen mit personenbezogenen Daten
