

# Dashboard vs. Einreichung: Klare Datentrennung

## Problem

Aktuell zeigen Dashboard und Einreichung teilweise dieselben Faelle. Die Abgrenzung ist unklar:
- Dashboard zeigt ALLE `cases` (inkl. bereits eingereichte)
- Einreichung filtert auf `READY_STATUSES` (inkl. `ready_for_submission` UND `submitted_to_bank` UND `completed`)

## Neue Regel

| Tile | Zeigt | Filter-Logik |
|---|---|---|
| **Dashboard** "Faelle in Bearbeitung" | Faelle, die noch NICHT eingereicht sind | Status NOT IN (`submitted_to_bank`, `completed`, `rejected`, `archived`) |
| **Einreichung** | Alle Faelle, die eingereicht wurden ODER bereit zur Einreichung sind | Status IN (`ready_for_submission`, `ready_to_submit`, `submitted_to_bank`, `completed`) |

Sobald ein Fall eingereicht wird (`submitted_to_bank`), verschwindet er aus dem Dashboard und erscheint nur noch in der Einreichung mit der vollstaendigen Dokumentation (wann, bei wem, wie).

## Aenderungen

### 1. FMDashboard.tsx — Filter einbauen

Zeile 116: `cases.map(...)` wird ersetzt durch gefilterte Liste:

```typescript
const SUBMITTED_STATUSES = ['submitted_to_bank', 'completed', 'rejected', 'archived'];

const activeCases = cases.filter(c => {
  const status = getRequestStatus(c);
  return !SUBMITTED_STATUSES.includes(status);
});
```

- Sektion "Faelle in Bearbeitung" zeigt nur `activeCases`
- Header-Zaehler passt sich an: `activeCases.length` statt `cases.length`
- "Letzte Aktivitaeten"-Widget filtert ebenfalls nur auf aktive Faelle

### 2. FMEinreichung.tsx — Alle eingereichten Faelle zeigen

Die bestehende `READY_STATUSES`-Filterung bleibt korrekt. Zusaetzlich wird die Einreichungsliste um Dokumentation erweitert:

- Jede Case-Card zeigt ein kleines Badge mit dem Einreichungsstatus (z.B. "2 Banken, gesendet am 12.02.")
- Die Submission-Logs werden pro Fall in Step 4 angezeigt (bereits implementiert)

### 3. Header-Beschreibung anpassen

**Dashboard:**
```
"{n} Fälle in Bearbeitung — noch nicht eingereicht."
```

**Einreichung:**
```
"{n} Einreichungen — Dokumentation aller Bank-Einreichungen."
```

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMDashboard.tsx` | Filter auf aktive Faelle (nicht eingereicht), Header-Text anpassen |
| `FMEinreichung.tsx` | Header-Text anpassen, Badge mit Einreichungs-Info pro Case-Card |

## Keine Datenbank-Aenderungen

Reine Frontend-Filterlogik.
