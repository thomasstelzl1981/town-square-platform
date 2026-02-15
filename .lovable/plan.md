

# Klare Zone-Trennung im Armstrong AktionsKatalog

## Analyse: Aktuelle Verteilung

Das Manifest definiert 3 Zonen-Zuordnungen:

| Zuordnung | Anzahl | Beispiele |
|-----------|--------|-----------|
| Nur Z2 (Portal) | ca. 275 Actions | Immobilie anlegen, Brief senden, DMS |
| Nur Z3 (Website) | ca. 10 Actions | Kontaktanfrage, Newsletter |
| Z2 + Z3 (beide) | ca. 50 Actions | Rendite berechnen, FAQ, Coach-Actions |

**Das Problem**: Der aktuelle Zone-Filter nutzt `includes()` -- bei Auswahl "Z2" erscheinen auch alle Actions mit `['Z2', 'Z3']`, ohne dass erkennbar ist, ob eine Action exklusiv fuer das Portal gilt oder auch auf den Websites laeuft.

## Loesung: Dreistufiger Zone-Filter mit visueller Kennzeichnung

### 1. Filter-Optionen erweitern

Statt nur "Alle / Z2 / Z3" wird der Filter auf 4 Optionen erweitert:

```text
Alle Zonen | Nur Portal (Z2) | Nur Website (Z3) | Portal + Website
```

- **Nur Portal (Z2)**: Zeigt Actions, die EXKLUSIV in Zone 2 laufen
- **Nur Website (Z3)**: Zeigt Actions, die EXKLUSIV in Zone 3 laufen
- **Portal + Website**: Zeigt Actions, die in BEIDEN Zonen verfuegbar sind

### 2. Visuelle Kennzeichnung auf den Karten

Jede Action-Card erhaelt ein farbcodiertes Zone-Badge:

- **Portal-exklusiv**: Blaues Badge "Portal"
- **Website-exklusiv**: Gruenes Badge "Website"  
- **Beide Zonen**: Zweifarbiges Badge-Paar "Portal" + "Website"

### 3. KPI-Leiste um Zone-Verteilung ergaenzen

Die bestehende KPI-Leiste (Gesamt / Aktiv / Eingeschraenkt / Deaktiviert) wird um eine Zeile mit Zone-Verteilung ergaenzt, damit sofort sichtbar ist, wie viele Actions pro Zone existieren.

## Technische Umsetzung

### Datei: `AktionsKatalog.tsx`

**Filter-Logik aendern** (Zeile 40):

Aktuell:
```text
const matchesZone = zoneFilter === 'all' || action.zones.includes(zoneFilter);
```

Neu:
```text
const matchesZone = 
  zoneFilter === 'all' ||
  (zoneFilter === 'Z2_only' && action.zones.length === 1 && action.zones[0] === 'Z2') ||
  (zoneFilter === 'Z3_only' && action.zones.length === 1 && action.zones[0] === 'Z3') ||
  (zoneFilter === 'Z2_Z3' && action.zones.includes('Z2') && action.zones.includes('Z3'));
```

**Filter-Dropdown erweitern** (Zeile 96-99):

```text
<SelectItem value="all">Alle Zonen</SelectItem>
<SelectItem value="Z2_only">Nur Portal (Z2)</SelectItem>
<SelectItem value="Z3_only">Nur Website (Z3)</SelectItem>
<SelectItem value="Z2_Z3">Portal + Website</SelectItem>
```

**Zone-Badges farblich differenzieren** (Zeile 147-151):

Portal-Badges erhalten eine blaue Akzentfarbe, Website-Badges eine gruene -- so ist die Zugehoerigkeit auf den ersten Blick erkennbar.

### Keine weiteren Dateien betroffen

- Kein SQL noetig
- Keine Aenderung am Manifest oder Hook
- Nur UI-Logik in einer Datei

## Ergebnis

- Klare Trennung: User sieht sofort, welche Actions nur im Portal, nur auf Websites oder in beiden Zonen laufen
- Governance-Transparenz: Admins koennen gezielt pruefen, welche Faehigkeiten auf oeffentlichen Websites (Z3) aktiv sind
- Farbcodierung macht die Zuordnung auch ohne Filter visuell erkennbar
