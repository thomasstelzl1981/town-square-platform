
# Plan: Flaechendeckender Consent-Check + Erklaer-Onboarding

## Uebersicht

Zwei Massnahmen:
1. **Consent-Check in allen fehlenden Modulen** einbauen (derzeit nur ~12 von ~45 Write-Actions geschuetzt)
2. **Erklaer-Funktion ("Data Readiness Guard")** -- ein einmaliger Hinweis, der dem User erklaert: "Um eigene Daten einzugeben, musst du (a) Demo-Daten deaktivieren und (b) Rechtliches bestaetigen"

---

## Teil 1: Consent-Check flaechendeckend einbauen

### Bestandsaufnahme

**Bereits geschuetzt (12 Stellen):**
- MietyCreateHomeForm (insert/update)
- ContractDrawer (insert)
- LoanSection (insert/delete)
- SachversicherungenTab (insert/update/delete)
- PropertyDetailPage (delete)
- CreatePropertyRedirect (redirect-guard)
- UploadDrawer (open-guard)
- KalenderTab (insert)
- PVPlantDossier (update)
- LeadManagerLeads (update)
- AssetsPage (upload)

**FEHLEND -- muss ergaenzt werden (33 Stellen in 19 Dateien):**

| Datei | Write-Actions ohne Check |
|---|---|
| `finanzanalyse/VorsorgeTab.tsx` | insert, update, delete (3x) |
| `finanzanalyse/InvestmentTab.tsx` | insert, update, delete (3x) |
| `finanzanalyse/AbonnementsTab.tsx` | insert, update, delete (3x) |
| `finanzanalyse/KontenTab.tsx` | delete (1x) |
| `miety/components/MietyContractsSection.tsx` | delete (1x) |
| `miety/components/TenancySection.tsx` | insert/update (1x) |
| `miety/components/MeterReadingDrawer.tsx` | insert (1x) |
| `miety/tiles/UebersichtTile.tsx` | delete, insert (2x) |
| `office/KontakteTab.tsx` | insert, update, delete (3x) |
| `office/BriefTab.tsx` | insert (2x) |
| `dms/StorageTab.tsx` | insert, delete (4x) |
| `dms/SortierenTab.tsx` | insert, delete (4x) |
| `dms/EinstellungenTab.tsx` | update (1x) |
| `photovoltaik/AnlagenTab.tsx` | delete, insert (2x) |
| `communication-pro/social/KnowledgePage.tsx` | insert, delete, update (3x) |
| `communication-pro/social/CreatePage.tsx` | update, delete, insert (4x) |
| `communication-pro/social/InspirationPage.tsx` | insert, delete (3x) |
| `communication-pro/social/InboundPage.tsx` | insert, delete, update (3x) |
| `communication-pro/social/CalendarPage.tsx` | update (2x) |
| `communication-pro/social/PerformancePage.tsx` | insert (1x) |
| `communication-pro/social/OverviewPage.tsx` | insert (1x) |
| `finanzierungsmanager/FMUebersichtTab.tsx` | insert, update, delete (3x) |
| `finanzierungsmanager/FMFallDetail.tsx` | insert, update (2x) |
| `finanzierungsmanager/FMEinreichung.tsx` | update (3x) |
| `finanzierungsmanager/FMDashboard.tsx` | update (1x) |
| `akquise-manager/AkquiseDashboard.tsx` | update (1x) |
| `petmanager/PMFinanzen.tsx` | insert, update (2x) |

### Implementierungsmuster

Jede Datei bekommt dasselbe Pattern (bereits in 12 Stellen bewaehrt):

```text
// Import
import { useLegalConsent } from '@/hooks/useLegalConsent';
import { ConsentRequiredModal } from '@/components/portal/ConsentRequiredModal';

// In der Komponente
const consentGuard = useLegalConsent();

// In jeder Mutation
mutationFn: async (...) => {
  if (!consentGuard.requireConsent()) throw new Error('Consent required');
  // ... bestehende Logik
}

// Im JSX (einmal pro Datei)
<ConsentRequiredModal
  open={consentGuard.showConsentModal}
  onOpenChange={consentGuard.setShowConsentModal}
/>
```

---

## Teil 2: Erklaer-Funktion ("Data Readiness Guard")

### Konzept

Ein **einmaliger Onboarding-Hinweis**, der erscheint wenn ein User zum ersten Mal versucht, eigene Daten einzugeben. Er erklaert die 2 Voraussetzungen:

1. **Demo-Daten deaktivieren** -- damit keine Muster-Eintraege die eigenen Daten vermischen
2. **Rechtliches bestaetigen** -- AGB + Datenschutz akzeptieren

### UI-Konzept: "DataReadinessModal"

Ein AlertDialog (wie ConsentRequiredModal), der bei der ersten Write-Action erscheint, BEVOR der Consent-Check greift. Drei Zustaende:

