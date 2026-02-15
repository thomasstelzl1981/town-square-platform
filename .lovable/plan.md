

# RecordCard Closed-State: Foto 50% Breite, Daten ab 20% eingerueckt

## Neues Layout (Skizze mit Massen)

```text
+--------------------------------------------------+
|  [Badge: Hauptperson]                             |
|                                                   |
|  +------------------------+                       |
|  |                        |                       |
|  |     FOTO / DROP        |                       |
|  |     (w-1/2 = 50%)      |                       |
|  |     aspect-[4/5]       |                       |
|  |     rounded-xl         |                       |
|  |                        |                       |
|  +------------------------+                       |
|                                                   |
|           Thomas Stelzl        (text-xl bold)     |
|           15.03.1985           (text-sm muted)    |
|                                                   |
|           Sauerlacher Str. 30  (text-sm)          |
|           82041 Oberhaching    (text-sm)          |
|           +49 170 12345678     (text-sm)          |
|           thomas@example.com   (text-sm)          |
|                                              [>]  |
+--------------------------------------------------+
|           ^                                       |
|           20% Einrueckung (pl-[20%])              |
```

## Kernpunkte

- **Foto-Kachel**: `w-1/2` (50% der Widget-Breite), `aspect-[4/5]` fuer ein schoenes Hochformat-Verhaeltnis, `rounded-xl`, bleibt Drop-Zone
- **Datenblock**: Beginnt bei **20% der Breite** via `pl-[20%]` — also leicht eingerueckt, nicht am linken Rand klebend
- **Keine Labels** — nur die Werte werden angezeigt (Geburtsdatum, Adresse, Telefon, E-Mail)
- **Name** in `text-xl font-bold`, Kontaktdaten in `text-sm text-muted-foreground`
- Foto-Platzhalter zeigt Kamera-Icon + "Foto hierher ziehen"

## Technische Aenderung

### `src/components/shared/RecordCard.tsx` — Zeilen 119-169

Der gesamte `hasDetailedSummary`-Block wird ersetzt:

```tsx
{hasDetailedSummary ? (
  <div className="p-5 pt-10 text-left">
    {/* Grosses Foto — 50% Breite, Hochformat */}
    <div
      className={cn(
        'w-1/2 aspect-[4/5] rounded-xl overflow-hidden mb-4',
        thumbnailUrl
          ? ''
          : 'border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 bg-muted/20',
      )}
      onDragOver={...}
      onDrop={...}
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} className="h-full w-full object-cover" />
      ) : (
        <>
          <Camera className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/40">Foto hierher ziehen</span>
        </>
      )}
    </div>

    {/* Name + Daten, eingerueckt auf 20% */}
    <div className="pl-[20%]">
      <p className="text-xl font-bold leading-tight truncate">{title}</p>
      <div className="mt-2 space-y-0.5">
        {summary.map((s, i) => (
          <p key={i} className="text-sm text-muted-foreground/80 truncate">
            {s.value}
          </p>
        ))}
      </div>
    </div>
  </div>
)}
```

### `UebersichtTab.tsx` und `ProfilTab.tsx` — Summary ohne Labels

Labels werden nicht mehr angezeigt, daher Reihenfolge entscheidend:

```typescript
summary={[
  ...(person.birth_date ? [{ label: '', value: format(new Date(person.birth_date), 'dd.MM.yyyy') }] : []),
  ...(person.street ? [{ label: '', value: `${person.street} ${person.house_number || ''}`.trim() }] : []),
  ...(person.zip ? [{ label: '', value: `${person.zip} ${person.city || ''}`.trim() }] : []),
  ...(person.phone ? [{ label: '', value: person.phone }] : []),
  ...(person.email ? [{ label: '', value: person.email }] : []),
]}
```

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/shared/RecordCard.tsx` | Foto 50% breit (w-1/2, aspect-[4/5]), Datenblock ab 20% (pl-[20%]), nur Werte ohne Labels |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Summary ohne Labels, Geb. als erstes Item |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | Gleiche Anpassung |

