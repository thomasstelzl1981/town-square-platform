
# DMS Design-Harmonisierung — Alle 4 Tabs vereinheitlichen

## Analyse der Probleme

Nach der visuellen Pruefung aller vier Tabs gibt es folgende konkrete Inkonsistenzen:

### 1. Posteingang: Unnoetige Counter-Kacheln
- Die 4 farbigen Statistik-Boxen oben (Gesamt, Bereit, Ausstehend, Fehler) haben keinen Mehrwert fuer den Nutzer
- Verschiedene Farben (gruen, amber, rot) erzeugen visuelle Unruhe
- Ersatz: Ein einfacher Header mit Titel + Beschreibung (wie bei Sortieren/Einstellungen)

### 2. Einstellungen: Euro-Preise statt Credits
- Zeile 191: `formatCredits` rechnet in Euro — muss rein in Credits sein
- Zeile 279: `{formatCredits(plan.price_cents)}/Monat` zeigt Euro-Betraege
- Zeile 291: `4 Credits = 1 Euro` — diese Umrechnung soll weg
- Zeile 431: `≈ 0,25 Euro pro Auslesung` — Euro-Angabe entfernen
- Speicherplan-Buttons zeigen Euro-Preise — nur Credits zeigen

### 3. Inkonsistente Header/Seitentitel
- Storage: Kein Header/Titel — springt direkt in den File Manager
- Posteingang: Counter-Kacheln statt Header
- Sortieren: Hat Header mit `text-h2` + Beschreibung
- Einstellungen: Hat Header mit `text-h2` + Beschreibung
- Loesung: Alle Tabs bekommen einen einheitlichen, schlichten Header (Titel + 1 Zeile Beschreibung)

### 4. Verschiedene Kachel-Stile
- Sortieren: `glass-card` mit `CardContent p-5`
- Einstellungen: `glass-card` mit `p-6 pb-4 border-b` Header + `CardContent p-6`
- Posteingang: `border-primary/20` Card fuer Upload-Mail, Tabelle hat eigene Styles
- Loesung: Einheitliches Card-Pattern fuer alle Tabs

### 5. Speicherplatz "Upgrade" ohne Funktion
- Die Plan-Buttons aendern direkt den Plan ohne Vertragsabschluss
- Mindestens ein Hinweis "Vertrag erforderlich" oder Button deaktivieren fuer Paid-Plans

## Umsetzungsplan

### A) PosteingangTab.tsx — Counter weg, Header rein

**Entfernen (Zeile 155-172):** Die 4 Statistik-Boxen (`grid grid-cols-4 gap-3` mit Gesamt/Bereit/Ausstehend/Fehler)

**Ersetzen durch schlichten Header:**
```
Posteingang
Hier gehen E-Mails und Dokumente aus Ihrem digitalen Postservice ein.
```

**Upload-E-Mail-Kachel vereinfachen:**
- `border-primary/20` anpassen auf `glass-card` fuer Konsistenz
- Header-Stil angleichen an Einstellungen-Kacheln

### B) EinstellungenTab.tsx — Credits statt Euro

**Zeile 191:** `formatCredits` Funktion entfernen oder durch Credits-Anzeige ersetzen
**Zeile 279:** Planpreis in Credits anzeigen (z.B. "40 Credits/Monat" statt "10,00 Euro/Monat")
**Zeile 291:** "4 Credits = 1 Euro" Zeile entfernen
**Zeile 431:** "≈ 0,25 Euro pro Auslesung" entfernen — nur "1 Credit" belassen

**Speicherplan-Buttons:**
- Kostenpflichtige Plaene: Button zeigt "Vertrag erforderlich" und oefffnet nicht direkt den Plan-Wechsel
- Oder: Deaktiviert mit Tooltip "Bitte kontaktieren Sie uns fuer ein Upgrade"

### C) StorageTab.tsx — Header hinzufuegen

**Oberhalb des StorageFileManager einfuegen:**
```
Dateien
Verwalten Sie Ihre Dokumente und Ordner.
```

Gleiche Typografie wie Sortieren/Einstellungen (`text-h2` + `text-sm text-muted-foreground`)

### D) SortierenTab.tsx — Stil angleichen

- Container/Padding an Einstellungen angleichen (gleicher `container max-w-7xl` wrapper — ist bereits vorhanden)
- Sicherstellen dass `glass-card` ueberall gleich aussieht
- Kein inhaltlicher Umbau noetig, nur Feinschliff

### E) Globale Typografie-Regeln (Cross-Tab)

Alle Tabs folgen diesem Schema:
1. **Seiten-Header:** `text-h2` + `text-sm text-muted-foreground mt-1` (wie Einstellungen)
2. **Kachel-Header:** `font-semibold text-foreground` mit Icon in `p-2.5 rounded-xl bg-primary/10`
3. **Beschreibungstexte:** `text-xs text-muted-foreground`
4. **Info-Boxen:** `p-3 rounded-xl bg-muted/50 text-xs`
5. **Keine Euro-Angaben** — nur Credits

## Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/portal/dms/PosteingangTab.tsx` | Counter-Grid entfernen, Header einfuegen, Upload-Card auf glass-card |
| `src/pages/portal/dms/EinstellungenTab.tsx` | Euro-Preise durch Credits ersetzen, Upgrade-Flow absichern |
| `src/pages/portal/dms/StorageTab.tsx` | Header mit Titel + Beschreibung einfuegen |
| `src/pages/portal/dms/SortierenTab.tsx` | Minimaler Stil-Feinschliff fuer Konsistenz |

## Kein Datenbank-Aenderung noetig
Rein visuelle Anpassungen.
