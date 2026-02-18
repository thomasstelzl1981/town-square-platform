
## CI-Harmonisierung Pet Manager (MOD-22)

### Analyse: Ist-Zustand vs. CI-Standard

Die Referenz-Module (Projektmanager MOD-13, Immomanager/Vertriebspartner) folgen diesem Standard:

```text
ModulePageHeader (UPPERCASE Titel)
  |
DASHBOARD_HEADER.GRID (2-Spalten)
  |- ManagerVisitenkarte (links)
  |- MarketReportWidget (rechts)
  |
KPI_GRID (4 Spalten)
  |
Operativer Content
```

**Abweichungen im Pet Manager:**

| Seite | Problem | Soll |
|-------|---------|------|
| **PMDashboard** | Keine `ModulePageHeader`, keine `ManagerVisitenkarte` — stattdessen eigene Card mit Provider-Daten + Bio (gehoert ins Profil) | `ModulePageHeader` + `ManagerVisitenkarte` (Ansprechpartner: Name/Adresse/Telefon/E-Mail) + MarketReportWidget oder Kapazitaets-Widget rechts |
| **PMProfil** | Header ist eigener `div` statt `ModulePageHeader` | `ModulePageHeader` mit Titel "Profil" und Aktions-Buttons |
| **PMPension** | Nutzt `ModulePageHeader` korrekt | OK |
| **PMServices** | Nutzt `ModulePageHeader` korrekt | OK |
| **PMPersonal** | Nutzt `ModulePageHeader` korrekt | OK |
| **PMKalender** | Kein `ModulePageHeader` — eigener div-Header | `ModulePageHeader` verwenden |
| **PMLeistungen** | Eigener div-Header mit Icon + h1 statt `ModulePageHeader` | `ModulePageHeader` verwenden |
| **PMKunden** | Eigener div-Header mit Icon + h1 statt `ModulePageHeader` | `ModulePageHeader` verwenden |
| **PMFinanzen** | Eigener div-Header mit Icon + h1 statt `ModulePageHeader` | `ModulePageHeader` verwenden |

### Kernproblem: Visitenkarte

Die aktuelle Dashboard-Card zeigt `company_name`, `bio`, `address`, `phone`, `email` und einen Website-Link — das ist Profil-Content, kein Visitenkarten-Content. Die `ManagerVisitenkarte` zeigt stattdessen die **persoenlichen Daten des Managers** aus `useAuth().profile`:

- Name (Vor-/Nachname)
- E-Mail, Telefon, Adresse
- Rolle: "Pet Manager"
- Badge: z.B. "Tierpension" (facility_type)
- Extra-Badge: Status ("Aktiv")

Das Provider-Profil (Firmenname, Bio etc.) gehoert ausschliesslich auf die Profil-Seite.

### Umsetzungsplan

**1. PMDashboard.tsx — Komplett-Refactor Header**

- `ModulePageHeader` mit Titel "PET MANAGER" einfuegen
- `ManagerVisitenkarte` mit Teal-Gradient (Modul-Farbe Pet Manager) einfuegen
- Kapazitaets-Widget rechts im `DASHBOARD_HEADER.GRID` beibehalten
- Provider-Bio und Website-Link entfernen (leben jetzt auf PMProfil)
- KPI-Grid bleibt wie es ist
- Naechste-Termine-Card bleibt wie sie ist

Gradient-Farben (Teal, wie im Manifest definiert):
- `gradientFrom: "hsl(170,60%,40%)"`
- `gradientTo: "hsl(180,55%,35%)"`

**2. PMProfil.tsx — ModulePageHeader einfuegen**

- Aktuellen eigenen Header-div ersetzen durch `ModulePageHeader`
- Titel: "Profil"
- Description: "Dein oeffentliches Profil auf der Lennox & Friends Website"
- Actions: Publish-Toggle + Vorschau-Button + Speichern-Button

**3. PMKalender.tsx — ModulePageHeader einfuegen**

- Aktuellen eigenen Header ersetzen durch `ModulePageHeader`
- Titel: "Kalender"
- Description aus bestehendem Untertitel

**4. PMLeistungen.tsx — ModulePageHeader einfuegen**

- Eigenen div-Header (Icon + h1) ersetzen durch `ModulePageHeader`
- Titel: "Leistungen"
- Description: "Deine Services und Verfuegbarkeit"
- Actions: Neuer-Service-Button

**5. PMKunden.tsx — ModulePageHeader einfuegen**

- Eigenen div-Header (Icon + h1) ersetzen durch `ModulePageHeader`
- Titel: "Kunden"
- Description: "Deine Kunden und ihre Tiere"
- Actions: Erstellen-Button (round glass)

**6. PMFinanzen.tsx — ModulePageHeader einfuegen**

- Eigenen div-Header (Icon + h1) ersetzen durch `ModulePageHeader`
- Titel: "Finanzen"
- Description: "Zahlungen und Rechnungen"
- Actions: Neue-Rechnung-Button

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| `PMDashboard.tsx` | EDIT — ManagerVisitenkarte + ModulePageHeader, Provider-Bio entfernen |
| `PMProfil.tsx` | EDIT — Header durch ModulePageHeader ersetzen |
| `PMKalender.tsx` | EDIT — Header durch ModulePageHeader ersetzen |
| `PMLeistungen.tsx` | EDIT — Header durch ModulePageHeader ersetzen |
| `PMKunden.tsx` | EDIT — Header durch ModulePageHeader ersetzen |
| `PMFinanzen.tsx` | EDIT — Header durch ModulePageHeader ersetzen |

### Ergebnis

Nach der Harmonisierung folgt jede PMSeite dem gleichen Muster wie MOD-13 (Projekte) und die Vertriebspartner-Module:
- `ModulePageHeader` mit UPPERCASE-Titel + optionaler Description + Actions
- Dashboard: `ManagerVisitenkarte` (persoenliche Daten) links, Kapazitaet rechts
- Firmendaten/Bio/Website bleiben exklusiv auf der Profil-Seite
