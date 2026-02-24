
Ziel ist klar: Du willst in Zone 1 **sofort sichtbare, arbeitsfähige Oberflächen** (ohne versteckte Bereiche), mit **festen Spalten**, **festen Eingaben** und **Filterbarkeit** – für beide Bereiche: Recherche und Kontaktbuch.

## Was ich geprüft habe (Ist-Zustand)

1. Route `/admin/ki-office/kontakte` zeigt tatsächlich `AdminKontaktbuch.tsx` (nicht die alte `AdminKiOfficeKontakte.tsx`).
2. Route `ki-office/recherche` zeigt `AdminRecherche.tsx`.
3. In `AdminRecherche.tsx` wird bei neuen Aufträgen der Titel explizit so erzeugt:
   - `title: "${deskLabel} — Neue Recherche"`  
   Daher siehst du dieses Muster immer wieder.
4. In `AdminKontaktbuch.tsx` sind aktuell nur wenige Spalten sichtbar (u. a. Firma, Name kombiniert, E-Mail, Ort, Kategorie, Permission).  
   Viele relevante Felder liegen im Drawer/Dialog und sind damit für den schnellen Überblick nicht direkt sichtbar.
5. Modul-Freeze-Datei ist geprüft (`spec/current/00_frozen/modules_freeze.json`): alle Module unfrozen; betroffene Dateien liegen zudem außerhalb der MOD-01..MOD-22-Pfade.

## Warum es sich für dich „nicht verändert“ anfühlt

- Recherche ist aktuell immer noch auf „Auftrag auswählen → darunter Details/Ergebnisse“ zentriert.
- Kontaktbuch zeigt nicht die volle, vereinheitlichte Spaltenstruktur sichtbar in der Haupttabelle.
- Zu viele wichtige Infos sind in Drawer/Dialog statt direkt auf der Arbeitsfläche.
- Keine klare, feste „Vorgaben-Ansicht“ als sofort sichtbare Struktur.

## Geplante Umsetzung: 2 sichtbare Skizzen als echte Arbeits-Layouts (ohne versteckte Bereiche)

Ich setze beide Seiten als **dauerhaft sichtbare Wireframe-Layouts** um (funktional, nicht nur Doku-Bild), damit Nutzer sofort sehen:
- welche Eingaben es gibt
- welche Spalten es gibt
- welche Filter es gibt

### Skizze 1: Recherche (Zone 1 Marketing-Datenbank)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ RECHERCHE-ZENTRALE (Zone 1)                                              [Neue Suche]      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Eingaben (immer sichtbar, keine Collapsible):                                                │
│ Desk | Suchbegriff | Region | Kategorie | Anrede | Vorname | Nachname | Firma | Zielanzahl │
│ [Starten] [Zurücksetzen]                                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Laufende Recherchen (immer sichtbar):                                                        │
│ Auftrag | Desk | Phase | Fortschritt | Kontakte | E-Mails | Status | Letztes Update        │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Filterleiste Ergebnisse (immer sichtbar):                                                    │
│ Freitext | Kategorie | Status | Stadt | Mit E-Mail ja/nein | Duplikate ja/nein             │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Ergebnistabelle (immer sichtbar, horizontal scrollbar falls nötig):                          │
│ □ | Anrede | Vorname | Nachname | Firma | Kategorie | Position | E-Mail | Telefon |        │
│ PLZ | Stadt | Website | Quelle | Confidence | Status | Aktionen                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Skizze 2: Kontaktbuch (Hauptstruktur / Master-Schema)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ KONTAKTBUCH (Zone 1, Master)                                           [Neuer Kontakt]      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Filterleiste (immer sichtbar):                                                               │
│ Freitext | Kategorie | Permission | Stadt | Mit E-Mail | Gesperrt ja/nein                  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Haupttabelle (immer sichtbar):                                                               │
│ ID | Anrede | Vorname | Nachname | Firma | Kategorie | E-Mail | Mobil | Telefon |          │
│ Straße | PLZ | Ort | Permission | Rechtsgrundlage | DNC | Letzter Kontakt | Aktionen       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Inline-Details unter Tabelle (statt Drawer-only):                                            │
│ ausgewählter Kontakt + bearbeitbare Felder direkt im Seitenfluss                            │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Konkrete Implementierungsschritte

### 1) Recherche-Seite auf „immer sichtbar“ umbauen
**Datei:** `src/pages/admin/ki-office/AdminRecherche.tsx`

