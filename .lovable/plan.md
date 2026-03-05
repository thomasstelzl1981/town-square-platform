

# Refactoring-Plan: AkquiseMandate.tsx (B-4)

## Ist-Zustand

Die Datei hat **885 Zeilen** und enthält 6 klar trennbare Bereiche in einer einzigen Komponente:

| Bereich | Zeilen | Beschreibung |
|---------|--------|-------------|
| Imports + Configs | 1–108 | 3 Config-Objekte (SOURCE, MSG_STATUS, CONTACT_STATUS), Types |
| State + Hooks | 109–177 | ~25 useState-Deklarationen, ~10 Hook-Aufrufe |
| Handler-Funktionen | 178–447 | 7 Funktionen (Extract, PDF, CreateMandate, ApplyProfile, ContactBookImport, SendEmails, Helpers) |
| JSX: Widget-Grid + Kachel 1+2 | 451–637 | Mandate-Cards, KI-Erfassung, Ankaufsprofil |
| JSX: CI-Vorschau + Consent + Kachel 3+4 | 640–813 | CI-Preview, Mandatserteilung, SourcingTab (bereits extrahiert), E-Mail-Fenster |
| JSX: Sentbox + Dialog + Helpers | 815–885 | Dokumentation-Liste, ContactBookDialog, ProfileRow, formatPriceRange |

**Kachel 3 (SourcingTab)** ist bereits als eigene Komponente extrahiert — das war das richtige Pattern. Die restlichen 5 Sektionen sind noch inline.

## Refactoring-Plan: 5 Extraktionen

### 1. `ProfileExtractionCard.tsx` (Kachel 1)
**Zeilen 506–572** (~65 Zeilen JSX + Steuerfelder-Logik)

Extrahiert: Freitext-Eingabe, DictationButton, optionale Steuerparameter (Preis, Region, Asset-Fokus, Rendite, Ausschlüsse), "Generieren"-Button.

Props: `freeText, setFreeText, steerParams (object), onToggleAsset, onExtract, isExtracting`

### 2. `ProfileOutputCard.tsx` (Kachel 2)
**Zeilen 574–637** (~63 Zeilen JSX)

Extrahiert: Mandanten-Eingabe, strukturierte Profil-Anzeige (ProfileRow), editierbare Zusammenfassung, "Übernehmen"-Button.

Props: `profileData, profileGenerated, clientName, setClientName, profileTextLong, setProfileTextLong, onApplyProfile, onOpenContactBook`

### 3. `ProfilePreviewSection.tsx` (CI-Vorschau + Consent + Mandate-Erstellung)
**Zeilen 640–714** (~75 Zeilen JSX)

Extrahiert: CI-Vorschau mit PDF/Druck-Buttons, Consent-Checkboxen, Mandat-erstellen-Button, Mandate-Badge.

Props: `previewData, previewTextLong, clientName, onGeneratePdf, consents, onCreateMandate, mandateCreated, mandateCode`

### 4. `EmailComposeCard.tsx` (Kachel 4)
**Zeilen 731–813** (~82 Zeilen JSX)

Extrahiert: Empfänger-Chips, Betreff, Nachricht (mit Diktat), Anhang-Anzeige, Senden-Button, letzte Nachrichten.

Props: `selectedContacts, emailSubject, emailBody, setEmailSubject, setEmailBody, onToggleContact, onSend, isSending, profileGenerated, clientName, sentMessages`

### 5. `SentMessagesLog.tsx` (Dokumentation-Bereich)
**Zeilen 822–856** (~34 Zeilen JSX)

Extrahiert: Vollbreite Dokumentations-Card mit Status-Icons und Zeitstempel.

Props: `messages`

### Zusätzlich: Config + Helpers auslagern

- `SOURCE_CONFIG`, `MSG_STATUS_CONFIG`, `CONTACT_STATUS_CONFIG` → nach `src/components/akquise/acqConfigs.ts`
- `ProfileRow`, `formatPriceRange` → nach `src/components/akquise/ProfileRow.tsx`
- `generatePdf` → nach `src/components/akquise/acqPdfExport.ts` (pure function, nimmt profileData + clientName)

## Ergebnis nach Refactoring

```text
AkquiseMandate.tsx (~180 Zeilen)
├── State-Deklarationen + Hooks (~70 Zeilen)
├── Handler orchestrieren Sub-Komponenten (~60 Zeilen)
└── JSX: WidgetGrid + 5 Komponenten + Dialog (~50 Zeilen)

Neue Dateien:
├── components/ProfileExtractionCard.tsx (~90 Zeilen)
├── components/ProfileOutputCard.tsx (~85 Zeilen)
├── components/ProfilePreviewSection.tsx (~95 Zeilen)
├── components/EmailComposeCard.tsx (~100 Zeilen)
├── components/SentMessagesLog.tsx (~50 Zeilen)
├── src/components/akquise/acqConfigs.ts (~30 Zeilen)
├── src/components/akquise/acqPdfExport.ts (~70 Zeilen)
└── src/components/akquise/ProfileRow.tsx (~20 Zeilen)
```

**AkquiseMandate.tsx schrumpft von 885 auf ~180 Zeilen** (80% Reduktion). Alle neuen Dateien landen im bestehenden `components/`-Verzeichnis unter `src/pages/portal/akquise-manager/components/` (Kachel-Komponenten) bzw. `src/components/akquise/` (shared helpers). Kein neues Routing, keine DB-Änderungen, kein Freeze-Bruch bei anderen Modulen.

