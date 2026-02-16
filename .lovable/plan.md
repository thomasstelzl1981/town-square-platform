
# Mobile UX Tiefenanalyse und Optimierung

## Ist-Zustand: Was ist auf Mobile NICHT sichtbar?

Die `MOBILE_HIDDEN_MODULES` Liste in `mobileConfig.ts` filtert 8 Module aus der **Area-Uebersicht** heraus. Nutzer sehen diese Module nicht in den Area-Karten und koennen sie nur ueber direkte URLs oder Armstrong erreichen:

```text
VERSTECKT (Area-Karten nicht sichtbar):
+--------------------------------------------+----------------------------+
| Modul                                      | Grund / Bewertung          |
+============================================+============================+
| MOD-02  KI Office                          | FALSCH versteckt           |
|   Brief, WhatsApp, Videocalls sind         | Hat bereits MobileGuard    |
|   mobil-faehig (OfficePage.tsx)             | fuer Desktop-only Tabs     |
+--------------------------------------------+----------------------------+
| MOD-05  Pets                               | FALSCH versteckt           |
|   Einfache Karten-UI                       | Kein Grund fuer Ausschluss |
+--------------------------------------------+----------------------------+
| MOD-17  Fahrzeuge                           | FALSCH versteckt           |
|   Identisch mit MOD-19 (PV), das sichtbar  | Kein Grund fuer Ausschluss |
|   ist                                      |                            |
+--------------------------------------------+----------------------------+
| MOD-09  Immomanager                        | OK — Partner-only          |
| MOD-10  Lead Manager                       | OK — Partner-only          |
| MOD-11  Finanzierungsmanager               | OK — Partner-only          |
| MOD-12  Akquisemanager                     | OK — Partner-only          |
| MOD-14  Communication Pro                  | OK — Partner-only          |
+--------------------------------------------+----------------------------+
```

**Kernproblem:** MOD-02 (KI Office), MOD-05 (Pets) und MOD-17 (Fahrzeuge) sind faelschlicherweise komplett versteckt, obwohl sie mobile-taugliche UIs haben. MOD-02 hat sogar eine eingebaute `MobileGuard` die Desktop-only Tabs (E-Mail, Kontakte, Kalender) bereits filtert und auf Brief umleitet.

Die 5 Partner/Manager-Module (MOD-09, 10, 11, 12, 14) sind sinnvoll versteckt, da sie rollengebunden und komplex sind.

---

## Design-Probleme am MobileBottomBar

Die aktuelle Bottom-Bar hat folgende UX-Probleme:

1. **Area-Buttons sind keine runden Buttons** — Sie sind als eckige `rounded-xl` Pills gestaltet, nicht als die gewuenschten runden Buttons
2. **Zu wenig Abstand** zwischen Area-Buttons und Eingabezeile (nur `pb-1` = 4px)
3. **Eingabezeile sitzt zu hoch** — `pb-2` (8px) reicht nicht, die Bar braucht mehr Luft nach unten
4. **Kein Home-Button** in der Bottom-Bar — der Nutzer muss die SystemBar benutzen, um zurueck zum Chat zu kommen
5. **Area-Buttons haben kein aktives Highlight** das deutlich genug ist (nur Farbaenderung, kein Hintergrund)

---

## Massnahmenplan

### 1. Module freischalten (mobileConfig.ts)

MOD-02, MOD-05 und MOD-17 aus der `MOBILE_HIDDEN_MODULES` Liste entfernen. Neue granulare Liste `MOBILE_HIDDEN_TILES` einfuehren, um innerhalb von MOD-02 die Desktop-only Tabs aus den SubTabs zu filtern.

```text
MOBILE_HIDDEN_MODULES (NEU — nur 5 statt 8):
  - MOD-09  Immomanager (Partner-only)
  - MOD-10  Lead Manager (Partner-only)
  - MOD-11  Finanzierungsmanager (Partner-only)
  - MOD-12  Akquisemanager (Partner-only)
  - MOD-14  Communication Pro (Partner-only)

MOBILE_HIDDEN_TILES (NEU):
  - office/email      (Desktop-only — komplexe Mailbox)
  - office/kontakte   (Desktop-only — Kontaktverwaltung)
  - office/kalender   (Desktop-only — Kalender-UI)
```

