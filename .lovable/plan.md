

# Fix: React Error #310 in Finanzierung (Status & Privatkredit)

## Ursache

**React Error #310 = "Rendered more hooks than during the previous render"**

In `StatusTab.tsx` wird `useMutation` (Zeile 264) NACH zwei fruehen Returns aufgerufen (Zeile 240: Loading-State, Zeile 248: leere Daten). Das verletzt Reacts Hook-Regeln: Beim ersten Render (isLoading=true) wird der Hook uebersprungen, beim naechsten Render (Daten geladen) wird er ausgefuehrt -- React erkennt die unterschiedliche Hook-Anzahl und wirft Error #310.

Der Privatkredit-Tab hat keinen Code-Fehler. Der Crash dort haengt vermutlich mit den gemeldeten Supabase-Infrastrukturproblemen zusammen oder mit einem kaskadierenden ErrorBoundary-State.

**Das ist KEIN Server-Problem, sondern ein Code-Bug.**

## Loesung

### StatusTab.tsx: useMutation vor die Early Returns verschieben

Die `useMutation`-Deklaration (Zeilen 264-287) muss nach oben verschoben werden -- direkt nach den anderen Hooks (`useQuery`, `useMemo`), also vor Zeile 240.

Die fruehen Returns fuer Loading und leere Daten bleiben bestehen, werden aber jetzt erst NACH allen Hook-Aufrufen ausgefuehrt.

### Konkrete Aenderung

```typescript
// VORHER (fehlerhaft):
// ... useQuery, useMemo ...
if (isLoading) return <Loading />;        // <-- Early return
if (!requests) return <EmptyState />;     // <-- Early return
const deleteMutation = useMutation({...}); // <-- HOOK NACH RETURN = BUG

// NACHHER (korrekt):
// ... useQuery, useMemo ...
const deleteMutation = useMutation({...}); // <-- Hook VOR Early Returns
if (isLoading) return <Loading />;
if (!requests) return <EmptyState />;
```

### Keine Aenderung noetig

- **PrivatkreditTab**: Kein Hook-Fehler im Code. Sollte nach dem StatusTab-Fix und Stabilisierung der Infrastruktur funktionieren.
- **Alle anderen Finanzierungs-Tabs** (Selbstauskunft, Dokumente, Anfrage): Keine Aenderungen noetig.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/finanzierung/StatusTab.tsx` | `useMutation` Block von Zeile 264 nach oben verschieben (vor die Early Returns) |

