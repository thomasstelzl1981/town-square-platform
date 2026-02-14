
# Umbau: Posteingang-Modell und Vertragsabschluss-Standard

## Zusammenfassung

Das bisherige Modell (Admin routet Post manuell via Zone 1 an Tenants) wird ersetzt durch ein Self-Service-Modell: Tenants schliessen einen Vertrag ab, erhalten danach eine Inbound-E-Mail-Adresse, und eingehende PDFs werden automatisch verarbeitet. Das Admin-Inbox-Modul in Zone 1 entfaellt komplett.

Zusaetzlich wird ein systemweiter Vertragsabschluss-Standard als Spec-Datei dokumentiert.

---

## Teil 1: Admin Inbox entfernen (Zone 1)

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Route `inbox` entfernen |
| `src/components/admin/AdminSidebar.tsx` | `Inbox` aus ICON_MAP und Navigation entfernen |
| `src/router/ManifestRouter.tsx` | Lazy-Import und `adminComponentMap`-Eintrag fuer `Inbox` entfernen |
| `src/lib/postRouting.ts` | Datei entfernen (Zone-1-Routing-Engine nicht mehr benoetigt) |

Die Datei `src/pages/admin/Inbox.tsx` bleibt vorerst im Repo (toter Code), kann aber spaeter aufgeraeumt werden. Die DB-Tabellen (`inbound_items`, `inbound_routing_rules`) bleiben bestehen fuer eventuelle spaetere Nutzung.

---

## Teil 2: Zone 2 Posteingang umbauen (Vertrags-Gate)

### Neues Verhalten der PosteingangTab

**Ohne aktiven Postservice-Vertrag:**
- Keine E-Mail-Adresse sichtbar
- Informationsbereich mit:
  - Erklaerung, was der digitale Postservice bietet
  - Hinweis auf externe Post-Scan-Dienste (z.B. CAYA, Dropscan)
  - Hinweis auf manuellen PDF-Upload als Alternative
  - CTA-Button "Postservice aktivieren" der zur Einstellungen-Seite navigiert oder direkt den TermsGate-Dialog oeffnet

**Mit aktivem Postservice-Vertrag (Status `active`):**
- Generierte Inbound-E-Mail-Adresse wird angezeigt
- E-Mail-Tabelle wie bisher
- Hinweis auf Credit-Kosten pro verarbeitetem Dokument

### Aenderungen an PosteingangTab.tsx

- Neue Query: `postservice_mandates` mit `status = 'active'` fuer den aktuellen Tenant pruefen
- Wenn kein aktiver Vertrag: Info-Screen rendern (kein Mailbox-Fetch, keine E-Mail-Tabelle)
- Wenn aktiver Vertrag: Bestehende Funktionalitaet (Mailbox + Tabelle)

---

## Teil 3: TermsGate in den Postservice-Vertragsabschluss integrieren

### Aenderungen an EinstellungenTab.tsx

Der bestehende "Nachsendeauftrag einrichten"-Button wird durch einen TermsGate-Flow ersetzt:

1. Nutzer klickt "Postservice aktivieren"
2. Dialog oeffnet sich mit TermsGatePanel:
   - Template: `POSTSERVICE_ACTIVATION_V1`
   - Vertragsbedingungen: Monatliche Credits, Kosten pro Brief, Mindestlaufzeit
   - Keine Provision (grossCommission = 0), stattdessen Servicegebuehr
3. Nach Akzeptanz:
   - `postservice_mandates`-Eintrag wird erstellt (Status: `active` statt `requested`)
   - Inbound-E-Mail-Adresse wird generiert
   - Vertragsdokument wird im DMS abgelegt (automatisch via TermsGatePanel)

### Neue Contract-Template

Neuer Eintrag in der Contract-Template-Logik fuer `POSTSERVICE_ACTIVATION_V1` mit Postservice-spezifischen Bedingungen (Laufzeit, Credits, Kuendigungsfrist).

---

## Teil 4: Vertragsabschluss-Standard (Neue Spec-Datei)

### Neue Datei: `spec/current/06_api_contracts/CONTRACT_TERMS_GATE_STANDARD.md`

Dokumentiert den systemweiten Standard fuer alle Vertragsabschluesse:

**Inhalt:**
1. **Ablauf**: Immer ueber TermsGatePanel-Komponente (Dialog/Inline)
2. **Vertragserstellung**: Contract-Template wird gerendert, Nutzer akzeptiert mit Checkbox
3. **Persistenz**: 
   - `user_consents` Tabelle: Consent-Eintrag mit Template-Code und Zeitstempel
   - DMS-Ablage: PDF des Vertrags wird in Zone 2 beim Tenant gespeichert
   - Zone 1 Kopie: Vertrag wird zusaetzlich im Admin-DMS referenziert (via `document_links`)
4. **Provisionserfassung**: Bei provisionsrelevanten Vertraegen wird ein `commissions`-Eintrag erstellt
5. **Aktuelle Anwendungsfaelle**:
   - `PARTNER_RELEASE_V1` (MOD-04/09 Vertriebsauftrag)
   - `FIN_MANDATE_ACCEPTANCE_V1` (MOD-11 Finanzierung)
   - `ACQ_MANDATE_ACCEPTANCE_V1` (MOD-12 Akquise)
   - `POSTSERVICE_ACTIVATION_V1` (MOD-03 Postservice) — NEU
6. **Ablage-Standard**: Jeder Vertrag wird unter `{tenant_id}/MOD_03/contracts/` im Storage abgelegt. Beide Parteien (Tenant + Plattform) erhalten eine Referenz.

---

## Teil 5: Contract-Template fuer Postservice

### Neue Template-Registrierung in `src/lib/contractGenerator.ts`

Neues Template `POSTSERVICE_ACTIVATION_V1` mit:
- Titel: "Vereinbarung ueber den digitalen Postservice"
- Inhalt: Leistungsbeschreibung, Kostenmodell (Credits), Laufzeit, Kuendigungsklausel, Datenschutzhinweis
- Variables: `{recipient_name}`, `{address}`, `{date}`, `{monthly_credits}`, `{cost_per_letter}`

---

## Zusammenfassung betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Route `inbox` entfernen |
| `src/components/admin/AdminSidebar.tsx` | Inbox-Eintrag entfernen |
| `src/router/ManifestRouter.tsx` | Inbox-Mapping entfernen |
| `src/lib/postRouting.ts` | Datei entfernen |
| `src/pages/portal/dms/PosteingangTab.tsx` | Vertrags-Gate einbauen (Info-Screen vs. Inbox) |
| `src/pages/portal/dms/EinstellungenTab.tsx` | TermsGatePanel fuer Postservice-Aktivierung |
| `src/lib/contractGenerator.ts` | Template `POSTSERVICE_ACTIVATION_V1` hinzufuegen |
| `spec/current/06_api_contracts/CONTRACT_TERMS_GATE_STANDARD.md` | NEU — Systemweiter Vertragsabschluss-Standard |

### Was sich NICHT aendert

- Datenbank-Tabellen (`inbound_emails`, `inbound_items`, `postservice_mandates`) — bleiben
- Zone 2 SortierenTab — bleibt (funktioniert weiterhin nach Aktivierung)
- Zone 2 EinstellungenTab Speicher/OCR-Kacheln — bleiben unveraendert
- TermsGatePanel-Komponente — wird wiederverwendet, nicht veraendert
- Bestehende TermsGate-Flows (MOD-04, MOD-11, MOD-12) — keine Aenderung
