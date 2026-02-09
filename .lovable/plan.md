

# Fix: Suchparameter bei Navigation erhalten (URL-State)

## Problem

Wenn man vom Immobilien-Exposé zurück zur Suche navigiert, landet man auf einer leeren Home-Seite und muss erneut suchen. Die Suchparameter (zvE, Eigenkapital, Familienstand) gehen verloren.

## Ursache

Die Suchparameter werden aktuell nur in React `useState` gespeichert:
```tsx
const [hasSearched, setHasSearched] = useState(false);
const [searchParams, setSearchParams] = useState<SearchParams>({...});
```

Beim Navigieren zu `/kaufy2026/immobilien/:id` und zurück wird die Komponente neu gemountet → State geht verloren.

## Lösung: URL-basierter State mit Query-Strings

Die Suchparameter werden in der URL gespeichert:
```
/kaufy2026?zvE=60000&equity=50000&status=single&kirchensteuer=0&searched=1
```

### Vorteile
- Parameter bleiben beim Zurücknavigieren erhalten
- Deep-Linking möglich (Suche kann geteilt werden)
- Browser-Historie funktioniert korrekt

---

## Technische Umsetzung

### Datei 1: `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx`

**Änderungen:**
1. `useSearchParams` von react-router-dom importieren
2. Suchparameter aus URL lesen (beim Mount)
3. Suchparameter in URL schreiben (bei Suche)
4. `hasSearched` aus URL ableiten

**Vorher:**
```tsx
const [hasSearched, setHasSearched] = useState(false);
const [searchParams, setSearchParams] = useState<SearchParams>({
  zvE: 60000,
  equity: 50000,
  maritalStatus: 'single',
  hasChurchTax: false,
});
```

**Nachher:**
```tsx
import { useSearchParams } from 'react-router-dom';

// URL-Parameter lesen
const [urlParams, setUrlParams] = useSearchParams();

// State aus URL initialisieren
const getParamsFromUrl = (): SearchParams => ({
  zvE: parseInt(urlParams.get('zvE') || '60000', 10),
  equity: parseInt(urlParams.get('equity') || '50000', 10),
  maritalStatus: (urlParams.get('status') as 'single' | 'married') || 'single',
  hasChurchTax: urlParams.get('kirchensteuer') === '1',
});

const hasSearched = urlParams.get('searched') === '1';
const [searchParams, setSearchParams] = useState<SearchParams>(getParamsFromUrl());
```

**Suchfunktion aktualisieren:**
```tsx
const handleInvestmentSearch = useCallback(async (params: SearchParams) => {
  // Parameter in URL speichern
  setUrlParams({
    zvE: params.zvE.toString(),
    equity: params.equity.toString(),
    status: params.maritalStatus,
    kirchensteuer: params.hasChurchTax ? '1' : '0',
    searched: '1',
  });
  
  setSearchParams(params);
  // ... Rest der Logik
}, [calculate, refetch, setUrlParams]);
```

### Datei 2: `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx`

**Änderung:** "Zurück zur Suche"-Link erhält die ursprünglichen Suchparameter:

**Option A: URL-Parameter durchreichen**
```tsx
import { useSearchParams, Link } from 'react-router-dom';

// URL-Parameter vom Referrer beibehalten
const [urlParams] = useSearchParams();

// Link mit Parametern
<Link
  to={`/kaufy2026?${urlParams.toString()}`}
  className="..."
>
  <ArrowLeft className="w-4 h-4" />
  Zurück zur Suche
</Link>
```

**Option B: Browser-History nutzen (einfacher)**
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

<button
  onClick={() => navigate(-1)}  // Geht zur vorherigen Seite
  className="..."
>
  <ArrowLeft className="w-4 h-4" />
  Zurück zur Suche
</button>
```

**Empfehlung:** Option B ist einfacher und nutzt die native Browser-Historie.

### Datei 3: `src/components/zone3/kaufy2026/InvestmentResultTile` Link

**Aktualisieren:** Link zum Exposé muss die aktuellen Suchparameter in der URL beibehalten oder weitergeben.

---

## Ablauf nach der Änderung

```text
1. User öffnet /kaufy2026
   └─ URL: /kaufy2026

2. User sucht mit zvE=80000, Eigenkapital=40000
   └─ URL: /kaufy2026?zvE=80000&equity=40000&status=single&searched=1
   └─ Ergebnisse werden angezeigt

3. User klickt auf Objekt
   └─ URL: /kaufy2026/immobilien/mfh-berlin-kreuzberg

4. User klickt "Zurück zur Suche"
   └─ navigate(-1) → Browser geht zurück zu:
   └─ URL: /kaufy2026?zvE=80000&equity=40000&status=single&searched=1
   └─ Ergebnisse werden SOFORT wieder angezeigt ✓
```

---

## Geänderte Dateien

| # | Datei | Änderung |
|---|-------|----------|
| 1 | `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | `useSearchParams` für URL-State |
| 2 | `src/pages/zone3/kaufy2026/Kaufy2026Expose.tsx` | `navigate(-1)` statt `Link to="/"` |

---

## Akzeptanzkriterien

| # | Test | Erwartung |
|---|------|-----------|
| 1 | Suche durchführen | URL enthält Parameter (`?zvE=...&searched=1`) |
| 2 | Objekt öffnen, zurück klicken | Suchergebnisse sind sofort sichtbar |
| 3 | Seite refreshen nach Suche | Ergebnisse werden neu geladen |
| 4 | Neue Suche in URL einfügen | Funktioniert als Deep-Link |
| 5 | Home ohne Parameter öffnen | Leere Startseite wie bisher |

