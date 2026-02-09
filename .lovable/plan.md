

# DSGVO / Enterprise-Readiness: Analyse und Empfehlung

---

## 1. Ist-Zustand: Was bereits vorhanden ist

| Baustein | Status | Details |
|----------|--------|---------|
| **RLS auf allen Tabellen** | Vorhanden | Tenant-Isolation funktioniert, K7-Regel definiert |
| **Audit Events** | Tabelle vorhanden | `audit_events` mit actor, target_org, event_type, payload — aber noch leer (0 Eintraege) |
| **User Consents** | Tabelle vorhanden | `user_consents` mit template_id, version, status, ip_address, user_agent — gut strukturiert |
| **PII-Markierung** | Teilweise | `armstrong_action_runs` hat `pii_present` + `retention_days` — nur fuer Armstrong |
| **Soft Delete** | Minimal | `documents.deleted_at` existiert, sonst nirgends |
| **K6 Governance-Regel** | Definiert | PII-Regeln in KB.SYSTEM.006 formuliert, aber nicht systemweit implementiert |
| **DSGVO-Marketing** | Vorhanden | Zone 3 SoT-Website bewirbt "DSGVO-konform, Deutsche Server" |

---

## 2. Was FEHLT fuer DSGVO-Konformitaet

### Kritisch (muss irgendwann vorhanden sein)

| Anforderung | DSGVO-Artikel | Status |
|-------------|---------------|--------|
| **Recht auf Loeschung** (Kontaktdaten anonymisieren) | Art. 17 | Nicht implementiert |
| **Recht auf Datenauskunft** (Export aller personenbezogenen Daten) | Art. 15 | Nicht implementiert |
| **Consent Templates** (versionierte Einwilligungsvorlagen) | Art. 7 | Tabelle `user_consents` referenziert `template_id`, aber keine `consent_templates`-Tabelle existiert |
| **Verarbeitungsverzeichnis** (welche Daten wofuer verarbeitet werden) | Art. 30 | Nicht vorhanden |
| **Datenminimierung** (Retention Policies fuer alte Daten) | Art. 5(1)(e) | Nur bei Armstrong, nicht bei Kontakten/Dokumenten |

### Wichtig, aber nicht blockierend

| Anforderung | Status |
|-------------|--------|
| **Audit Trail aktiv nutzen** | Tabelle vorhanden, aber 0 Events — noch nicht in Workflows integriert |
| **Soft Delete fuer PII-Tabellen** | Nur `documents`, nicht bei `contacts`, `applicant_profiles`, `self_disclosures` |
| **Datenweitergabe-Protokoll** (wer hat welche Daten an wen gegeben) | Nicht vorhanden |

---

## 3. Meine Empfehlung: JETZT die Grundstruktur anlegen, SPAETER befuellen

### Warum jetzt?

Wenn ihr die Grundstruktur (Tabellen, Spalten, Governance-Regeln) **jetzt** anlegt, passiert Folgendes:
- Jedes neue Feature wird automatisch gegen diese Struktur gebaut
- Ihr muesst spaeter nicht 159 Tabellen nachtraeglich umbauen
- Die Regeln wachsen organisch mit

### Warum nicht alles jetzt?

Die eigentliche Logik (Export-Funktion, Anonymisierungs-Workflows, Consent-UI) kann warten. Die braucht ihr erst beim Go-Live. **Jetzt nur die Fundamente.**

---

## 4. Was konkret gemacht werden sollte (ohne die Entwicklung zu behindern)

### Massnahme A: Consent Templates Tabelle

Die `user_consents`-Tabelle referenziert bereits eine `template_id`, aber die Tabelle `consent_templates` existiert nicht. Das ist eine Luecke.

```
consent_templates
├── id (UUID)
├── code (TEXT, z.B. "SALES_MANDATE", "SCHUFA_CONSENT")
├── version (INT)
├── title_de (TEXT)
├── body_de (TEXT, Markdown)
├── required_for_module (TEXT, z.B. "MOD-06")
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
```

