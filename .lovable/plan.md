
# Enterprise-Readiness Implementation Plan

## ✅ Abgeschlossen

### MOD-00 Dashboard ins Manifest aufgenommen
- MOD-00 (Dashboard) als formales Modul mit display_order: 0 in routesManifest.ts eingefügt
- 4 Tiles: Widgets, Shortcuts, Aktivität, Einstellungen
- Tests aktualisiert: 21 Module (MOD-00 bis MOD-20), 88 Tiles total
- Ausnahmen dokumentiert: MOD-02 (5 Tiles), MOD-06 (5 Tiles), MOD-20 (6 Tiles)

### 2. Antragsteller (Co-Applicant)
- Vollständiges Formular für zweiten Antragsteller in SelbstauskunftFormV2
- Eigener Datensatz mit party_role = 'co_applicant'
- ApplicantPersonFields als wiederverwendbare Komponente extrahiert

---

## 🔲 Nächste Prioritäten

### Priorität 1: DB-Härtung (1 Migration)
- [ ] 181 fehlende FK-Indizes erzeugen
- [ ] 4 SECURITY DEFINER Views auf INVOKER umstellen
- [ ] search_path auf alle Funktionen setzen

### Priorität 2: Golden Path Dokumentation (4 neue Docs)
- [ ] GOLDEN_PATH_AKQUISE.md — MOD-08 / Zone 1 / MOD-12
- [ ] GOLDEN_PATH_LEAD.md — Zone 3 / Zone 1 / MOD-09 / MOD-10
- [ ] GOLDEN_PATH_VERMIETUNG.md — MOD-05
- [ ] GOLDEN_PATH_PROJEKTE.md — MOD-13

### Priorität 3: Camunda ActionKeys erweitern
- [ ] 7 neue ActionKeys in useActionHandoff.ts
- [ ] Integration in jeweilige Module

### Priorität 4: Audit-Abdeckung erweitern
- [ ] audit_events-Inserts für listings, properties, contacts, org_delegations, leases

### Priorität 5: GDPR deleted_at vervollständigen
- [ ] deleted_at auf communication_events, renter_invites, partner_deals, finance_bank_contacts
