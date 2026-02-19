
# Fix: Chunk-Ladefehler (Problem 1)

## Problem

Nach jeder Code-Aenderung erzeugt Vite neue JS-Dateien mit neuen Hash-Namen. Der Browser oder Service Worker versucht aber noch die alten URLs zu laden (z.B. `AreaOverviewPage-CPdAq382.js`), die nicht mehr existieren. Ergebnis: "Failed to fetch dynamically imported module" -- Navigation blockiert.

## Datenstatus Max Mustermann (zur Info, wird jetzt NICHT geaendert)

| Daten | Status |
|-------|--------|
| Kontakt Max Mustermann | Vorhanden |
| 3 Mietvertraege (leases) | Vorhanden |
| Mietzahlungen (rent_payments) | Vorhanden (10+ Eintraege) |
| Bankkonten (msv_bank_accounts) | GELOESCHT -- 0 Eintraege |
| Banktransaktionen (bank_transactions) | GELOESCHT -- 0 Eintraege |
| Bank-Metadaten (bank_account_meta) | GELOESCHT -- 0 Eintraege |

Die Bankkonten und CSV-Transaktionsdaten wurden beim versehentlichen Loeschen von Max Mustermann mit entfernt und nicht wiederhergestellt. Vertraege und Mietzahlungen sind intakt. Die Wiederherstellung dieser Daten erfolgt in einem separaten Schritt, sobald du das freigibst.

## Loesung: Auto-Reload bei Chunk-Fehler

**Datei: `src/components/ErrorBoundary.tsx`**

In der `componentDidCatch`-Methode wird geprueft, ob der Fehler ein Chunk-Ladefehler ist. Wenn ja, wird automatisch die Seite neu geladen -- aber nur einmal, um Endlosschleifen zu vermeiden.

### Ablauf

```text
Nutzer klickt auf Menuepunkt
  -> Browser versucht alten JS-Chunk zu laden
  -> Fehler: "Failed to fetch dynamically imported module"
  -> ErrorBoundary faengt den Fehler
  -> Erkennt Chunk-Fehler am Text im error.message
  -> Prueft sessionStorage-Flag "chunk-reload-attempted"
  -> Flag nicht gesetzt? -> Setzt Flag + window.location.reload()
  -> Browser laedt neue index.html mit korrekten Chunk-URLs
  -> Seite funktioniert normal
  -> Flag wird beim naechsten erfolgreichen Render zurueckgesetzt
```

### Konkrete Aenderung

Die `componentDidCatch`-Methode (Zeile 38-42) wird erweitert:

```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Chunk-Ladefehler erkennen und automatisch neu laden
  const isChunkError =
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Loading chunk') ||
    error.message.includes('Loading CSS chunk');

  if (isChunkError) {
    const alreadyReloaded = sessionStorage.getItem('chunk-reload-attempted');
    if (!alreadyReloaded) {
      sessionStorage.setItem('chunk-reload-attempted', 'true');
      window.location.reload();
      return;
    }
    // Wenn bereits neu geladen wurde, normalen Fehler anzeigen
    sessionStorage.removeItem('chunk-reload-attempted');
  }

  this.setState({ errorInfo });
  console.error('ErrorBoundary caught error:', error, errorInfo);
}
```

Zusaetzlich wird das sessionStorage-Flag bei erfolgreicher Navigation zurueckgesetzt, indem in der `render()`-Methode bei `hasError === false` das Flag entfernt wird:

```typescript
render() {
  if (this.state.hasError) {
    // ... Fehler-UI ...
  }

  // Erfolgreicher Render: Chunk-Reload-Flag zuruecksetzen
  sessionStorage.removeItem('chunk-reload-attempted');
  return this.props.children;
}
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/ErrorBoundary.tsx` | Chunk-Fehler-Erkennung + Auto-Reload in componentDidCatch, Flag-Reset in render |

## Was NICHT geaendert wird

- Keine neuen Daten werden angelegt
- Keine Bankkonten oder Transaktionen werden eingefuegt
- Keine anderen Dateien werden veraendert
