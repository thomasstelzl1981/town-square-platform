
# Datenbank-Seite: CI-konforme Breiten und Layout-Korrektur

## Problem

Die `AkquiseDatenbank.tsx` (Zone 2) und `AcquiaryDatenbank.tsx` (Zone 1) nutzen keine `PageShell` und keinen `ModulePageHeader`. Dadurch fehlt die CI-konforme maximale Breite (`max-w-7xl`), das einheitliche Padding (`px-2 py-3 md:p-6`) und der Standard-Seitenheader. Die Seiten rendern als rohes `<div>` ohne Layout-Constraints.

## Loesung

Beide Datenbank-Seiten werden in die Standard-Shell-Komponenten eingebettet, wie es alle anderen Modul-Seiten (z.B. AkquiseMandate, ObjekteingangList) tun.

## Aenderungen

### 1. `src/pages/portal/akquise-manager/AkquiseDatenbank.tsx` (Zone 2)

- Aeusseres `<div>` durch `<PageShell>` ersetzen
- `<h1>` + `<p>` Header durch `<ModulePageHeader title="DATENBANK" description="..." />` ersetzen
- Imports fuer `PageShell` und `ModulePageHeader` ergaenzen

### 2. `src/pages/admin/acquiary/AcquiaryDatenbank.tsx` (Zone 1)

- Gleiches Muster: `<PageShell>` + `<ModulePageHeader>` einsetzen
- Da Zone 1 innerhalb eines Tab-Panels rendert, wird hier ggf. nur `ModulePageHeader` ohne PageShell verwendet (je nachdem ob der Tab-Container bereits ein Layout vorgibt). Falls noetig wird PageShell mit angepasstem Styling genutzt.

### 3. `src/components/akquise/ObjectSearchPanel.tsx`

- Keine Aenderungen noetig — die Breite wird durch den uebergeordneten PageShell-Container korrekt begrenzt.

## Ergebnis

- Einheitliche maximale Breite (`max-w-7xl` = 1280px)
- Konsistentes Padding und Spacing
- Standard-Header mit Titel und Beschreibung
- CI-konform mit allen anderen Modul-Seiten
