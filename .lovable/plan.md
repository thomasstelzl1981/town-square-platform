

# Briefgenerator — Umbau auf Inline-Flow (oben nach unten)

## Ist-Zustand

Aktuell: 2-Spalten-Layout (`col-span-7` Formular links, `col-span-5` Vorschau/Aktionen rechts). Auf Mobile nicht nutzbar, auf Desktop unuebersichtlich wegen paralleler Informationen.

## Soll-Zustand: Linearer Top-to-Bottom Flow

```text
+----------------------------------------------------------+
|  ModulePageHeader: Briefgenerator                        |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 0: Absender                                     |
|  [ Privat ]  [ Firma A ]  [ Firma B ]  [+]              |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 1: Empfaenger                                   |
|  [ Kontakt suchen...                          v ]        |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 2: Betreff                                      |
|  [ z.B. Mieterhoehung zum 01.04.2026           ]         |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 3: Anliegen beschreiben                         |
|  +------------------------------------------------+     |
|  |                                            [Mic]|     |
|  |                                                 |     |
|  +------------------------------------------------+     |
|                                                          |
|  [====== Brief generieren (Sparkles) ======]             |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 4: Brief bearbeiten                             |
|  +------------------------------------------------+     |
|  | Generierter Text (editierbar, mono)             |     |
|  |                                                 |     |
|  +------------------------------------------------+     |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  SCHRITT 5: Vorschau & Versand                           |
|  +---------------------------+  Schriftart: [DIN v]      |
|  | +---------------------+  |                            |
|  | | DIN A4 Briefvorschau|  |  Versandkanal:             |
|  | |                     |  |  (o) E-Mail  ( ) Fax       |
|  | |                     |  |  ( ) SimpleBrief            |
|  | +---------------------+  |                            |
|  +---------------------------+  [PDF Vorschau] [Download] |
|                                 [Speichern]  [Senden]     |
+----------------------------------------------------------+
|                                                          |
|  Letzte Entwuerfe (kompakt, collapsible)                 |
|  - Mieterhoehung Mueller    Gesendet  07.02.2026         |
|  - Kuendigung Schmidt       Entwurf   05.02.2026         |
|                                                          |
+----------------------------------------------------------+
```

## Aenderungen

### Datei: `src/pages/portal/office/BriefTab.tsx`

1. **Grid entfernen**: Das `grid grid-cols-12` Layout wird durch ein einzelnes `space-y-6 max-w-3xl mx-auto` ersetzt.

2. **Lineare Abfolge**: Alle Schritte (0-4) und die Vorschau/Aktionen-Karten fliessen nacheinander vertikal.

3. **Schritt 5 zusammenfassen**: Briefvorschau + Versandkanal + PDF-Buttons + Senden werden in einer gemeinsamen Card zusammengefasst. Innerhalb dieser Card wird auf Desktop ein 2-Spalten-Mini-Layout verwendet (Vorschau links, Aktionen rechts), auf Mobile einfach untereinander.

4. **Letzte Entwuerfe ans Ende**: Die Entwuerfe-Card rutscht ganz nach unten, optional als Collapsible.

5. **Responsive**: Auf Mobile wird alles automatisch `w-full` und einspaltig — kein Sonderlayout noetig.

### Keine weiteren Dateien betroffen

Die gesamte Logik (State, Mutations, PDF-Generierung, Versand) bleibt identisch. Nur das JSX-Layout in der `return`-Anweisung wird umstrukturiert.