### 2. SubTabs-Filterung fuer Mobile (SubTabs.tsx)

Die `SubTabs` Komponente wird um `MOBILE_HIDDEN_TILES` Filterung erweitert, sodass auf Mobile nur die erlaubten Kacheln (Brief, Widgets, WhatsApp, Videocalls) angezeigt werden.

### 3. MobileBottomBar Redesign

```text
VORHER (aktuell):
+----------------------------------------------+
| [Base]  [Client]  [Manager]  [Service]       |  <-- eckige Pills, kein Home
| [Mic] [+] [Nachricht eingeben...] [Send]     |  <-- zu nah, zu hoch
+----------------------------------------------+

NACHHER (Redesign):
+----------------------------------------------+
|                                              |
|  (Home)  (Base)  (Client)  (Manager) (Serv)  |  <-- 5 RUNDE Buttons mit Icons
|                                              |  <-- 12px Abstand
|  [Mic] [+] [Nachricht eingeben...]    [Send] |  <-- mehr Padding unten
|                                              |
+----------------------------------------------+
```

Konkrete Aenderungen:

- **Home-Button hinzufuegen**: Runder Button mit Home-Icon als erstes Element, navigiert zu `/portal` (Armstrong Chat)
- **Runde Buttons**: Von `rounded-xl` auf `rounded-full` (h-12 w-12) wechseln, Icons zentriert, Label darunter
- **Mehr Abstand**: Area-Buttons `pb-3` statt `pb-1`, Input-Bar `pb-4` statt `pb-2`
- **Aktiver Zustand**: Aktiver Button bekommt `bg-primary/15 ring-1 ring-primary/30` statt nur Farbwechsel
- **Home aktiv auf Dashboard**: Wenn `location.pathname === '/portal'`, wird Home hervorgehoben

### 4. SystemBar Mobile Optimierung

- Armstrong-Button im SystemBar entfernen (redundant, Chat ist die Home-Ansicht)
- Profil-Dropdown beibehalten
- Home/Theme-Buttons beibehalten

---

## Technische Umsetzung — Dateien

### Datei 1: `src/config/mobileConfig.ts`
- MOD-02, MOD-05, MOD-17 aus `MOBILE_HIDDEN_MODULES` entfernen
- `MOBILE_HIDDEN_TILES` Map hinzufuegen: `{ 'office': ['email', 'kontakte', 'kalender'] }`
- Hilfsfunktion `isTileHiddenOnMobile(moduleBase: string, tilePath: string): boolean`

### Datei 2: `src/components/portal/SubTabs.tsx`
- Import von `isTileHiddenOnMobile`
- Tiles auf Mobile filtern: `module.tiles.filter(t => !isMobile || !isTileHiddenOnMobile(moduleBase, t.path))`

### Datei 3: `src/components/portal/MobileBottomBar.tsx`
- Home-Button als 5. Element in die Area-Leiste einfuegen (Position 0, vor den 4 Areas)
- Buttons von `rounded-xl` auf `rounded-full` (h-11 w-11) aendern
- Abstand zwischen Buttons und Input erhoehen (`pb-3` und `pb-4`)
- Aktiver Zustand mit Hintergrund-Highlight
- Dashboard-Erkennung fuer Home-Button aktiv-Zustand

### Datei 4: `src/components/portal/PortalLayout.tsx`
- Keine Aenderungen noetig — SubTabs werden bereits im mobilen Layout gerendert

---

## Ergebnis

- **Volle Funktionalitaet**: Alle 16 Nutzer-Module sind mobil erreichbar (nur 5 Partner-Module bleiben versteckt)
- **Sinnvolle Einschraenkungen**: Desktop-only Tabs (E-Mail, Kontakte, Kalender) werden per SubTab-Filterung und MobileGuard abgefangen
- **App-Feeling**: Runde Buttons, Home-Taste, mehr Luft im Bottom-Bereich, klarer aktiver Zustand
- **Keine Kollision**: Stammdaten, Profil-Sync und Demo-Daten-Engine bleiben vollstaendig unberuehrt
