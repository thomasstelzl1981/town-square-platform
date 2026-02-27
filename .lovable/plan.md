

## Muster-Excel-Vorlage für Portfolio-Import

### Ziel
Eine professionelle XLSX-Vorlage mit **einem Tabellenblatt** und **farblicher Abstufung** zwischen Pflichtfeldern und optionalen Feldern. Download-Button direkt in der Import-Zone auf `PortfolioTab.tsx`.

### Tabellenstruktur (1 Sheet: "Portfolio")

**Grün (Pflichtfelder — Minimum für sinnvollen Import):**
| Code | Art | Adresse | PLZ | Ort | Nutzung |

**Blau (Erweiterte Stammdaten):**
| Fläche (qm) | Einheiten | Baujahr | Kaufpreis | Marktwert | Kaltmiete/Monat | Jahresmiete p.a. |

**Orange (Finanzierung/Darlehen):**
| Bank | Restschuld | Annuität/Monat | Zinssatz (%) | Zinsbindung bis |

→ 3 Beispielzeilen mit realistischen Demo-Werten (ETW Berlin, MFH München, ETW Hamburg)

### Technische Umsetzung

1. **`public/templates/portfolio_import_vorlage.xlsx`** — Statische XLSX-Datei, generiert via Edge Function einmalig ODER als programmatisch erzeugte Datei beim Download

2. **Besser: Programmatische Erzeugung im Browser** via SheetJS (`xlsx`-Paket bereits installiert):
   - Neue Utility-Funktion `src/lib/generatePortfolioTemplate.ts`
   - Nutzt `xlsx` um Workbook mit Spaltenbreiten, Header-Farben und 3 Beispielzeilen zu erzeugen
   - Farb-Kodierung: Grüner Header für Pflicht, Blauer Header für erweitert, Oranger Header für Finanzierung
   - Ausgabe als Blob → `URL.createObjectURL` → Download

3. **Download-Button in `PortfolioTab.tsx`**:
   - Unter der Import-Dropzone: kleiner Link/Button "📥 Muster-Vorlage herunterladen"
   - Ruft `generatePortfolioTemplate()` auf und triggert Download

### Dateien (2 Änderungen)

| Datei | Aktion |
|-------|--------|
| `src/lib/generatePortfolioTemplate.ts` | **NEU** — Template-Generator mit SheetJS |
| `src/pages/portal/immobilien/PortfolioTab.tsx` | **EDIT** — Download-Button unter der Import-Zone |

### Spalten-Mapping (exakt passend zum AI-Prompt in `sot-excel-ai-import`)

Die Header-Namen werden so gewählt, dass die KI sie sofort korrekt zuordnet:

```text
Pflicht:  Code | Art | Adresse | PLZ | Ort | Nutzung
Erweitert: Fläche (qm) | Einheiten | Baujahr | Kaufpreis | Marktwert | Kaltmiete/Monat | Jahresmiete p.a.
Finanzen:  Bank | Restschuld | Annuität/Monat | Zinssatz (%) | Zinsbindung bis
```

