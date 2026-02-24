

# Pet Desk Sidebar-Duplikate entfernen

## Problem

Die Sidebar-Funktion `shouldShowInNav` in `src/components/admin/AdminSidebar.tsx` hat zwei Fehler beim Pet Desk:

1. **Fehlender Sub-Routen-Filter**: Die Zeilen 200-209 filtern Sub-Routen fuer `sales-desk/`, `finance-desk/`, `acquiary/`, `projekt-desk/`, `petmanager/` — aber **nicht** `pet-desk/`. Da die Routen im Manifest als `pet-desk/vorgaenge`, `pet-desk/kunden`, `pet-desk/shop`, `pet-desk/billing` definiert sind, erscheinen sie alle als eigene Menue-Eintraege.

2. **Veralteter Haupteintrag**: In Zeile 183 steht `petmanager` als erlaubter Haupteintrag, aber der tatsaechliche Manifest-Pfad ist `pet-desk`. Dadurch wird der Haupteintrag "Pet Desk" nicht korrekt erkannt.

## Aenderungen

In `src/components/admin/AdminSidebar.tsx`:

### 1. Haupteintrag korrigieren (Zeile 181-183)

```text
Vorher:
  path === 'projekt-desk' || path === 'petmanager' || path === 'website-hosting'

Nachher:
  path === 'projekt-desk' || path === 'pet-desk' || path === 'website-hosting'
```

### 2. Sub-Routen-Filter ergaenzen (Zeile 200-209)

`pet-desk/` zur Liste der gefilterten Sub-Routen-Prefixe hinzufuegen:

```text
Vorher:
  path.startsWith('sales-desk/') ||
  path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') ||
  path.startsWith('projekt-desk/') ||
  path.startsWith('petmanager/')

Nachher:
  path.startsWith('sales-desk/') ||
  path.startsWith('finance-desk/') ||
  path.startsWith('acquiary/') ||
  path.startsWith('projekt-desk/') ||
  path.startsWith('pet-desk/')
```

### 3. Icon-Map bereinigen (optional)

Die alten `Petmanager*`-Eintraege in der ICON_MAP (Zeilen 90-94) koennen durch einen einzelnen `PetDeskRouter`-Eintrag ersetzt werden, da der Manifest-Komponentenname `PetDeskRouter` ist.

## Ergebnis

| Vorher (Sidebar "Operative Desks") | Nachher |
|-------------------------------------|---------|
| Sales Desk | Sales Desk |
| Lead Desk | Lead Desk |
| Projekt Desk | Projekt Desk |
| **Pet Desk** | **Pet Desk** |
| **Vorgaenge** (doppelt) | _(entfernt)_ |
| **Kunden** (doppelt) | _(entfernt)_ |
| **Shop** (doppelt) | _(entfernt)_ |
| **Billing** (doppelt) | _(entfernt)_ |
| Finance Desk | Finance Desk |

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/admin/AdminSidebar.tsx` | Zeile 183: `petmanager` zu `pet-desk`; Zeilen 200-209: `pet-desk/` zum Sub-Routen-Filter hinzufuegen |

Keine DB-Migration. Keine Modul-Freeze-Verletzung (Datei liegt in `src/components/admin/`, nicht in einem Modul-Pfad).

