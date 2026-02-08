
# Vermietereinheit — UX-Optimierung

## Zusammenfassung

Die Analyse bestätigt: **Die Daten sind NICHT hartcodiert** — sie werden korrekt aus der Datenbank geladen (`landlord_contexts` + `context_members`). Das Problem liegt in der **UX-Darstellung**, die optimiert werden soll.

---

## Identifizierte Probleme

1. **Modal-Dialog für Bearbeitung** — zu umständlich, Benutzer verliert Kontext
2. **"+" Karte im Portfolio-Tab** — Doppelte Navigation, soll entfernt werden
3. **Button-Platzierung** — "Neue Vermietereinheit anlegen" oben rechts ist nicht optimal

---

## Lösungskonzept

### 1. Portfolio-Tab: "+" Karte entfernen

**Datei:** `src/pages/portal/immobilien/PortfolioTab.tsx`

Die Navigations-Karte zur Kontext-Erstellung wird entfernt. Vermietereinheiten können nur noch unter dem dedizierten Tab "Vermietereinheit" erstellt werden.

```text
VORHER:
[Alle] [Ehepaar M.] [GmbH] [+]  ← "+" navigiert zu /kontexte

NACHHER:
[Alle] [Ehepaar M.] [GmbH]      ← Nur Auswahl, keine Erstellung
```

---

### 2. KontexteTab: Inline-Editing + Card-Layout

**Datei:** `src/pages/portal/immobilien/KontexteTab.tsx`

#### 2.1 Neue Kartenstruktur

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Vermietereinheiten                                                    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────┐ │
│ │ Familie Mustermann      │  │ Immo-GmbH               │  │   (+)   │ │
│ │ ────────────────────────│  │ ────────────────────────│  │         │ │
│ │ [Privat]    42% Grenz.  │  │ [Geschäftl.]   30%      │  │  Neue   │ │
│ │                         │  │                         │  │  Ver-   │ │
│ │ zVE: 98.000 €           │  │ GF: M. Mustermann       │  │ mieter- │ │
│ │ Splitting · 1 Kind      │  │ HRB: 12345 B            │  │ einheit │ │
│ │ ────────────────────────│  │ USt-ID: DE123456789     │  │         │ │
│ │ ┌──────────┬──────────┐ │  │ ────────────────────────│  │         │ │
│ │ │ Max M.   │ Lisa M.  │ │  │ Musterstraße 15         │  │         │ │
│ │ │ 50% III  │ 50% V    │ │  │ 04103 Leipzig           │  │         │ │
│ │ └──────────┴──────────┘ │  │                         │  │         │ │
│ │ ────────────────────────│  │ ────────────────────────│  │         │ │
│ │ 8 Objekte zugeordnet    │  │ 4 Objekte zugeordnet    │  │         │ │
│ │                         │  │                         │  │         │ │
│ │ [Bearbeiten] [Zuordnen] │  │ [Bearbeiten] [Zuordnen] │  │         │ │
│ └─────────────────────────┘  └─────────────────────────┘  └─────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### 2.2 Inline-Edit-Modus

Klick auf "Bearbeiten" aktiviert den Edit-Modus **direkt auf der Kachel**:

```text
┌─────────────────────────────────────────────┐
│ Familie Mustermann            [Bearbeitung] │
│ ────────────────────────────────────────────│
│ Name:    [Familie Mustermann____]           │
│ zVE:     [98000_______________] €           │
│ Typ:     (•) Splitting ( ) Einzel           │
│ Kinder:  [1]  [ ] Kirchensteuer             │
│ ────────────────────────────────────────────│
│ Eigentümer 1:                               │
│ [Max_______] [Mustermann____] Stkl: [III▼]  │
│ Beruf: [Software-Entwickler___] 72.000 €    │
│ Eigentümer 2:                               │
│ [Lisa______] [Mustermann____] Stkl: [V__▼]  │
│ Beruf: [Marketing-Managerin___] 54.000 €    │
│ ────────────────────────────────────────────│
│     [Abbrechen]           [Speichern]       │
└─────────────────────────────────────────────┘
```

---

### 3. Button-Positionierung

**Aktuell:** "Vermietereinheit anlegen" Button oben rechts

**Neu:** Die Erstellung erfolgt über eine dedizierte "+"-Karte am Ende der Kartenreihe (wie im Mockup). Der separate Button oben rechts wird entfernt.

---

## Technische Umsetzung

### Zu ändernde Dateien

| Datei | Änderung |
|-------|----------|
| `PortfolioTab.tsx` | Zeilen 676-683: "+"-Karte entfernen |
| `KontexteTab.tsx` | Komplette Überarbeitung: Inline-Edit statt Modal |

### Neue Komponenten (innerhalb KontexteTab)

1. **`ContextCardView`** — Anzeige-Modus einer Vermietereinheit
2. **`ContextCardEdit`** — Bearbeitungs-Modus (Inline-Formular)
3. **`AddContextCard`** — "+"-Karte für Neuanlage

### State-Management

```typescript
// In KontexteTab.tsx
const [editingContextId, setEditingContextId] = useState<string | null>(null);
const [editFormData, setEditFormData] = useState<ContextFormData | null>(null);

// Toggle Edit Mode
const handleEditClick = (context: LandlordContext) => {
  setEditingContextId(context.id);
  setEditFormData({
    name: context.name,
    context_type: context.context_type,
    // ... alle Felder
  });
};

// Save Handler
const handleSave = async () => {
  await updateContext.mutateAsync({ id: editingContextId, ...editFormData });
  setEditingContextId(null);
};
```

### Datenbank-Interaktion

Keine Änderungen an Queries — die bestehenden `useQuery` und `useMutation` Hooks bleiben identisch.

---

## Architektur-Sicherheit

| Prüfpunkt | Status | Details |
|-----------|--------|---------|
| Routen | Unverändert | `/portal/immobilien/kontexte` bleibt |
| URL-Parameter | Unverändert | Keine neuen Parameter |
| Datenbank-Schema | Unverändert | Keine Migration erforderlich |
| CreateContextDialog | Erhalten | Wird für Neuanlage via "+"-Karte genutzt |
| RLS Policies | Unverändert | Keine Änderungen |

---

## Erwartetes Ergebnis

1. **Keine doppelten Routen** — Vermietereinheit nur an einer Stelle erstellbar
2. **Intuitive Darstellung** — Alle Daten auf einen Blick sichtbar
3. **Schnelles Editing** — Direkt auf der Kachel, kein Modal
4. **Skalierbar** — Funktioniert für 1-10 Vermietereinheiten

---

## Implementierungs-Reihenfolge

1. **PortfolioTab.tsx**: "+"-Karte entfernen (5 Zeilen)
2. **KontexteTab.tsx**: Button-Position ändern
3. **KontexteTab.tsx**: Inline-Edit-Logik implementieren
4. **KontexteTab.tsx**: "+"-Karte am Ende der Kartenreihe
5. **Optional**: CreateContextDialog behalten für komplexe Neuanlage (Schritt 2: Eigentümer)
