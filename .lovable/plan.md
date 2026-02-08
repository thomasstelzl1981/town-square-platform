
# MOD-04 Portfolio — UI-Verbesserung: Vermietereinheit-Auswahl

## Zusammenfassung

Die Anforderung ist, den PortfolioTab so umzugestalten, dass die **Vermietereinheit-Auswahl** prominenter und intuitiver wird. Statt eines Dropdown-Menüs sollen die Kontexte als **klickbare Karten** nebeneinander angezeigt werden, bevor das eigentliche Portfolio erscheint.

---

## Aktueller Zustand (IST)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Immobilienportfolio  [▼ Alle Vermietereinheiten]  [+ Objekt]   │
├─────────────────────────────────────────────────────────────────┤
│  [KPI Cards: Einheiten | Verkehrswert | Restschuld | ...]       │
├─────────────────────────────────────────────────────────────────┤
│  [Charts: Vermögensentwicklung | Cashflow]                      │
├─────────────────────────────────────────────────────────────────┤
│  [Property Table]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Problem:**
- Die Vermietereinheit-Auswahl ist ein kleines Dropdown neben der Überschrift
- Nicht intuitiv für neue Benutzer
- Der logische Ablauf (erst Kontext wählen, dann Portfolio sehen) ist nicht klar

---

## Zielzustand (SOLL)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Wählen Sie Ihre Vermietereinheit                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  [Alle]      │  │ Ehepaar M.   │  │ GmbH & Co KG │  [+]      │
│  │  12 Objekte  │  │ Privat       │  │ Geschäftlich │           │
│  │  ✓ aktiv     │  │ 8 Objekte    │  │ 4 Objekte    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Immobilienportfolio — Ehepaar M.                    [+ Objekt] │
├─────────────────────────────────────────────────────────────────┤
│  [KPI Cards: Einheiten | Verkehrswert | Restschuld | ...]       │
├─────────────────────────────────────────────────────────────────┤
│  [Charts: Vermögensentwicklung | Cashflow]                      │
├─────────────────────────────────────────────────────────────────┤
│  [Property Table]                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Änderungen im Detail

### 1. Neue Sektion: "Wählen Sie Ihre Vermietereinheit"

**Position:** Ganz oben im PortfolioTab (vor KPIs)

**Komponenten:**
- Überschrift: `"Wählen Sie Ihre Vermietereinheit"`
- Horizontal scrollbare Kartenreihe (flexbox/grid)
- Jede Karte zeigt:
  - Name der Vermietereinheit
  - Badge: Privat/Geschäftlich
  - Anzahl zugeordneter Objekte
  - Aktiv-Indikator (Checkbox oder Rahmenfarbe)

**Verhalten:**
- Klick auf Karte → setzt `?context={id}` in URL
- "Alle"-Karte als erste Option (zeigt Gesamtportfolio)
- `+` Button am Ende → öffnet `CreateContextDialog`

### 2. Angepasste Portfolio-Überschrift

**Alt:**
```tsx
<h2>Immobilienportfolio</h2>
[DropdownMenu für Kontexte]
```

**Neu:**
```tsx
<h2>Immobilienportfolio — {selectedContextName}</h2>
```

Das Dropdown wird entfernt, da die Auswahl jetzt über Karten erfolgt.

### 3. Layout-Anpassung

```tsx
<div className="space-y-6 pt-6">
  {/* NEUE SEKTION: Vermietereinheit-Auswahl */}
  <div className="space-y-3">
    <h2 className="text-lg font-semibold">Wählen Sie Ihre Vermietereinheit</h2>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {/* "Alle" Karte */}
      <ContextCard 
        name="Alle" 
        count={totalObjectCount} 
        isActive={!selectedContextId}
        onClick={() => clearContext()}
      />
      {/* Kontext-Karten */}
      {contexts.map(ctx => (
        <ContextCard 
          key={ctx.id}
          name={ctx.name}
          type={ctx.context_type}
          count={propertyCount[ctx.id]}
          isActive={selectedContextId === ctx.id}
          onClick={() => setContext(ctx.id)}
        />
      ))}
      {/* + Button für neue Vermietereinheit */}
      <AddContextCard onClick={() => setShowCreateDialog(true)} />
    </div>
  </div>

  {/* Angepasste Portfolio-Überschrift */}
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">
      Immobilienportfolio{selectedContext ? ` — ${selectedContext.name}` : ''}
    </h2>
    <Button onClick={() => setShowCreateDialog(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Neues Objekt
    </Button>
  </div>

  {/* Rest bleibt unverändert: KPIs, Charts, Table */}
</div>
```

