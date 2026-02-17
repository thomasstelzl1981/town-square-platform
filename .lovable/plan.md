

## Pet Manager -- Aufräumen und Standardbreite

### Problem-Analyse

1. **Seitenbreite**: Alle 7 Pet-Manager-Seiten (Dashboard, Buchungen, Kalender, Räume, Leistungen, Kunden, Finanzen) verwenden keinen `PageShell`-Wrapper. Sie rendern sich daher über die volle Bildschirmbreite statt im `max-w-7xl`-Standard.
2. **Kein Provider-Profil vorhanden**: Da kein Provider-Profil zugewiesen ist, zeigen alle Seiten nur leere Zustände ("Kein Provider-Profil gefunden"). Das erklärt, warum du weder Kalender noch Belegung siehst -- die Daten sind an ein Provider-Profil gebunden.
3. **Zu viele Kacheln ohne sichtbaren Inhalt**: Ohne aktives Provider-Profil sehen alle Unterseiten identisch leer aus.

### Massnahmen

#### 1. PageShell auf alle PM-Seiten anwenden
Jede der 7 Seiten (`PMDashboard`, `PMBuchungen`, `PMKalender`, `PMRaeume`, `PMLeistungen`, `PMKunden`, `PMFinanzen`) wird in `<PageShell>` gewrappt, damit die Breite auf `max-w-7xl` begrenzt wird -- identisch zu allen anderen Portal-Modulen.

#### 2. Sidebar-Navigation reduzieren
Die Sidebar-Kacheln werden auf die 4 Kernbereiche reduziert, die tatsächliche Funktionalität bieten:

- **Dashboard** -- Visitenkarte, Kapazität, KPIs, nächste Termine
- **Buchungen** -- Anfragen annehmen/ablehnen, Check-In/Check-Out
- **Kalender** -- Wochen-/Monatsansicht mit Buchungsblöcken
- **Räume** -- Raumverwaltung und Belegungsansicht

Die folgenden Einträge werden aus der Sidebar entfernt (bleiben als Routen erreichbar, aber nicht als prominente Kacheln):
- **Leistungen** -- wird in das Dashboard oder als Tab in Buchungen integriert (Link vom Dashboard)
- **Kunden & Tiere** -- wird als Link vom Dashboard erreichbar, nicht als eigene Kachel
- **Finanzen** -- wird als Link vom Dashboard erreichbar, nicht als eigene Kachel

#### 3. Dashboard mit direkten Schnellzugriffen
Das Dashboard erhält klare Schnellzugriff-Links zu Kalender und Räume, damit diese Funktionen sofort sichtbar und erreichbar sind.

### Technische Details

**Dateien, die geändert werden:**

| Datei | Änderung |
|-------|----------|
| `PMDashboard.tsx` | `PageShell`-Wrapper + Schnellzugriff-Links zu Kalender, Räume, Buchungen |
| `PMBuchungen.tsx` | `PageShell`-Wrapper |
| `PMKalender.tsx` | `PageShell`-Wrapper |
| `PMRaeume.tsx` | `PageShell`-Wrapper |
| `PMLeistungen.tsx` | `PageShell`-Wrapper |
| `PMKunden.tsx` | `PageShell`-Wrapper |
| `PMFinanzen.tsx` | `PageShell`-Wrapper |
| `moduleContents.ts` | Sidebar von 6 auf 4 Einträge reduzieren (Dashboard, Buchungen, Kalender, Räume) |

