
# Compliance Consent-Enforcement erweitern (Delta)

## Was bereits steht (keine Aenderung noetig)

- Route + Menuepunkt "Rechtliches" unter Stammdaten
- RechtlichesTab.tsx mit Markdown-Viewer, Checkboxen, Consent-Speicherung
- useLegalConsent.ts Hook mit requireConsent()
- DB-Migration (compliance_doc_id + compliance_version auf user_consents)
- Placeholder-Rendering (renderComplianceMarkdown)
- Blocker in CreatePropertyRedirect + UploadDrawer

## Aenderungen (nur Delta)

### 1. ConsentRequiredModal (neu)
Datei: `src/components/portal/ConsentRequiredModal.tsx`

Eigenstaendiges AlertDialog-Modal (statt nur Toast):
- Titel: "Nutzungsvereinbarungen erforderlich"
- Text: "Bitte bestaetige zuerst unsere Nutzungsbedingungen und Datenschutzerklaerung, bevor du Daten speicherst oder Dokumente hochlaedst."
- Button "Jetzt bestaetigen" -> navigiert zu /portal/stammdaten/rechtliches
- Button "Abbrechen" -> schliesst Modal
- Wird von requireConsent() getriggert

### 2. useLegalConsent.ts erweitern
- Neuer State: `showConsentModal` (boolean) + `setShowConsentModal`
- requireConsent() setzt `showConsentModal = true` statt Toast (Modal ist blockierender/klarer)
- Return erweitern: `{ isConsentGiven, isLoading, requireConsent, showConsentModal, setShowConsentModal }`
- Alternativ: requireConsent() oeffnet das Modal direkt via globalen State/Context

Pragmatischere Variante: requireConsent() bleibt wie bisher (return boolean), aber zeigt ZUSAETZLICH zum Toast ein Modal. Das Modal wird als Portal-Level-Komponente einmal im Layout eingebunden.

### 3. Globaler Modal-Anker im Portal-Layout
Datei: `src/components/portal/PortalLayout.tsx` (oder aehnlich)

ConsentRequiredModal einmal global einbinden, getriggert ueber einen simplen Event/State:
- Option A: Zustand-Store (consent-modal-open)
- Option B: Custom Event ('show-consent-modal')
- Option C: Context-basiert im useLegalConsent

Empfehlung: **Option C** — useLegalConsent als Context-Provider mit Modal eingebaut.

### 4. Draft-Fallback in RechtlichesTab
Wenn keine active Version vorhanden: lade latest draft Version als Fallback.
- Badge "Entwurf" statt "Aktiv" anzeigen
- Zustimmung trotzdem erlauben (MVP)
- Aenderung in der queryFn: wenn status='active' leer, dann status='draft' + order version desc limit 1

### 5. Blocker an weiteren MVP-Stellen einbauen
Statt eines globalen supabaseWriteGuard die Top-Level-Create/Save-Handler der wichtigsten Module schuetzen:

| Modul | Datei | Aktion |
|-------|-------|--------|
| Immobilie loeschen | PropertyDetailPage.tsx | Vor delete-Mutation |
| Versicherung anlegen | SachversicherungenTab.tsx | Vor insert-Mutation |
| Kalender-Event | KalenderTab.tsx | Vor insert-Mutation |
| Miety Home anlegen | MietyCreateHomeForm.tsx | Vor insert/update |
| Miety Loan anlegen | LoanSection.tsx | Vor insert |
| Social Asset Upload | AssetsPage.tsx | Vor insert + storage upload |
| Kontakt/Lead Update | LeadManagerLeads.tsx | Vor update |
| PV Plant speichern | PVPlantDossier.tsx | Vor update |
| Contract Drawer | ContractDrawer.tsx | Vor save |

Pattern jeweils:
```text
const { requireConsent } = useLegalConsent();
// Im mutationFn oder onClick:
if (!requireConsent()) return;
```

### 6. Platzhalter-Sektion "Optionale Einwilligungen"
In RechtlichesTab.tsx: Unter den Pflichtvereinbarungen ein ausgegrauer Bereich:
- Titel: "Optionale Einwilligungen"
- Text: "Hier werden zukuenftig weitere optionale Einwilligungen angezeigt."
- Keine Funktionalitaet, nur Platzhalter

## Dateien-Uebersicht

| Datei | Aenderung |
|-------|-----------|
| src/components/portal/ConsentRequiredModal.tsx | NEU - AlertDialog Modal |
| src/hooks/useLegalConsent.ts | Modal-Trigger statt nur Toast |
| src/pages/portal/stammdaten/RechtlichesTab.tsx | Draft-Fallback + Platzhalter-Sektion |
| src/pages/portal/finanzanalyse/SachversicherungenTab.tsx | requireConsent() vor insert/update/delete |
| src/pages/portal/immobilien/PropertyDetailPage.tsx | requireConsent() vor delete |
| src/pages/portal/office/KalenderTab.tsx | requireConsent() vor insert |
| src/pages/portal/miety/components/MietyCreateHomeForm.tsx | requireConsent() vor insert/update |
| src/pages/portal/miety/components/LoanSection.tsx | requireConsent() vor insert |
| src/pages/portal/communication-pro/social/AssetsPage.tsx | requireConsent() vor insert/upload |
| src/pages/portal/lead-manager/LeadManagerLeads.tsx | requireConsent() vor update |
| src/pages/portal/photovoltaik/PVPlantDossier.tsx | requireConsent() vor update |
| src/pages/portal/miety/components/ContractDrawer.tsx | requireConsent() vor save |

## Bewusst NICHT umgesetzt

- **supabaseWriteGuard.ts**: Globaler Wrapper um alle Supabase-Calls ist fragil (bricht bei direkten Client-Aufrufen, schwer testbar). Punktuelles Einbauen in Mutations ist robuster und expliziter.
- **Re-Consent-Enforcement**: Struktur ist vorbereitet (Versions-Check existiert), aber kein aktiver Re-Consent-Flow im MVP.
- **Cookie-Banner**: Separates Thema.

## Reihenfolge

1. ConsentRequiredModal erstellen
2. useLegalConsent um Modal-Trigger erweitern
3. RechtlichesTab: Draft-Fallback + Platzhalter-Sektion
4. Blocker in alle MVP-Stellen einbauen (Batch)