Das passt zu den 9 Consent Codes aus der SOFTWARE_FOUNDATION (SALES_MANDATE, SCOUT24_CREDITS, etc.).

### Massnahme B: Governance-Regel KB.SYSTEM.008 (DSGVO-Checkliste)

Eine neue KB-Regel als Checkliste fuer alle Entwicklungen:

- K9: Jede Tabelle mit personenbezogenen Daten MUSS `deleted_at TIMESTAMPTZ NULL` haben
- K10: Datenexport-Funktion MUSS alle PII-Tabellen abdecken
- K11: Consent Templates MUESSEN versioniert sein
- K12: Audit Events MUESSEN bei schreibenden Operationen auf PII-Daten geschrieben werden

### Massnahme C: `deleted_at`-Spalte auf PII-Tabellen

Folgende Tabellen enthalten personenbezogene Daten und brauchen eine `deleted_at`-Spalte fuer spaeteres Soft-Delete/Anonymisierung:

| Tabelle | PII-Daten |
|---------|-----------|
| `contacts` | Name, Adresse, Telefon, E-Mail |
| `applicant_profiles` | Einkommen, Vermoegen, Arbeitgeber |
| `self_disclosures` | Komplette Selbstauskunft |
| `profiles` | Name, Adresse, Steuernummer |
| `leads` | Name, E-Mail, Telefon |

**Nur die Spalte hinzufuegen.** Kein Code aendert sich, keine bestehende Query bricht.

### Was NICHT gemacht wird

- Keine Export-UI (kommt spaeter)
- Keine Anonymisierungs-Logik (kommt spaeter)
- Keine Consent-UI (kommt spaeter)
- Keine Aenderung an bestehenden Workflows
- Keine neuen Routen
- Keine Code-Aenderungen in src/

---

## 5. Risikoanalyse

| Massnahme | Risiko | Aufwand |
|-----------|--------|---------|
| consent_templates Tabelle | Null (neue Tabelle, beeinflusst nichts) | 1 Migration |
| KB.SYSTEM.008 Datei | Null (nur eine Markdown-Datei) | 1 Datei |
| deleted_at Spalten | Null (nullable Spalte, bestehende Queries ignorieren sie) | 1 Migration |

**Gesamtrisiko: Null.** Alles additiv, nichts bricht.

---

## 6. Was spaeter kommt (nach Entwicklungs-Fertigstellung)

Diese Punkte werden erst relevant beim Go-Live oder Enterprise-Kunden:

1. **Datenexport-Edge-Function** (Art. 15 — Auskunftsrecht)
2. **Anonymisierungs-Edge-Function** (Art. 17 — Recht auf Loeschung)
3. **Consent-UI in Zone 2** (Einwilligungen einholen und verwalten)
4. **Retention-Policy Cron-Job** (alte Daten automatisch anonymisieren)
5. **Audit-Trail Integration** (Events bei jedem schreibenden Zugriff auf PII)
6. **Datenschutzerklaerung** (Zone 3 Websites)
7. **Auftragsverarbeitungsvertrag (AVV)** (fuer Enterprise-Kunden)

---

## 7. Zusammenfassung

| Frage | Antwort |
|-------|---------|
| **Jetzt oder spaeter?** | Grundstruktur jetzt, Logik spaeter |
| **Behindert es die Entwicklung?** | Nein — nur additive DB-Aenderungen und 1 KB-Datei |
| **Was genau wird gemacht?** | 1 neue Tabelle, 5 neue Spalten, 1 Governance-Regel |
| **Was wird NICHT gemacht?** | Keine UI, keine Workflows, keine Code-Aenderungen |
| **Enterprise-Faehigkeit?** | Die Grundstruktur macht das System "enterprise-ready vorbereitet", die Logik folgt spaeter |

