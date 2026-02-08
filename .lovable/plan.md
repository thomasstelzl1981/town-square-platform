
# Bereinigung: Doppelte Objektbeschreibung entfernen

## Problemzusammenfassung

Die Objektbeschreibung erscheint an zwei Stellen:
1. **Immobilienakte (Tab "Akte")**: Im Block "Lage & Beschreibung" (`EditableAddressBlock`)
2. **Exposé (Tab "Exposé")**: Als eigene Karte (`ExposeDescriptionCard`)

Beide speichern in `properties.description`, aber mit unterschiedlichen Speichermechanismen → führt zu Synchronisationsproblemen.

---

## Empfohlene Lösung

**Objektbeschreibung nur noch in der Immobilienakte bearbeiten** (SSOT-Prinzip)

Im Exposé-Tab wird die Beschreibung:
- Nur noch **angezeigt** (read-only)
- Mit einem Link/Button zur Bearbeitung in der Akte versehen

---

## Änderungen

### 1. Neue Read-Only-Komponente erstellen

**Datei:** `src/components/verkauf/ExposeDescriptionDisplay.tsx`

Eine einfache Anzeige-Komponente, die:
- Die Beschreibung aus `properties.description` anzeigt
- Einen "Bearbeiten in Akte"-Hinweis zeigt
- Keine eigene Speicher-Logik hat

```tsx
const ExposeDescriptionDisplay = ({ 
  description 
}: { description: string | null }) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objektbeschreibung</CardTitle>
          <span className="text-xs text-muted-foreground">
            (bearbeiten im Tab "Akte")
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {description ? (
          <p className="text-sm whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Noch keine Beschreibung vorhanden. 
            Erstellen Sie eine im Tab "Akte" unter "Lage & Beschreibung".
          </p>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2. ExposeTab.tsx anpassen

**Datei:** `src/components/portfolio/ExposeTab.tsx`

Zeilen 7-8 und 122-125 ändern:

```tsx
// Import ändern
import ExposeDescriptionDisplay from '@/components/verkauf/ExposeDescriptionDisplay';

// Verwendung ändern
<ExposeDescriptionDisplay description={property.description} />
```

### 3. ExposeDescriptionCard.tsx optional entfernen

Die alte Komponente kann gelöscht werden, da sie nicht mehr benötigt wird.

---

## Datenfluss nach der Änderung

```
┌─────────────────────────────────────────────────────────────────┐
│ SSOT: properties.description                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│ Tab "Akte"          │         │ Tab "Exposé"        │
│ EditableAddressBlock│         │ ExposeDescription-  │
│ → SCHREIBEN + LESEN │         │ Display             │
│ → KI-Generierung    │         │ → NUR LESEN         │
└─────────────────────┘         └─────────────────────┘
```

---

## Vorteile

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Bearbeitungsorte | 2 | 1 |
| Synchronisation | Konfliktgefahr | Keine Konflikte |
| Speichermechanismen | 2 verschiedene | 1 einheitlicher |
| UX-Klarheit | Verwirrend | Eindeutig |

---

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/components/verkauf/ExposeDescriptionDisplay.tsx` | Neu erstellen |
| `src/components/portfolio/ExposeTab.tsx` | Import und Verwendung ändern |
| `src/components/verkauf/ExposeDescriptionCard.tsx` | Kann gelöscht werden |

---

## Alternative (falls gewünscht)

Falls die KI-Generierung auch im Exposé-Tab verfügbar sein soll, können wir stattdessen:
- Die Beschreibung im Exposé-Tab editierbar lassen
- Aber **dieselbe Speicher-Logik wie in der Akte** verwenden (über Query-Invalidation und Dossier-Refresh)

Diese Alternative wäre komplexer, aber würde beide Orte synchron halten.