```text
+-----------------------------------------------+
|  Eigene Daten eingeben                         |
|                                                |
|  Bevor du eigene Vertraege und Daten anlegen   |
|  kannst, sind zwei Schritte noetig:            |
|                                                |
|  [x] Demo-Daten deaktivieren                   |
|      Unter Stammdaten > Demo-Daten die         |
|      Musterdaten ausschalten, damit deine      |
|      eigenen Eintraege nicht vermischt werden   |
|                                                |
|  [x] Nutzungsvereinbarungen bestaetigen        |
|      Unter Stammdaten > Rechtliches die AGB    |
|      und Datenschutzerklaerung akzeptieren      |
|                                                |
|  [Abbrechen]  [Zu Demo-Daten]  [Zu Rechtliches]|
+-----------------------------------------------+
```

### Technische Umsetzung

**Neue Datei: `src/components/portal/DataReadinessModal.tsx`**
- AlertDialog mit den zwei Schritten
- Zeigt Status-Icons (Haken wenn erledigt, Warnung wenn offen)
- Buttons zu den beiden Stammdaten-Seiten
- Wird nur angezeigt wenn BEIDES noch nicht erledigt ist

**Neue Datei: `src/hooks/useDataReadiness.ts`**
- Kombiniert `useLegalConsent()` + `useDemoToggles()`
- Prueft: Sind Demo-Daten aktiv UND Consent fehlt?
- `requireReadiness()` -- zeigt Modal wenn nicht bereit, gibt `true` zurueck wenn alles OK
- Speichert "dismissed" in localStorage, damit der Hinweis nicht bei jeder Action kommt
- Logik: Wenn Demo-Daten AUS und Consent gegeben --> direkt durchlassen
- Wenn nur Consent fehlt --> ConsentRequiredModal (wie bisher)
- Wenn beides fehlt --> DataReadinessModal (erklaert beide Schritte)

**Integration:** Der `useDataReadiness` Hook ersetzt `useLegalConsent` in allen Write-Action-Guards. So bekommt der User automatisch den richtigen Hinweis.

### Ablauf-Logik

```text
User klickt "Speichern" / "Anlegen"
  |
  v
useDataReadiness.requireReadiness()
  |
  +-- Demo AUS + Consent OK --> true (durchlassen)
  |
  +-- Demo AUS + Consent FEHLT --> ConsentRequiredModal zeigen, return false
  |
  +-- Demo AN + Consent FEHLT --> DataReadinessModal zeigen (erklaert beide Schritte), return false
  |
  +-- Demo AN + Consent OK --> optionaler Hinweis "Demo-Daten noch aktiv", aber durchlassen (User hat bewusst entschieden)
```

---

## Dateien die geaendert/erstellt werden

### Neue Dateien (2)
| Datei | Inhalt |
|---|---|
| `src/hooks/useDataReadiness.ts` | Kombinations-Hook aus useLegalConsent + useDemoToggles |
| `src/components/portal/DataReadinessModal.tsx` | Erklaer-Dialog mit 2 Schritten |

### Geaenderte Dateien (~25)

Alle oben gelisteten Dateien ohne Consent-Check bekommen:
1. `import { useDataReadiness }` statt oder zusaetzlich zu `useLegalConsent`
2. `requireReadiness()` Guard in jeder Mutation
3. `<DataReadinessModal />` und/oder `<ConsentRequiredModal />` im JSX

Die bereits geschuetzten Dateien (12 Stellen) werden auf `useDataReadiness` umgestellt, damit der Erklaer-Flow konsistent ist.

### Keine Datenbank-Aenderungen

Alles client-seitig. Keine Migration noetig.

### Keine neuen Abhaengigkeiten

Verwendet nur vorhandene UI-Komponenten (AlertDialog, Badge, Button).

---

## Freeze-Check

Die betroffenen Module und ihr Freeze-Status muessen geprueft werden. Dateien unter `src/hooks/` und `src/components/portal/` sind NICHT modul-gebunden und daher frei editierbar.

Die Modul-Dateien selbst (z.B. `finanzanalyse/VorsorgeTab.tsx`) gehoeren zu ihren jeweiligen Modulen:
- MOD-18 Finanzanalyse -- muss geprueft werden
- MOD-20 Miety -- muss geprueft werden
- MOD-02 Office -- muss geprueft werden
- MOD-03 DMS -- muss geprueft werden
- MOD-19 Photovoltaik -- muss geprueft werden
- MOD-14 Communication Pro -- muss geprueft werden
- MOD-11 Finanzierungsmanager -- muss geprueft werden
- MOD-12 Akquise -- muss geprueft werden
- MOD-22 Petmanager -- muss geprueft werden

Frozen Module werden uebersprungen. Der Consent-Guard wird nur in unfrozen Modulen eingebaut.

---

## Erwartetes Ergebnis

- **100% der Write-Actions** im Portal sind durch den Consent-Check geschuetzt
- Beim ersten Versuch, eigene Daten einzugeben, bekommt der User eine klare Erklaerung was zu tun ist
- Der Erklaer-Dialog verlinkt direkt zu den beiden relevanten Stammdaten-Seiten
- Bestehende geschuetzte Stellen funktionieren weiterhin, werden aber auf den neuen kombinierten Hook umgestellt