---

## Technische Details

### Keine Architektur-Änderungen
- Alle bestehenden Routen bleiben erhalten
- URL-Parameter `?context=` bleibt identisch
- Keine neuen Datenbank-Abfragen nötig (nutzt existierende `contexts`-Query)
- Keine neuen Hooks erforderlich

### Zu ändernde Datei

**`src/pages/portal/immobilien/PortfolioTab.tsx`**

Änderungen:
1. **Zeile ~602-644**: Ersetze `DropdownMenu` durch horizontale Kartenreihe
2. **Neu**: Inline-Komponente `ContextCard` für kompakte Darstellung
3. **Zeile ~607**: Überschrift anpassen mit ausgewähltem Kontext

### Neue Inline-Komponente (innerhalb PortfolioTab)

```tsx
interface ContextCardProps {
  name: string;
  type?: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const ContextCard = ({ name, type, count, isActive, onClick }: ContextCardProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col gap-1 p-4 rounded-lg border min-w-[140px] text-left transition-colors",
      isActive 
        ? "border-primary bg-primary/5 ring-2 ring-primary" 
        : "border-border hover:border-primary/50 hover:bg-muted/30"
    )}
  >
    <span className="font-medium truncate">{name}</span>
    {type && (
      <Badge variant={type === 'PRIVATE' ? 'secondary' : 'default'} className="w-fit text-xs">
        {type === 'PRIVATE' ? 'Privat' : 'Geschäftlich'}
      </Badge>
    )}
    <span className="text-xs text-muted-foreground">
      {count} Objekt{count !== 1 ? 'e' : ''}
    </span>
  </button>
);
```

---

## Visuelle Vorschau

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Wählen Sie Ihre Vermietereinheit                                    │
│                                                                     │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────┐        │
│ │ ▣ Alle      │  │ Ehepaar     │  │ Immo-GmbH   │  │  (+)  │        │
│ │             │  │ Mustermann  │  │             │  │       │        │
│ │ 12 Objekte  │  │ [Privat]    │  │ [Gesch.]    │  │ Neue  │        │
│ │             │  │ 8 Objekte   │  │ 4 Objekte   │  │       │        │
│ └─────────────┘  └─────────────┘  └─────────────┘  └───────┘        │
│      ↑ aktiv                                                        │
│   (Ring/Border)                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Verhalten

- **Desktop (md+)**: Karten nebeneinander, alle sichtbar
- **Mobile**: Horizontal scrollbar (overflow-x-auto)
- **Maximale Anzahl realistisch**: 3-10 Kontexte → passt problemlos

---

## Vorteile der Änderung

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Sichtbarkeit | Versteckt im Dropdown | Sofort sichtbar als Karten |
| Klickpfad | 2 Klicks (Dropdown öffnen + auswählen) | 1 Klick |
| Kontext | Unklar welche Optionen existieren | Alle Optionen auf einen Blick |
| UX-Logik | Auswahl neben Überschrift | Klarer Ablauf: erst wählen, dann sehen |
| Objekt-Überblick | Nicht sichtbar | Objektzahl pro Kontext sichtbar |

---

## Umsetzungsschritte

1. Inline-Komponente `ContextCard` erstellen
2. Neue Sektion "Wählen Sie Ihre Vermietereinheit" einfügen (vor KPIs)
3. DropdownMenu für Kontexte entfernen
4. Überschrift "Immobilienportfolio" anpassen (zeigt aktiven Kontext)
5. CreateContextDialog-Trigger für `+` Karte hinzufügen
6. Styling für aktiven Zustand (Ring/Border)

**Geschätzte Änderungen:** ~60-80 Zeilen in einer Datei

---

## Risiken & Absicherung

| Risiko | Absicherung |
|--------|-------------|
| URL-Routing bricht | Keine Änderung an `?context` Logik |
| Daten-Filterung | `filteredUnits` bleibt identisch |
| Kontext-Query | `useQuery` für `landlord_contexts` unverändert |
| Mobile Overflow | `overflow-x-auto` für horizontales Scrollen |
