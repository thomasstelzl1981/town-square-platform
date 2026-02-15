

# Zone 1 System-Bereinigung: Duplikate entfernen + Credit-Monitoring sichtbar machen

## Analyse-Ergebnis

### Problem 1: Doppelte Menuepunkte (Projekte, Listings, Landing Pages)

Die Sub-Routen `projekt-desk/projekte`, `projekt-desk/listings`, `projekt-desk/landing-pages` erscheinen faelschlicherweise in der "System"-Gruppe. Ursache: `shouldShowInNav()` filtert Sub-Routen fuer `sales-desk/`, `finance-desk/`, `acquiary/` und `futureroom/` — aber **nicht** fuer `projekt-desk/`. Die Sub-Routen fallen in den Default-Case und landen in "System".

**Fix:** Eine Zeile in `shouldShowInNav()` hinzufuegen:

```text
path.startsWith('projekt-desk/')  // NEU — filtert Sub-Routen
```

### Problem 2: Credit-Monitoring fehlt in der Sidebar

Die Seiten existieren bereits:
- `armstrong/billing` (ArmstrongBilling) — Technische Verbrauchserfassung pro KI-Aktion
- `armstrong/costs` (PlatformCostMonitor) — Plattform-Kostenmonitor

Beide sind aktuell als `armstrong/`-Sub-Routen klassifiziert und werden durch die Regel `if (path.startsWith('armstrong/')) return false` aus der Navigation ausgeblendet. Sie sind nur ueber das Armstrong-Dashboard intern erreichbar.

**Fix:** Eine Ausnahme fuer `armstrong/billing` und `armstrong/costs` in `shouldShowInNav()` hinzufuegen, damit sie als eigenstaendige Menuepunkte in der "Armstrong"-Gruppe der Sidebar erscheinen.

### Klarstellung: Kein Mieteingangs-Monitoring in Zone 1

Mieteingangs-Daten (`rent_payments`) sind private Mieterdaten und bleiben ausschliesslich in Zone 2 (MOD-04 Immobilien, GeldeingangTab). Es wird **keine** Zahlungsmonitoring-Seite in Zone 1 erstellt. Der im vorherigen Plan erwaehnte "Zahlungsmonitoring"-Punkt wird gestrichen.

## Technische Umsetzung

### Datei: `src/components/admin/AdminSidebar.tsx`

**Aenderung 1 — Zeilen 184-191:** `projekt-desk/` zu den gefilterten Desk-Sub-Routen hinzufuegen:

```text
if (path.includes('/') && (
  path.startsWith('sales-desk/') ||
  path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') ||
  path.startsWith('projekt-desk/')     // NEU
)) {
  return false;
}
```

**Aenderung 2 — Zeilen 177-183:** Armstrong-Sub-Routen-Filter erweitern, damit Billing und Costs sichtbar werden:

```text
if (path === 'armstrong') {
  return true;
}
if (path === 'armstrong/billing' || path === 'armstrong/costs') {
  return true;  // Credit-Monitoring in Sidebar sichtbar
}
if (path.startsWith('armstrong/')) {
  return false;
}
```

### Keine weiteren Dateien betroffen

- Keine neue Seite noetig (ArmstrongBilling und PlatformCostMonitor existieren bereits)
- Keine Route-Aenderung noetig (Routes sind im Manifest bereits definiert)
- Icon-Mapping fuer `ArmstrongBilling` (`CreditCard`) und `PlatformCostMonitor` existiert bereits

### Ergebnis nach Bereinigung

**System-Gruppe (vorher):**
- Integrationen, Oversight, Audit Hub, Fortbildung
- Projekte (FALSCH), Listings (FALSCH), Landing Pages (FALSCH)

**System-Gruppe (nachher):**
- Integrationen, Oversight, Audit Hub, Fortbildung

**Armstrong-Gruppe (nachher — neu sichtbar):**
- Armstrong (Dashboard)
- Billing (Credit-Verbrauch pro Aktion)
- Plattform-Kostenmonitor (Gesamtkosten-Uebersicht)

| Datei | Aktion | Beschreibung |
|-------|--------|-------------|
| `src/components/admin/AdminSidebar.tsx` | EDIT | `shouldShowInNav`: projekt-desk/ filtern + armstrong/billing und armstrong/costs sichtbar machen |
