

## Audit: Upload-Felder & KI-Feedback — ChatGPT-Style Upgrade

### Ist-Zustand: 12 Upload-Bereiche identifiziert

Ich habe alle Module auf Upload-Felder und KI-Feedback-Punkte geprüft. Es gibt **12 verschiedene Upload-Implementierungen** mit stark unterschiedlicher UX-Qualität:

```text
QUALITÄT   KOMPONENTE                              MODUL      PROBLEM
─────────────────────────────────────────────────────────────────────────
★★★★★  ExcelImportDialog.tsx                    MOD-04     Bereits ChatGPT-Style (5-Step Timeline, Timer)
★★★★☆  IntakeUploadZone.tsx                     MOD-03     Per-File Status-Tracking, Progress Bar
★★★★☆  QuickIntakeUploader.tsx                  MOD-13     Multi-Step Workflow, aber kein Timer/Thinking
★★★☆☆  UploadResultCard.tsx                     Shared     Status-Badges vorhanden, aber kein AI-Progress
─────────────────────────────────────────────────────────────────────────
★★☆☆☆  StandaloneCalculatorPanel.tsx            MOD-12     Nur Spinner + "Extrahiere Daten..."
★★☆☆☆  OfferComparisonPanel.tsx                 MOD-04     Minimale FileUploader, kein AI-Feedback
★★☆☆☆  DocumentUploadSection.tsx                MOD-07     Checkliste gut, aber Upload-Zone nackt
★★☆☆☆  DocumentChecklist.tsx                    MOD-11     Fake-Upload, markiert nur als "hochgeladen"
★☆☆☆☆  UploadDrawer.tsx (Miety)                MOD-20     Nur Spinner, kein AI-Feedback
★☆☆☆☆  ScopeDefinitionPanel.tsx (Sanierung)     MOD-04     Text sagt "KI analysiert", aber kein Progress
★☆☆☆☆  Kaufy2026Verkaeufer.tsx                  Zone3      Kein visuelles Feedback während Upload
★☆☆☆☆  FileUploader.tsx (Default Mode)          Shared     Generisches Upload-Icon, kein Thinking-State
```

---

### Lösung: Shared `AIProcessingOverlay`-Komponente + Upgrades

Statt jede Komponente einzeln umzubauen, erstelle ich eine **wiederverwendbare Shared-Komponente** `AIProcessingOverlay`, die den ChatGPT-Style-Analyse-Flow kapselt:

**Neue Shared-Komponente: `src/components/shared/AIProcessingOverlay.tsx`**
- Animierter Thinking-Indicator (pulsierende Sparkles/Brain-Icons)
- Konfigurierbare Analyse-Steps (z.B. "Lese Dokument → Verstehe Struktur → Extrahiere Daten → Prüfe Ergebnisse")
- Echtzeit-Timer ("Analyse läuft seit 12s")
- Progress-Bar mit Step-Beschreibung
- Modul-spezifische Farben aus `designManifest`

**Neue Shared-Komponente: `src/components/shared/SmartDropZone.tsx`**
- ChatGPT-Style Upload-Zone mit großem Drop-Bereich
- Drag-Over Animation (Glow, Scale, Icon-Wechsel)
- Datei-Vorschau nach Auswahl (Name, Größe, Typ-Icon)
- Nahtloser Übergang in `AIProcessingOverlay` nach Upload
- Ersetzt das generische `FileUploader` Default-Layout

---

### Implementierungsschritte

1. **`AIProcessingOverlay` erstellen** — Shared-Komponente mit Step-Timeline, Timer, Progress-Bar, Thinking-Animation
2. **`SmartDropZone` erstellen** — ChatGPT-artiges Upload-Feld mit Glow-Effekt, Dateivorschau, nahtlosem Übergang zu AI-Processing
3. **`StandaloneCalculatorPanel` upgraden (MOD-12)** — Spinner durch AIProcessingOverlay ersetzen mit Steps: "Lese Exposé → Erkenne Zahlen → Befülle Felder"
4. **`OfferComparisonPanel` upgraden (MOD-04)** — Upload-Zone durch SmartDropZone ersetzen, AI-Feedback beim Angebots-Parsing zeigen
5. **`DocumentUploadSection` upgraden (MOD-07)** — Pro Kategorie AI-Analyse-Status anzeigen statt nur "Hochgeladen"
6. **`UploadDrawer` upgraden (MOD-20)** — SmartDropZone + AIProcessingOverlay einbauen
7. **`DocumentChecklist` upgraden (MOD-11)** — Echten Upload-Flow mit AI-Feedback statt Fake-Status
8. **`QuickIntakeUploader` erweitern (MOD-13)** — Timer + detailliertere Step-Beschreibungen während Analyse-Phase
9. **`ScopeDefinitionPanel` upgraden (MOD-04 Sanierung)** — AIProcessingOverlay für DMS-Analyse einbauen
10. **`Kaufy2026Verkaeufer` upgraden (Zone3)** — Upload-Schritte mit AI-Feedback versehen

### Betroffene Module & Freeze-Check

| Datei | Modul | Freeze-Status |
|-------|-------|---------------|
| `src/components/shared/AIProcessingOverlay.tsx` | Shared | FREI (neu) |
| `src/components/shared/SmartDropZone.tsx` | Shared | FREI (neu) |
| `src/pages/portal/akquise-manager/components/StandaloneCalculatorPanel.tsx` | MOD-12 | Prüfen |
| `src/components/portal/immobilien/sanierung/offers/OfferComparisonPanel.tsx` | MOD-04 | Prüfen |
| `src/components/finanzierung/DocumentUploadSection.tsx` | MOD-07 | Prüfen |
| `src/pages/portal/miety/components/UploadDrawer.tsx` | MOD-20 | Prüfen |
| `src/components/privatkredit/DocumentChecklist.tsx` | MOD-11 | Prüfen |
| `src/components/projekte/QuickIntakeUploader.tsx` | MOD-13 | Prüfen |
| `src/components/portal/immobilien/sanierung/scope/ScopeDefinitionPanel.tsx` | MOD-04 | Prüfen |
| `src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx` | Zone3 | Prüfen |

Alle Freeze-Status werden vor jeder Dateiänderung geprüft. Shared-Dateien sind immer frei.

