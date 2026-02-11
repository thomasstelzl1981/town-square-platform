
# Fix: Provision nur fuer verkaufte Objekte berechnen

## Problem

In `SalesStatusReportWidget.tsx` (Zeile 88) wird die Gesamtprovision ueber **alle** Einheiten summiert — unabhaengig vom Status:

```text
const totalProvision = units.reduce((s, u) => s + u.effective_provision, 0);
```

Das fuehrt dazu, dass die Provision auch fuer freie und reservierte Einheiten in den Rohertrag einfliesst und diesen kuenstlich drueckt. Korrekt waere: Nur Einheiten mit Status `sold` (und ggf. `notary`) zaehlen, da nur bei abgeschlossenen Verkaeufen Provision faellig wird.

## Aenderung

**Datei:** `src/components/projekte/SalesStatusReportWidget.tsx`, Zeile 88

Vorher:
```text
const totalProvision = units.reduce((s, u) => s + u.effective_provision, 0);
```

Nachher:
```text
const totalProvision = units
  .filter(u => u.status === 'sold' || u.status === 'notary')
  .reduce((s, u) => s + u.effective_provision, 0);
```

Das ist eine einzelne Zeile. Der `grossProfit` (Zeile 89) wird automatisch korrekt, da er auf `totalProvision` basiert. Die KPI-Anzeige "Provision (kumuliert)" zeigt dann nur die tatsaechlich angefallene Provision.
