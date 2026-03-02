

# Spracheingabe: Sinnvolle Felder — Bestandsaufnahme und Empfehlung

## Aktueller Stand

Bereits mit DictationButton ausgestattet (9 Stellen):
- Armstrong Chat, ChatPanel, ComposeEmailDialog (E-Mail Body)
- CampaignWizard (Kampagnen-Nachricht)
- ClaimCreateDialog (Schadensbeschreibung)
- ServiceCaseCreateInline (Sanierungsbeschreibung)
- ScopeDefinitionPanel (Sanierungsumfang + Ausschreibungstext)
- DeliveryTab (Praesentationsnotizen)
- KontakteTab (Kontakt-Notizen)
- MietyPortalPage (WhatsApp/E-Mail/Uebersetzer)
- TenderDraftPanel (Zusaetzliche Hinweise)

## Fehlende Felder — hoher Mehrwert

Diese Felder haben grosse Textareeas ohne Spracheingabe, wo User viel tippen muessen:

| Nr | Modul | Datei | Feld | Begruendung |
|----|-------|-------|------|-------------|
| 1 | **Verkauf (MOD-06)** | `ExposeDetail.tsx` | Objektbeschreibung fuer Expose | Sehr langer Freitext, oft mehrere Absaetze |
| 2 | **Akquise (MOD-12)** | `AkquiseMandate.tsx` | Mandats-Freitext (Suchprofil) | Komplexe Anforderungen muendlich viel einfacher |
| 3 | **Akquise (MOD-12)** | `AkquiseMandate.tsx` | E-Mail-Body an Anbieter | Laengere E-Mail-Texte |
| 4 | **Akquise (MOD-12)** | `ActivityLogPanel.tsx` | Aktivitaetsbeschreibung | "Was wurde besprochen?" — typischer Diktier-Fall |
| 5 | **Akquise (MOD-12)** | `InteresseDialog.tsx` | Nachricht an Anbieter | Persoenliche Nachrichten |
| 6 | **Projekte (MOD-13)** | `LandingPageTab.tsx` | Projektbeschreibung | Marketingtext, mehrere Saetze |
| 7 | **Projekte (MOD-13)** | `UnitDetailPage.tsx` | Einheit-Notizen | Freitext-Notizen |
| 8 | **Immobilienakte (MOD-04)** | `EditableAddressBlock.tsx` | Lagebeschreibung | Strukturierte Beschreibung zu Lage und Objekt |
| 9 | **Briefgenerator (MOD-02)** | `BriefTab.tsx` | Brief-Body | Der laengste Freitext im System |

## Zusammenfassung

Ihre genannten Bereiche (Armstrong, Brief, E-Mail, Sanierung) sind bereits abgedeckt. Die groessten Luecken sehe ich bei:

1. **Expose-Objektbeschreibung** (Verkauf) — oft 200+ Woerter
2. **Akquise-Mandate** — komplexe Suchprofile muendlich viel natuerlicher
3. **Briefgenerator-Body** — der laengste Freitext, hat noch keinen DictationButton
4. **Lagebeschreibung** (Immobilienakte) — strukturierter Text ueber Mikrolage

Insgesamt 9 neue DictationButton-Integrationen. Alle folgen dem gleichen Muster: `<DictationButton onTranscript={(text) => setState(prev => prev + ' ' + text)} />` neben dem Label. Dazu Update des `voiceIntegrationManifest.ts`.

Soll ich alle 9 Felder in einem Rutsch implementieren?

