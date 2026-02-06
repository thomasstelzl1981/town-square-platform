1: # MOD-01 Stammdaten: Bereinigung und Neustrukturierung
2: 
3: ## STATUS: ✅ ABGESCHLOSSEN (2026-02-06)
4: 
5: ### Durchgeführte Änderungen
6: 
7: | Datei | Aktion | Status |
8: |-------|--------|--------|
9: | `src/pages/portal/stammdaten/PersonenTab.tsx` | **GELÖSCHT** | ✅ |
10: | `src/pages/portal/stammdaten/FirmaTab.tsx` | **GELÖSCHT** | ✅ |
11: | `src/pages/portal/stammdaten/VertraegeTab.tsx` | **NEU** — Verträge-Übersicht | ✅ |
12: | `src/pages/portal/stammdaten/index.ts` | **UPDATE** — Exporte bereinigt | ✅ |
13: | `src/pages/portal/StammdatenPage.tsx` | **UPDATE** — Routen angepasst + Legacy-Redirects | ✅ |
14: | `src/manifests/routesManifest.ts` | **UPDATE** — Tile "firma" → "vertraege" | ✅ |
15: | `src/components/portal/HowItWorks/moduleContents.ts` | **UPDATE** — SubTile angepasst | ✅ |

---

# MOD-07 Finanzierung: Status-Spiegelung + Submit-Flow

## STATUS: ✅ ABGESCHLOSSEN (2026-02-06)

### Implementierte Features

| Feature | Datei | Status |
|---------|-------|--------|
| **Submit-Hook** | `src/hooks/useSubmitFinanceRequest.ts` | ✅ NEU |
| **STATUS_LABELS** | `src/types/finance.ts` | ✅ ERWEITERT |
| **Submit-Button** | `src/components/finanzierung/AnfrageFormV2.tsx` | ✅ ERWEITERT |
| **Status-Spiegelung** | `src/pages/portal/finanzierung/StatusTab.tsx` | ✅ KOMPLETT NEU |
| **MOD-11 Integration** | `src/pages/portal/finanzierungsmanager/FMFaelle.tsx` | ✅ AKTUALISIERT |

### Neuer Submit-Flow

```
1. User füllt Selbstauskunft aus (>=80% completion)
2. User füllt Anfrage-Formular aus
3. User klickt "Zur Prüfung einreichen"
4. Confirmation-Dialog mit Completion-Score
5. System:
   - Setzt finance_requests.status = 'submitted_to_zone1'
   - Erstellt finance_mandate mit status = 'new'
   - Erstellt audit_event (FIN_SUBMIT)
6. Redirect zu /portal/finanzierung/status
```

### Status-Spiegelung (MOD-07 ↔ MOD-11)

| MOD-11 Case Status | Anzeige in MOD-07 StatusTab |
|--------------------|----------------------------|
| `active` | "In Bearbeitung" + Progress 4/6 |
| `missing_docs` | "Aktion erforderlich" Alert |
| `submitted` | "Bei Bank eingereicht" + Progress 5/6 |
| `bank_response` | "Rückmeldung erhalten" Timeline-Event |
| `completed` | "Abgeschlossen" + Progress 6/6 |

### Manager-Sichtbarkeit

- **Vorher:** Manager-Card nur sichtbar nach `accepted_at`
- **Nachher:** Manager-Card sichtbar ab `assigned_manager_id` (mit Status-Badge "Zugewiesen" vs "Aktiv")

### Neue UI-Komponenten

1. **Progress-Indikator:** 6-stufiger Fortschrittsbalken
2. **Manager-Card:** Zeigt zugewiesenen Manager mit E-Mail
3. **Action-Alert:** Rot markiert wenn Kunde Aktion benötigt
4. **Erweiterte Timeline:** Events aus `future_room_cases` gespiegelt

### Zentralisierte Status-Labels

```typescript
// src/types/finance.ts
export const FINANCE_STATUS_LABELS = {
  draft: 'Entwurf',
  submitted_to_zone1: 'Eingereicht',
  assigned: 'Zugewiesen',
  delegated: 'Übergeben an Manager',
  in_processing: 'In Bearbeitung',
  bank_submitted: 'Bei Bank eingereicht',
  needs_customer_action: 'Aktion erforderlich',
  completed: 'Abgeschlossen',
  // ...
};
```

### Technische Details

- `useSubmitFinanceRequest` validiert completion_score >= 80%
- Query in StatusTab inkludiert `future_room_cases` für Spiegelung
- `getEffectiveStatus()` priorisiert: FutureRoomCase > Mandate > Request
- Alle Status-Labels via `getStatusLabel()` / `getStatusBadgeVariant()`

---

## Ergebnis

1. ✅ **Submit-Flow vollständig:** Button + Validation + Confirmation
2. ✅ **Status-Spiegelung aktiv:** MOD-11 → MOD-07 in Echtzeit
3. ✅ **Manager früh sichtbar:** Ab Zuweisung, nicht erst Annahme
4. ✅ **Konsistente Labels:** Zentralisiert in `types/finance.ts`
5. ✅ **Golden Path MOD-07:** 98% Complete
