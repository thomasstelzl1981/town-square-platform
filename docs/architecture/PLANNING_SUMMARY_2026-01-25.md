# OPEN QUESTIONS RE-AUDIT & EXECUTIVE SUMMARY

**Datum:** 2026-01-25  
**PLAN_MARKER_B**

---

## DELIVERABLE B: OPEN QUESTIONS RE-AUDIT

### Resolved Questions (durch Kontext geklärt)

| Q-ID | Modul | Frage | Status | Entscheidung | Freeze? |
|------|-------|-------|--------|--------------|---------|
| Q4.3 | MOD-04 | MOD-04 vs MOD-06 Abgrenzung | RESOLVED | MOD-04 = Flag setzen, MOD-06 = Sales-Prozess | Yes |
| Q4.13 | MOD-04 | sale_enabled via property_features? | RESOLVED | Ja, via property_features | Yes |
| Q2.4 | MOD-02 | contacts Ownership | RESOLVED | Backbone/Core | Yes |
| Q2.5 | MOD-02 | communication_events Owner | RESOLVED | Backbone | Yes |
| Q3.6 | MOD-03 | connectors vs integration_registry | RESOLVED | Registry=Definitionen, connectors=Instanzen | Yes |

### Open Questions (mit Empfehlungen)

| Q-ID | Modul | Frage | Empfehlung | Impact | Risiko | Prio |
|------|-------|-------|------------|--------|--------|------|
| Q5.16 | MOD-05 | Renter-Adresse in contacts? | contacts.address erweitern | Mittel | Gering | P1 |
| Q6.2 | MOD-06 | Commission-Rate pro Listing? | Ja, pro Listing konfigurierbar | Mittel | Gering | P1 |
| Q6.3 | MOD-06 | Buyer Confirmation Phase? | Phase 2 | Gering | Gering | P1 |
| Q8.1 | MOD-08 | Commission Split fix? | Konfigurierbar pro Listing | Mittel | Mittel | P1 |
| Q8.5 | MOD-08 | Commission Payout? | Manuell Phase 1 | Gering | Gering | P1 |

### Top 5 Freeze Candidates (P0)

1. **Listing Status-Enum** (draft → internal_review → active → reserved → sold/withdrawn)
2. **SALES_MANDATE als Consent Gate für Listing-Aktivierung**
3. **Partner-Visibility Flag auf listings**
4. **COMMISSION_AGREEMENT als Consent Gate für Commissions**
5. **Investment Engine Input/Output Contract**

---

## DELIVERABLE C: PROJEKT-KOHÄRENZ-FRAGE

### Kritische Verständnisfrage

**Frage:** Ist die Annahme korrekt, dass MOD-06 (Verkauf) primär aus **Eigentümersicht** operiert (Listings erstellen, Verkaufsprozess steuern), während MOD-08 (Vertriebspartner) aus **Partnersicht** operiert (Listings browsen, Deals vermitteln, Provision erhalten)?

**Meine Hypothese:**
- MOD-06 = Der Property-Owner/Verwalter verkauft seine Immobilie
- MOD-08 = Externe Partner vermitteln Käufer und erhalten Provision
- Partner können KEINE Listings erstellen, nur lesen + Inquiries/Deals einbringen
- Die Plattform (Zone 1) approved Commissions, nicht der Property-Owner

**Impact bei Fehlinterpretation:** 
Falsche Rollenabgrenzung → falsche RLS-Policies → Sicherheitslücken oder Funktionsblockaden

---

## EXECUTIVE SUMMARY

### Was ist jetzt geklärt:

1. **MOD-01..05 IST-Zustand vollständig auditiert** — Routes, Datenmodell, APIs, Integrations
2. **MOD-06 Verkauf spezifiziert** — Listings, Inquiries, Reservations, Transactions mit SALES_MANDATE
3. **MOD-08 Vertriebspartner spezifiziert** — Pipeline, Investment Engine, Commissions mit COMMISSION_AGREEMENT
4. **Shared Domain dokumentiert** — Ownership-Matrix, Lifecycle-Diagramme, Cross-Module APIs
5. **Open Questions bereinigt** — 5 resolved, 5 verbleibend mit Empfehlungen

### Nächste 5 Schritte:

1. Route-Drift MOD-03 in App.tsx bereinigen
2. Dynamische Routes für MOD-04/06/08 in App.tsx ergänzen
3. DB-Schema für listings, inquiries, reservations, transactions erstellen
4. Investment Engine Edge Function implementieren
5. Consent-Templates für SALES_MANDATE + COMMISSION_AGREEMENT anlegen

### 5 P0-Entscheidungen:

1. ✅ Listing-Status-Enum FROZEN
2. ✅ SALES_MANDATE Consent FROZEN
3. ✅ Partner-Visibility-Mechanismus FROZEN
4. ✅ COMMISSION_AGREEMENT Consent FROZEN
5. ⏳ Commission-Split-Regel: Empfehlung 1/3-2/3 konfigurierbar

---

**Dokumente erstellt:**
- `docs/architecture/AUDIT_REPORT_MOD01-05_2026-01-25.md`
- `docs/modules/MOD-06_VERKAUF.md`
- `docs/modules/MOD-08_VERTRIEBSPARTNER.md`
- `docs/modules/MOD-06_08_SHARED_DOMAIN_AND_APIS.md`
