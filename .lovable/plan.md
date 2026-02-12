

# Plan: FutureRoom Bonität-Wizard — Bonitäts-Vorcheck + Freies Durchklicken

## Kernprinzip

Der gesamte Wizard ist **frei durchklickbar** ohne Pflichtfeld-Blockaden. Der Nutzer kann sich alle Schritte ansehen, um vorab zu verstehen, welche Daten und Unterlagen benoetigt werden. Erst beim finalen "Absenden" wird geprueft, ob die Mindestangaben vorhanden sind.

## Wizard-Schritte (7 statt 6)

```text
Kontakt → Objekt → Eckdaten → Kalkulation → Haushalt → Bonitatspruefung → Abschluss
```

### Navigationsregeln

- **"Weiter"-Button**: Immer aktiv, in jedem Schritt, auch ohne Eingaben
- **"Zurueck"-Button**: Immer aktiv
- **Bonitatspruefung-Schritt**: Der Button "Bonitatspruefung starten" ist optional — man kann auch ohne Pruefung weiterklicken
- **Einzige Blockade**: Der finale "Finanzierung einreichen"-Button im Abschluss-Schritt ist nur aktiv, wenn:
  1. Mindestens Kontaktdaten (Name + E-Mail) vorhanden sind
  2. Die Bonitatspruefung durchgefuehrt wurde

Falls Daten fehlen, zeigt der Abschluss-Schritt einen freundlichen Hinweis: "Bitte fuellen Sie die markierten Schritte aus, bevor Sie einreichen." — aber keine Blockade beim Navigieren.

## Technische Umsetzung

### Datei: `src/pages/zone3/futureroom/FutureRoomBonitat.tsx`

**1. Step-Array erweitern** (ca. Zeile 69-76):
- Neuer Step `'bonitat'` mit Label "Pruefung" und Shield-Icon zwischen `'household'` und `'decision'`

**2. Neue States** (ca. Zeile 63-67):
- `bonitaetChecked: boolean` (default: false)
- `bonitaetResult: 'positive' | 'negative' | null` (default: null)

**3. Navigation: Keine Validierung bei "Weiter"**:
- `handleNext` klickt einfach zum naechsten Schritt weiter — ohne Pruefung ob Felder gefuellt sind
- `handleBack` geht zurueck — ohne Warnung
- Reset von `bonitaetChecked` wenn man zum Haushalt-Schritt zurueckgeht

**4. Neuer Bonitat-Schritt**:
- Zusammenfassung der eingegebenen Werte (Rate, Einkommen, KDF-Quote) — zeigt "—" wenn nichts eingegeben
- Button "Bonitatspruefung starten" (optional, nicht blockierend)
- Bei Klick: KDF-Auswertung (gruen/gelb/rot Banner)
- "Weiter"-Button ist immer aktiv, unabhaengig ob Pruefung gemacht wurde

**5. Abschluss-Schritt (letzter Schritt)**:
- Zeigt Checkliste: welche Schritte ausgefuellt sind, welche noch offen
- "Finanzierung einreichen"-Button: Nur aktiv wenn Pflichtdaten + Bonitatspruefung vorhanden
- Klarer Hinweistext bei fehlenden Daten (kein Modal, kein Redirect — nur Info)

### Keine weiteren Dateien betroffen
### Keine Datenbank-Aenderungen