- Entfernen der UX-Abhängigkeit „nur bei selectedOrder alles zeigen“.
- Eingabe-Bereich dauerhaft sichtbar (oben).
- Auftrags-/Progress-Tabelle dauerhaft sichtbar (unter Eingaben).
- Ergebnisse als dauerhaft sichtbare Tabelle mit fester Spaltenreihenfolge.
- Filterleiste über der Ergebnistabelle ergänzen (mind. Freitext, Kategorie, Status, Stadt, E-Mail vorhanden).
- Label-/Textkorrektur: keine wiederkehrende Benutzerführung mit „Neue Recherche“ als dominanter Titel.

### 2) „Neue Recherche“-Titelproblem beheben
**Datei:** `src/pages/admin/ki-office/AdminRecherche.tsx`

- Titel beim Erstellen nicht mehr automatisch als „… — Neue Recherche“ setzen.
- Stattdessen:
  - neutraler Arbeits-Titel (z. B. `Desk + Datum/Uhrzeit`) **oder**
  - Pflichtfeld im sichtbaren Eingabe-Block vor Start.
- Damit verschwinden künftig die irreführenden „Neue Recherche“-Titel bei neuen Aufträgen.

### 3) Kontaktbuch-Spalten auf Master-Schema erweitern und sichtbar machen
**Datei:** `src/pages/admin/ki-office/AdminKontaktbuch.tsx`

- Tabellen-Spalten von kompakt auf vollständiges Arbeitsschema erweitern:
  - `Anrede`, `Vorname`, `Nachname`, `Firma`, `Kategorie`, `E-Mail`, `Mobil`, `Telefon`, `Straße`, `PLZ`, `Ort`, `Permission`, `Rechtsgrundlage`, `DNC`, `Letzter Kontakt`.
- Name nicht mehr nur kombiniert in einer Zelle, sondern getrennte Vor-/Nachname-Spalten sichtbar.
- Filterbar machen über mehrere sichtbare Filterfelder.
- Inline-Detailbereich direkt unter Tabelle ergänzen (nicht nur Drawer), damit nichts „verschwindet“.

### 4) Einheitliche Spalten-Definition zentralisieren
**Dateien:**
- `src/pages/admin/ki-office/AdminRecherche.tsx`
- `src/pages/admin/ki-office/AdminKontaktbuch.tsx`
- optional neues Shared-Config-File (wenn sinnvoll): z. B. `src/config/contactSchema.ts`

- Ein gemeinsames Spalten-/Feldschema definieren, damit Recherche und Kontaktbuch dieselben Kernfelder führen.
- Einheitliche Labels (deutsch) und Feldkeys (technisch) fixieren.

### 5) Filterbarkeit technisch konsistent umsetzen
- Recherche: bestehender Statusfilter wird um Feldfilter erweitert.
- Kontaktbuch: bestehende Suche + Permission-Filter wird um Kategorie/Stadt/E-Mail/DNC erweitert.
- Alle Filter wirken sofort auf die sichtbare Tabelle (kein versteckter Zustand).

## Dateien mit Änderungen (geplant)

1. `src/pages/admin/ki-office/AdminRecherche.tsx`
2. `src/pages/admin/ki-office/AdminKontaktbuch.tsx`
3. optional `src/config/contactSchema.ts` (wenn wir Spalten/Felder zentralisieren)

## Ergebnis nach Umsetzung

- In beiden Bereichen sind **Skizze + Arbeitsfläche identisch sichtbar**.
- Keine zentrale Information hinter Collapsible versteckt.
- Keine „man muss raten“-Spalten mehr.
- Recherche und Kontaktbuch nutzen sichtbare, einheitliche Kontaktstruktur.
- Tabellen sind in beiden Bereichen klar filterbar.

## Abnahme-Kriterien (Definition of Done)

1. Recherche zeigt oben immer Eingaben + darunter Auftragsstatus + darunter Ergebnistabelle.
2. Kontaktbuch zeigt volle Master-Spaltenstruktur direkt in der Haupttabelle.
3. Vorname/Nachname/Anrede/Kategorie sind in beiden Bereichen sichtbar und filterbar.
4. „Neue Recherche“-Titel erscheint nicht mehr als Standardmuster für neue Aufträge.
5. Kein Pflicht-Informationsblock ist nur via Collapsible erreichbar.
