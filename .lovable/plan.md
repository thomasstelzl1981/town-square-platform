

# Plan: Split-View Toggle in FMFinanzierungsakte einbauen

## Problem

Der Split-View-Toggle (Standard / Split-View) wurde nur in `FMFallDetail.tsx` implementiert (fuer bestehende Faelle). Die `FMFinanzierungsakte.tsx` (Neuanlage) hat diesen Toggle nicht, weshalb die Ansichtsumschaltung dort fehlt.

Die Multi-Asset Kaufy-Suche mit 3-Zeilen-Design ist bereits korrekt implementiert (Zeilen 236-304), aber wegen der Zugriffsblockade ("Kein Zugriff") nicht sichtbar fuer den Test-User.

## Loesung

Den Split-View-Toggle aus `FMFallDetail.tsx` analog in `FMFinanzierungsakte.tsx` einbauen:

### Aenderungen in `FMFinanzierungsakte.tsx`

1. **Neuer State**: `splitView` (boolean, default: false)
2. **Toggle-Buttons** im Header-Bereich (Zeile 202-210), rechts neben dem Titel:
   - "Standard" (LayoutList-Icon)
   - "Split-View" (LayoutPanelLeft-Icon)
   - Nur sichtbar ab `lg`-Breakpoint (analog FMFallDetail)
3. **Layout-Umschaltung**:
   - **Standard** (aktuell): Alle Bloecke vertikal gestapelt
   - **Split-View**: Zwei separat scrollbare Spalten:
     - **Links**: Magic Intake, Kaufy-Suche, Eckdaten, Kalkulator, Objekt, Kapitaldienstfaehigkeit
     - **Rechts**: Selbstauskunft (Person, Einkommen, Ausgaben, Vermoegen)

### Technische Umsetzung

```text
Header-Zeile: [<- Zurueck]  NEUE FINANZIERUNGSAKTE  [Standard | Split-View]
                                                      ^--- Neuer Toggle

Standard-Ansicht:     Split-View-Ansicht:
+------------------+  +--------+  +--------+
| Magic + Kaufy    |  | Magic  |  | Selbst |
+------------------+  | Kaufy  |  | aus-   |
| Eckdaten + Kalk  |  | Eckdat |  | kunft  |
+------------------+  | Kalk   |  | (scroll|
| Selbstauskunft   |  | Objekt |  |  bar)  |
+------------------+  | KDF    |  |        |
| Objekt           |  |        |  |        |
+------------------+  +--------+  +--------+
| KDF              |   (scrollbar)
+------------------+
```

### Dateien

- **`src/pages/portal/finanzierungsmanager/FMFinanzierungsakte.tsx`**:
  - Import `LayoutList`, `LayoutPanelLeft` von lucide-react
  - State `splitView` hinzufuegen
  - Toggle-Buttons in Header einfuegen
  - Bedingtes Layout: `splitView ? <SplitLayout /> : <StandardLayout />`
  - Split-Layout mit `overflow-y-auto` fuer beide Spalten und `height: calc(100vh - 220px)`

Keine weiteren Dateien betroffen. Keine Datenbank-Aenderungen.
