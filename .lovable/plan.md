

# Zone 2: Stammdaten "Rechtliches" + Save/Upload-Blocker (MVP)

## Bewertung

Der Entwurf ist **technisch sauber und umsetzbar**. Die SSOT-Kette (Zone 1 Compliance Desk -> Zone 2 Anzeige -> user_consents) passt perfekt zur bestehenden Architektur. Drei Details zur Praezisierung:

1. **user_consents Schema-Kompatibilitaet**: Die bestehende `user_consents` Tabelle referenziert `template_id` (UUID FK auf `agreement_templates`). Fuer Compliance-Dokumente muss ein neues Feld `compliance_doc_id` (FK auf `compliance_documents`) + `compliance_version` (INT) hinzugefuegt werden, da die Portal-AGB/Privacy NICHT in `agreement_templates` liegen sondern in `compliance_documents`.

2. **requireLegalConsent Hook**: Kein globaler Save-Interceptor vorhanden. Der Check wird als Hook implementiert und punktuell in die Create/Upload-Flows eingebaut (best effort an den genannten Stellen).

3. **Placeholder-Rendering**: Wird clientseitig mit einfachem String-Replace auf den Markdown-Content gemacht, bevor er angezeigt wird.

## Datenbank-Aenderungen

### Migration: `user_consents` erweitern
```text
ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS compliance_doc_id UUID REFERENCES compliance_documents(id),
  ADD COLUMN IF NOT EXISTS compliance_version INT;
```
Bestehende Eintraege (mit template_id auf agreement_templates) bleiben unberuehrt. Neue Portal-AGB/Privacy-Consents nutzen `compliance_doc_id` + `compliance_version` statt `template_id`.

## Route + Navigation

### StammdatenPage.tsx
Neuer lazy-loaded Route-Eintrag:
```text
Route path="rechtliches" -> RechtlichesTab
```

### moduleContents.ts (HowItWorks subTiles)
Neuer Eintrag in MOD-01 subTiles:
```text
{ title: 'Rechtliches', route: '/portal/stammdaten/rechtliches', icon: Scale }
```

### stammdaten/index.ts
Export hinzufuegen: `export { RechtlichesTab } from './RechtlichesTab';`

## Neue Dateien

### 1. `src/pages/portal/stammdaten/RechtlichesTab.tsx`
Inline-Flow-Seite mit:
- **Status-Banner**: "Zugestimmt" (gruen) / "Zustimmung erforderlich" (gelb) / "Neue Version verfuegbar" (orange)
- **Card "AGB"**: Titel, Version-Badge, Status-Badge, Accordion mit gerendertem Markdown (Platzhalter ersetzt)
- **Card "Datenschutz"**: analog
- **Optional Card "Sicherheitshinweise"**: nur Anzeige, keine Checkbox
- **Checkbox AGB** (Pflicht) + **Checkbox Datenschutz** (Pflicht)
- **Button "Zustimmen und Freischalten"**: disabled bis beide Checkboxen true
- Nach Zustimmung: Anzeige "Zugestimmt am {date} - AGB v{X} - Datenschutz v{Y}"
- Re-Consent-Banner wenn neue aktive Versionen existieren

Datenquellen:
- `compliance_documents` (doc_key = portal_agb, portal_privacy) + aktive `compliance_document_versions`
- `compliance_company_profile` (fuer Platzhalter-Replacement)
- `user_consents` (Check ob bereits zugestimmt fuer aktive Version)

### 2. `src/hooks/useLegalConsent.ts`
Zentraler Hook:
```text
useLegalConsent() -> { isConsentGiven: boolean, isLoading: boolean, requireConsent: () => boolean }
```
Logik:
1. Lade aktive Versionen fuer portal_agb + portal_privacy aus `compliance_document_versions` (status=active)
2. Pruefe `user_consents` fuer aktuellen user_id: existiert accepted consent mit matching compliance_doc_id + compliance_version?
3. `requireConsent()`: Wenn nicht gegeben -> Toast mit "Bitte bestaetige zuerst die Nutzungsvereinbarungen" + Button "Zu Rechtliches" (navigiert zu /portal/stammdaten/rechtliches). Return false.
4. Caching via React Query (queryKey: ['legal-consent-status', userId])

### 3. `src/lib/complianceHelpers.ts` (erweitern)
Neue Funktion:
```text
renderComplianceMarkdown(content_md: string, companyProfile: CompanyProfile): string
```
Ersetzt {company_name}, {legal_form}, {address_line1}, {postal_code}, {city}, {email}, {phone}, {managing_directors}, {commercial_register.court}, {commercial_register.number}, {vat_id}, {supervisory_authority}, {website_url} im Markdown-Text.

## Blocker-Integration (MVP-Stellen)

An diesen Stellen wird `requireConsent()` vor der Aktion aufgerufen:

| Stelle | Datei | Aktion |
|--------|-------|--------|
| Immobilie anlegen | `CreatePropertyRedirect.tsx` | Vor navigate: if (!requireConsent()) return |
| Immobilie anlegen (Button) | `PortfolioTab.tsx` | onClick-Handler wrappen |
| Dokument Upload | `UploadDrawer.tsx` / DMS Upload-Buttons | Vor Upload-Start |
| Selbstauskunft anlegen | MOD-07 Create-Flow | Vor Submit |
| Kontakt anlegen | Kontakte Create-Flow | Vor Submit |

Pattern fuer jeden Blocker:
```text
const { requireConsent } = useLegalConsent();
// Im onClick/onSubmit Handler:
if (!requireConsent()) return;
// ... normaler Flow
```

## Consent speichern (RechtlichesTab)

Beim Klick "Zustimmen und Freischalten":
1. INSERT 2 Datensaetze in `user_consents`:
   - compliance_doc_id = portal_agb doc id, compliance_version = aktive Version, status = 'accepted'
   - compliance_doc_id = portal_privacy doc id, compliance_version = aktive Version, status = 'accepted'
   - user_id, tenant_id, consented_at = now()
2. Ledger Event: `consent.given` (bereits in Whitelist)
3. Invalidate React Query Cache fuer `['legal-consent-status']`

## Umsetzungsreihenfolge

1. DB-Migration: `user_consents` um `compliance_doc_id` + `compliance_version` erweitern
2. Route + Menuepunkt: StammdatenPage.tsx + moduleContents.ts + index.ts
3. `complianceHelpers.ts`: Platzhalter-Renderer
4. `RechtlichesTab.tsx`: Vollstaendige Seite mit Laden, Anzeigen, Checkboxen, Consent-Speicherung
5. `useLegalConsent.ts`: Zentraler Hook + Blocker-Toast
6. Blocker einbauen: CreatePropertyRedirect, PortfolioTab, UploadDrawer (MVP-Minimum)

## Nicht-Ziele (explizit ausgeschlossen)

- Kein Cookie-Banner
- Kein DSAR Self-Service im Portal
- Kein PDF-Export der Legaltexte
- Keine RLS-basierte Blockierung (nur UI-seitig im MVP)

