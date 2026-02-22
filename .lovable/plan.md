

## Mobile Startseite verschlanken — 3 Eintraege weniger

### Ist-Zustand (11 Eintraege)

1. Finanzen
2. Immobilien
3. **Briefe** (MOD-02 tile — Briefgenerator)
4. **Dokumente** (MOD-03 — DMS Modul)
5. **Posteingang** (MOD-03 tile — Duplikat!)
6. Shops & Fortbildung
7. Fahrzeuge
8. Haustiere
9. Finanzierung
10. Immo Suche
11. Armstrong Tasks

### Probleme

- "Posteingang" ist doppelt: als eigener Eintrag UND als Tile innerhalb von "Dokumente" (MOD-03 hat bereits den Tab "Posteingang")
- "Briefe" und "Dokumente" sind thematisch verwandt und koennten zusammengefasst werden
- 11 Eintraege sind zu viele fuer eine kompakte Mobile-Startseite

### Loesung: Von 11 auf 8 Eintraege

**Entfernen:**
- "Posteingang" — bereits als Tab in DMS (Dokumente) enthalten
- "Briefe" — wird stattdessen als Quick-Link innerhalb der DMS-Seite auf Mobile angezeigt

**Hinzufuegen:**
- Innerhalb der DMS-Modulseite auf Mobile: ein sichtbarer Quick-Link zum Briefgenerator (`/portal/office/brief`), damit der Zugang nicht verloren geht

**Ergebnis (9 Eintraege):**
1. Finanzen
2. Immobilien
3. Dokumente (mit Posteingang + Briefgenerator-Link drin)
4. Shops & Fortbildung
5. Fahrzeuge
6. Haustiere
7. Finanzierung
8. Immo Suche
9. Armstrong Tasks

### Schriftgroesse

Mit 9 statt 11 Eintraegen haben wir Platz, die Schrift von `text-sm` (14px) auf `text-base` (16px) zu erhoehen — besser lesbar und touch-freundlicher.

### Technische Umsetzung

#### 1. `src/config/mobileHomeConfig.ts`

Zwei Eintraege entfernen:
- Zeile 24: `{ type: 'tile', code: 'MOD-02', tile: 'brief', label: 'Briefe', icon: 'FileText' }` — entfernen
- Zeile 26: `{ type: 'tile', code: 'MOD-03', tile: 'posteingang', label: 'Posteingang', icon: 'Inbox' }` — entfernen

#### 2. `src/components/portal/MobileHomeModuleList.tsx`

- Schriftgroesse von `text-sm` auf `text-base` erhoehen
- Nicht mehr benoetigte Icons (`FileText`, `Inbox`) aus den Imports entfernen

#### 3. DMS-Seite: Quick-Link zum Briefgenerator auf Mobile

Damit der Briefgenerator weiterhin gut erreichbar ist, wird in der DMS-Modulseite auf Mobile ein kleiner Quick-Action-Button angezeigt, der direkt zum Briefgenerator navigiert. Dies wird ueber eine bedingte Anzeige (`useIsMobile`) geloest, sodass Desktop davon nicht betroffen ist.

Die genaue Platzierung: Als Link-Karte oberhalb der DMS-Tabs auf Mobile, z.B. "Briefgenerator oeffnen" mit einem kleinen FileText-Icon.

Betroffene Datei: Die DMS-Modulseite oder deren Tab-Layout-Komponente (muss geprueft werden welche Datei das Tab-Layout rendert).

#### 4. Swipe-Back Overrides

In `useSwipeBack.ts` muss kein neuer Override hinzugefuegt werden, da der Briefgenerator-Pfad (`/portal/office/brief`) bereits auf `/portal` mappt.

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/config/mobileHomeConfig.ts` | 2 Eintraege entfernen |
| `src/components/portal/MobileHomeModuleList.tsx` | Schrift vergroessern, Imports bereinigen |
| DMS Tab-Layout (MOD-03 Bereich) | Mobile-only Quick-Link zum Briefgenerator |

Keine Freeze-Pruefung noetig: `mobileHomeConfig` und `MobileHomeModuleList` sind shared Config/Komponenten. Der DMS-Quick-Link muesste auf MOD-03 Freeze geprueft werden.

