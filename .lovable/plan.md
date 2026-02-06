
# MOD-07 Anfrage: Routing-Reparaturplan

## Problem-Diagnose

### Aktueller Zustand (Screenshot zeigt)
- **Route:** `/portal/finanzierung/anfrage`
- **Komponente:** `AnfrageTab.tsx` — zeigt eine **Liste** der bestehenden `finance_requests`
- **Anzeige:** "Leipziger Straße 42, Leipzig" (Musterdaten aus der DB)
- **Gewünscht:** Das durchscrollbare Formular mit den 4 Sektionen (wie in PDF)

### Ursache
Das `AnfrageFormV2.tsx` (4-Sektionen-Formular) wird nur auf der **Detail-Route** `/portal/finanzierung/anfrage/:requestId` gerendert, nicht auf der Hauptseite.

### Architektur-Entscheidung

Es gibt zwei mögliche Ansätze:

| Ansatz | Beschreibung | Empfehlung |
|--------|--------------|------------|
| **A) Liste + Detail** | `/anfrage` = Liste, `/anfrage/:id` = Formular | Aktueller Stand |
| **B) Direkter Einstieg** | `/anfrage` = Formular (auto-erstellt oder lädt letzte Draft-Anfrage) | **EMPFOHLEN** |

**Entscheidung für Ansatz B:** Der User will direkt das Formular sehen, keine Liste.

---

## Reparaturplan

### Phase 1: AnfrageTab.tsx umbau

Die Komponente `AnfrageTab.tsx` wird so umgebaut, dass sie:

1. **Prüft ob eine Draft-Anfrage existiert** — Wenn ja, diese direkt laden und im Formular anzeigen
2. **Falls keine existiert** — Automatisch eine neue erstellen (mit optionaler Objektauswahl aus MOD-04)
3. **Das `AnfrageFormV2` direkt einbetten** — Kein Redirect mehr nötig

```text
NEUER FLOW:

/portal/finanzierung/anfrage
├── Gibt es eine draft-Anfrage?
│   ├── JA → AnfrageFormV2 direkt rendern
│   └── NEIN → "Anfrage erstellen"-Dialog zeigen
│              → Nach Erstellung: AnfrageFormV2 rendern
```

### Phase 2: Legacy-Komponenten löschen

Folgende Dateien werden entfernt:

| Datei | Grund |
|-------|-------|
| `src/components/finanzierung/FinanceRequestList.tsx` | Ersetzt durch neue AnfrageTab-Logik |
| `src/components/finanzierung/FinanceRequestDetail.tsx` | Ersetzt durch AnfrageFormV2 |
| `src/components/finanzierung/ObjectSelector.tsx` | Logik ist jetzt in AnfrageFormV2 integriert |
| `src/components/finanzierung/SelbstauskunftForm.tsx` | Ersetzt durch SelbstauskunftFormV2 |

### Phase 3: Export-Bereinigung

Datei `src/components/finanzierung/index.ts` aktualisieren:

```typescript
// VORHER (alt)
export { SelbstauskunftForm } from './SelbstauskunftForm';
export { FinanceRequestList } from './FinanceRequestList';
export { FinanceRequestDetail } from './FinanceRequestDetail';
export { ObjectSelector } from './ObjectSelector';

// NACHHER (neu)
// Diese Exporte werden ENTFERNT
```

### Phase 4: AnfrageDetailPage behalten

Die Route `/portal/finanzierung/anfrage/:requestId` bleibt bestehen für:
- Direktlinks zu spezifischen Anfragen
- Navigation aus Zone 1 (FutureRoom)
- Historische Anfragen (nicht nur Draft)

---

## Technische Umsetzung

### Neue AnfrageTab-Logik

```typescript
// Pseudo-Code für AnfrageTab.tsx (neu)

export default function AnfrageTab() {
  // 1. Lade die aktuellste Draft-Anfrage (falls vorhanden)
  const { data: draftRequest } = useQuery({
    queryKey: ['draft-finance-request', tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from('finance_requests')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // 2. Falls Draft existiert → Formular direkt zeigen
  if (draftRequest) {
    return <AnfrageFormV2 requestId={draftRequest.id} />;
  }

  // 3. Falls kein Draft → Dialog zur Erstellung zeigen
  return (
    <CreateRequestWizard onCreated={(id) => {
      // Nach Erstellung: Formular rendern (über State oder Refetch)
    }} />
  );
}
```

### Property-Selector in AnfrageFormV2

Die Möglichkeit "Objekt aus MOD-04 auswählen" ist **bereits implementiert** im AnfrageFormV2:
- Dropdown "Objekt aus Portfolio übernehmen?" (Zeile 418-445 in AnfrageFormV2.tsx)
- Funktion `prefillFromProperty()` (Zeile 360-377)

---

## Dateien die geändert werden

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/finanzierung/AnfrageTab.tsx` | **UMBAU** — Draft-First-Logik |
| `src/components/finanzierung/index.ts` | **BEREINIGEN** — Legacy-Exporte entfernen |
| `src/components/finanzierung/FinanceRequestList.tsx` | **LÖSCHEN** |
| `src/components/finanzierung/FinanceRequestDetail.tsx` | **LÖSCHEN** |
| `src/components/finanzierung/ObjectSelector.tsx` | **LÖSCHEN** |
| `src/components/finanzierung/SelbstauskunftForm.tsx` | **LÖSCHEN** |

---

## Erwartetes Ergebnis

Nach der Reparatur:

1. **Klick auf "Anfrage"** → Zeigt sofort das 4-Sektionen-Formular (wie PDF)
2. **Falls keine Anfrage existiert** → Kurzer Wizard zur Objektauswahl, dann Formular
3. **MOD-04 Integration** → "Objekt aus Portfolio" Dropdown funktioniert
4. **Keine Liste mehr** — Die Listenansicht mit "Leipziger Straße..." verschwindet
5. **Sauberer Code** — 4 Legacy-Dateien gelöscht

---

## Zusammenfassung der Änderungen

```text
ROUTING (bleibt gleich):
/portal/finanzierung/anfrage        → AnfrageTab (UMGEBAUT)
/portal/finanzierung/anfrage/:id    → AnfrageDetailPage (UNVERÄNDERT)

KOMPONENTEN:
AnfrageTab.tsx     → Zeigt jetzt direkt AnfrageFormV2 (Draft-First)
AnfrageFormV2.tsx  → Unverändert (bereits korrekt implementiert)
4 Legacy-Dateien   → GELÖSCHT
```
