

# Cleanup: Fahrtenbuch-Sektion — Design-Konformität herstellen

## Probleme (Screenshot-Analyse)

1. **Überschrift "Fahrtenbuch"** hat ein Icon links (BookOpen) und ist als `h2 text-lg` gestylt — muss dem `ModulePageHeader`-Pattern folgen (UPPERCASE, `text-2xl md:text-3xl font-bold tracking-tight`, kein Icon)
2. **Leere-Kachel** ("Noch keine Fahrtenbücher angelegt") ist überflüssig — wird durch Tracker-Werbung ersetzt
3. **Button "Fahrtenbuch anlegen"** hat Text-Label — soll ein `icon-round` Plus-Button sein (wie bei Fahrzeuge)
4. **Suchfeld** links neben "Fahrzeuge" — das ist korrekt im `ModulePageHeader`, wird nur auf Desktop gezeigt (`DesktopOnly`). Das Suchfeld gehört zur Fahrzeuge-Sektion, nicht zum Fahrtenbuch

## Änderungen

### 1. LogbookSection.tsx — Header umbauen

Ersetze den bisherigen Section-Header (Icon + h2 + Button mit Text) durch:

```tsx
<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
  <div>
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Fahrtenbuch</h2>
    <p className="text-sm text-muted-foreground mt-1">
      Fahrtenbücher für Ihre Fahrzeuge verwalten
    </p>
  </div>
  <div className="flex items-center gap-2 flex-shrink-0">
    <Button variant="glass" size="icon-round" onClick={() => setShowCreate(!showCreate)}>
      <Plus className="h-5 w-5" />
    </Button>
  </div>
</div>
```

Kein BookOpen-Icon, kein `p-2 rounded-lg bg-primary/10` Container. Exakt wie `ModulePageHeader`.

### 2. Leere-Kachel → Tracker-Werbung (Seeworld R58L)

Ersetze den `logbooks.length === 0` Block (die dashed Card mit "Noch keine Fahrtenbücher angelegt") durch eine Werbe-Card für den GPS-Tracker:

- **Produktname**: Seeworld R58L — 4G OBD2 GPS Tracker
- **Kaufpreis**: 59,90 € (einmalig)
- **Monatlich**: 14,90 €/Monat (Tracking-Service)
- **Kurzbeschreibung**: "Einfach in den OBD2-Port Ihres Fahrzeugs stecken — keine Installation nötig. 24/7 GPS-Tracking mit automatischer Fahrtenerkennung für Ihr rechtssicheres Fahrtenbuch."
- **Features** (3-4 Punkte): Echtzeit-Ortung, Automatische Fahrterkennung, Geo-Fence Benachrichtigungen, Fahrzeugdiagnose (OBD2)
- **Link**: Externer Link zur Produktseite
- **Design**: Kompakte Card (nicht dashed), professionell, mit Preisanzeige

Diese Werbung wird IMMER angezeigt (nicht nur wenn leer), unterhalb der Logbook-Widgets als Info-Banner.

### 3. Überflüssige Imports entfernen

- `BookOpen` wird nicht mehr im Header gebraucht (aber noch im ExpandedView → bleibt)
- Entferne nur was nicht mehr referenziert wird

