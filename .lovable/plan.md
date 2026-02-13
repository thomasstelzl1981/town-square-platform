
# Reparaturplan: Demo-Widgets Privatkredit und Finanzierungsanfrage

## Problem 1: GP-PRIVATKREDIT — Demo-Widget nicht klickbar

**Ursache:** `ConsumerLoanWidgets` hat eine `onSelectCase`-Prop mit `onClick={() => onSelectCase?.('__demo__')}`. Aber `PrivatkreditTab.tsx` rendert `<ConsumerLoanWidgets />` ohne diese Prop zu uebergeben. Der Klick laeuft ins Leere.

**Loesung:** In `PrivatkreditTab.tsx` einen `activeCaseId`-State einfuehren und `onSelectCase` an `ConsumerLoanWidgets` uebergeben. Wenn `__demo__` ausgewaehlt wird, werden die darunterliegenden Formular-Sektionen mit Demo-Daten (25.000 EUR, 60 Monate, 4,9%) vorbefuellt und als Demo-Modus markiert.

**Aenderungen:**
- `src/pages/portal/finanzierung/PrivatkreditTab.tsx`: State `activeCaseId` hinzufuegen, `onSelectCase` und `activeCaseId` an `ConsumerLoanWidgets` durchreichen. Bei `__demo__`-Auswahl Demo-Werte in die Formularfelder setzen.

---

## Problem 2: Demo-Widgets verschwinden bei Toggle-Deaktivierung

**Ursache:** Beide Widget-Dateien verwenden `{showDemo && (<WidgetCell>...</WidgetCell>)}`. Wenn der Toggle aus ist, wird das gesamte Widget aus dem DOM entfernt — statt nur die Demo-Daten zu entfernen.

**Erwartetes Verhalten:** Das Demo-Widget bleibt immer sichtbar und schaltbar. Der Toggle steuert nur, ob die Demo-Daten unterhalb (Formulare, Detail-Ansichten) angezeigt werden.

**Loesung:** In beiden Dateien die Bedingung aendern:
- Das Widget wird **immer** gerendert (ohne `{showDemo && ...}`)
- Wenn der Toggle **aus** ist: Das Widget zeigt einen "deaktiviert"-Zustand (ausgegraut, kein `cursor-pointer`, kein `onClick`)
- Wenn der Toggle **an** ist: Normales interaktives Verhalten mit smaragdgruenem Demo-Styling

**Aenderungen:**
- `src/components/privatkredit/ConsumerLoanWidgets.tsx` (Zeilen 110-136): `{showDemo && ...}` ersetzen durch permanentes Rendering mit bedingtem Styling
- `src/components/finanzierung/FinanceRequestWidgets.tsx` (Zeilen 88-115): Gleiches Muster

---

## Technische Details

### ConsumerLoanWidgets.tsx — Vorher:
```
{showDemo && (
  <WidgetCell>
    <Card onClick={() => onSelectCase?.('__demo__')}>
      ...
    </Card>
  </WidgetCell>
)}
```

### ConsumerLoanWidgets.tsx — Nachher:
```
<WidgetCell>
  <Card
    className={cn(
      'h-full transition-all',
      showDemo
        ? [DESIGN.DEMO_WIDGET.CARD, DESIGN.DEMO_WIDGET.HOVER, 'cursor-pointer']
        : 'opacity-50 grayscale cursor-default'
    )}
    onClick={() => showDemo && onSelectCase?.('__demo__')}
  >
    ...
  </Card>
</WidgetCell>
```

### FinanceRequestWidgets.tsx — Gleiches Muster:
- Widget immer sichtbar
- Bei Toggle aus: ausgegraut, kein Klick-Handler
- Bei Toggle an: Navigation zu `__demo__`-Route

### PrivatkreditTab.tsx — Demo-Interaktivitaet:
- Neuer State: `const [activeCaseId, setActiveCaseId] = useState<string | undefined>()`
- Widget-Aufruf: `<ConsumerLoanWidgets activeCaseId={activeCaseId} onSelectCase={setActiveCaseId} />`
- Wenn `activeCaseId === '__demo__'`: Formularfelder mit Demo-Werten befuellen (amount=25000, term=60)

---

## Zusammenfassung

| Datei | Aenderung |
|-------|-----------|
| `ConsumerLoanWidgets.tsx` | Widget immer rendern, bedingtes Styling |
| `FinanceRequestWidgets.tsx` | Widget immer rendern, bedingtes Styling |
| `PrivatkreditTab.tsx` | `activeCaseId` + `onSelectCase` Props durchreichen, Demo-Daten bei Klick laden |
