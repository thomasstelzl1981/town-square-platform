

# Zuhause-Modul: Datenbereinigung und Routing-Fix

## Analyse-Ergebnis

Im Zuhause-Modul erscheinen **zwei Personen/Homes**, weil es zwei verschiedene Quellen gibt:

### Home 1: "Villa Mustermann" (Muenchen) -- Auto-Create
- ID: `da78ca31-...` (KEINE Demo-ID)
- Erzeugt durch den **Auto-Create-Mechanismus** in `UebersichtTile.tsx` (Zeile 89-112): Wenn keine Homes existieren UND das Profil eine Stadt hat, wird automatisch ein Home aus den Profildaten angelegt
- Adresse: Leopoldstrasse, 80802 Muenchen (aus dem Profil von Max Mustermann)
- **Problem**: Diesem Home sind 3 Contracts mit **Demo-IDs** (`e0000000...601-603`) zugeordnet, die eigentlich zur alten Seed-Migration gehoeren

### Home 2: "Mein Zuhause" (Berlin) -- DB-Migration-Seed
- ID: `e0000000-0000-4000-a000-000000000801` (Demo-ID)
- Erzeugt durch Migration `20260217181859` als Demo-Datensatz
- Adresse: Friedrichstrasse 42, 10117 Berlin
- Hat 4 eigene Demo-Contracts (Strom, Gas, Wasser, Internet)
- **Problem**: Diese Daten stammen aus `DEMO_MIETY_HOME` in `data.ts` -- eine fiktive Berliner Adresse, die NICHT zum Demo-Mandanten "Max Mustermann, Muenchen" passt

### Die 3 Probleme

1. **Falsche Demo-Daten**: Der Berliner Datensatz hat nichts mit dem Muenchner Demo-Mandanten zu tun. Die DEMO_MIETY_HOME Definition in `data.ts` verwendet Berlin statt Muenchen.

2. **Verwaiste Contracts**: Die 3 Contracts (`e0000000...601-603`) mit Demo-IDs sind dem Auto-Create Home (Villa Mustermann) zugeordnet statt dem Demo-Home. Das entstand durch eine aeltere Migration die VOR dem Berlin-Seed lief.

3. **Demo-Toggle funktioniert nur halb**: Der Filter in Zeile 194 blendet das Berliner Home korrekt aus wenn GP-ZUHAUSE aus ist, aber die verwaisten Contracts am Muenchner Home haben Demo-IDs und werden trotzdem angezeigt.

## Fix-Plan

### 1. DB-Bereinigung: Verwaiste Daten loeschen
**SQL-Migration** die ausfuehrt:
- Loesche das Berliner Demo-Home `e0000000-0000-4000-a000-000000000801` (CASCADE loescht automatisch die 4 zugehoerigen Contracts)
- Loesche die 3 verwaisten Demo-Contracts (`e0000000...601-603`) die am Muenchner Home haengen
- Ergebnis: Nur noch "Villa Mustermann" bleibt, OHNE Demo-Contracts

### 2. Demo-Daten korrigieren: Berlin -> Muenchen
**Datei: `src/engines/demoData/data.ts`**
- `DEMO_MIETY_HOME` Adresse von "Friedrichstrasse, Berlin" auf "Leopoldstrasse, Muenchen" aendern (konsistent mit dem Profil des Demo-Mandanten)
- Contract-Provider anpassen: "Berliner Wasserbetriebe" -> "SWM" (passend zu Muenchen)

### 3. Auto-Create entschaerfen
**Datei: `src/pages/portal/miety/tiles/UebersichtTile.tsx`**
- Der Auto-Create erzeugt bei JEDEM neuen Tenant sofort ein Home wenn ein Profil mit Stadt existiert
- Problem: Nach einem Sandbox-Reset oder bei mehreren Sessions kann das zu Duplikaten fuehren
- Fix: Vor dem Auto-Create pruefen ob bereits ein Home mit gleicher Stadt+Adresse existiert (Deduplizierung)

### 4. Demo-Migration entfernen
- Die Migration `20260217181859` hat den Berliner Datensatz in die DB geschrieben
- Die Daten werden per Schritt 1 bereinigt
- Keine neue Seed-Migration noetig -- Demo-Miety-Daten werden clientseitig verwaltet (wie alle anderen Demo-Daten)

## Geaenderte/Neue Dateien

1. **SQL-Migration** (neue Migration) -- Berliner Home + verwaiste Contracts loeschen
2. `src/engines/demoData/data.ts` -- DEMO_MIETY_HOME Adresse auf Muenchen korrigieren
3. `src/pages/portal/miety/tiles/UebersichtTile.tsx` -- Auto-Create Deduplizierung

## Auswirkungen

- Nach der Migration existiert nur noch 1 Home (Villa Mustermann, Muenchen) ohne Demo-Vertraege
- Der Demo-Toggle GP-ZUHAUSE zeigt clientseitige Demo-Daten korrekt an/aus
- Kein Berliner Phantom-Datensatz mehr sichtbar

