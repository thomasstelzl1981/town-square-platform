

# Plan: Navigation-Verhalten - Level 1 Klick schliesst Level 3

## Verstandnis Ihrer Anforderung

Basierend auf der aktuellen 3-Ebenen-Navigation:

| Ebene | Komponente | Beispielinhalt |
|-------|------------|----------------|
| **Level 1 (SubLine1)** | `AreaTabs` | Base, Missions, Operations, Services |
| **Level 2 (SubLine2)** | `ModuleTabs` | Stammdaten, KI Office, Dokumente, etc. |
| **Level 3 (SubLine3)** | `SubTabs` | Ubersicht, Kontakte, Dokumente, etc. |

**Ihre Anforderung:** Wenn der Benutzer auf Level 1 (AreaTabs) klickt, soll Level 3 (SubTabs) geschlossen/versteckt werden.

### Aktuelles Verhalten
- Klick auf AreaTabs (z.B. "Missions") andert nur die `activeArea`
- Die ModuleTabs zeigen dann die 5 Module des neuen Bereichs
- Die SubTabs bleiben sichtbar (zeigen Tiles des aktuell aktiven Moduls)

### Gewunschtes Verhalten
- Klick auf AreaTabs schliesst die SubTabs-Leiste
- SubTabs erscheinen erst wieder, wenn ein Modul aus Level 2 angeklickt wird

---

## Technische Losung

### Ansatz: Neuer State `subTabsVisible`

Ein neuer State im `usePortalLayout` Hook steuert die Sichtbarkeit der SubTabs:

**1. State erweitern (`usePortalLayout.tsx`):**
```tsx
// Neuer State
subTabsVisible: boolean;
setSubTabsVisible: (visible: boolean) => void;

// Initialisierung
const [subTabsVisible, setSubTabsVisible] = useState(false);
```

**2. AreaTabs anpassen (`AreaTabs.tsx`):**
```tsx
// Beim Klick auf Area: SubTabs schliessen
onClick={() => {
  setActiveArea(area.key);
  setSubTabsVisible(false);  // SubTabs ausblenden
}}
```

**3. ModuleTabs anpassen (`ModuleTabs.tsx`):**
```tsx
// Beim Klick auf Modul: SubTabs offnen (falls Tiles vorhanden)
// Dies geschieht automatisch durch Navigation zum Modul
```

**4. SubTabs anpassen (`SubTabs.tsx`):**
```tsx
// Bedingte Anzeige basierend auf subTabsVisible
if (!subTabsVisible || !module.tiles || module.tiles.length === 0) {
  return null;
}
```

**5. Navigation-Logik (`PortalLayout.tsx` oder Router):**
```tsx
// Wenn auf Modul navigiert wird: SubTabs automatisch einblenden
useEffect(() => {
  if (activeModule && activeModule.tiles?.length > 0) {
    setSubTabsVisible(true);
  }
}, [activeModule]);
```

---

## Visuelles Verhalten

### Szenario 1: Benutzer klickt auf "Missions" (Level 1)
```text
Vorher:
+--------------------------------------------------+
|   Base   [Missions]   Operations   Services      | <- Level 1
+--------------------------------------------------+
|   Stammdaten   Objekte   Module3   Module4       | <- Level 2
+--------------------------------------------------+
|   Ubersicht   Kontakte   Dokumente   Finanzen    | <- Level 3 (sichtbar)
+--------------------------------------------------+

Nachher:
+--------------------------------------------------+
|   Base   [Missions]   Operations   Services      | <- Level 1
+--------------------------------------------------+
|   Immobilien   MSV   Verkauf   Finanzierung ...  | <- Level 2 (neue Module)
+--------------------------------------------------+
                                                    <- Level 3 VERSTECKT
```

### Szenario 2: Benutzer klickt dann auf "Immobilien" (Level 2)
```text
+--------------------------------------------------+
|   Base   [Missions]   Operations   Services      | <- Level 1
+--------------------------------------------------+
|   [Immobilien]   MSV   Verkauf   Finanzierung    | <- Level 2
+--------------------------------------------------+
|   Objekte   Mieter   Dokumente   Finanzen        | <- Level 3 erscheint wieder
+--------------------------------------------------+
```

---

## Dateiänderungen

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/hooks/usePortalLayout.tsx` | MODIFY | Neuen State `subTabsVisible` hinzufugen |
| `src/components/portal/AreaTabs.tsx` | MODIFY | `setSubTabsVisible(false)` bei Area-Klick |
| `src/components/portal/SubTabs.tsx` | MODIFY | Bedingte Anzeige basierend auf `subTabsVisible` |
| `src/components/portal/PortalLayout.tsx` | MODIFY | SubTabs einblenden wenn Modul aktiv |

---

## Ist das korrekt verstanden?

**Zusammenfassung:**
- Level 1 Klick (Area wechseln) → Level 3 (SubTabs) wird versteckt
- Level 2 Klick (Modul offnen) → Level 3 (SubTabs) erscheint wieder

Falls dies nicht Ihrer Vorstellung entspricht, bitte korrigieren Sie mich!

