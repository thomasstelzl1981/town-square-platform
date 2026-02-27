

## Fix: Retry-Logik für AI Gateway 502/503-Fehler

### Problem
Die AI-Gateway gibt sporadisch `502 Bad Gateway` zurück. Die Edge Function behandelt das als finalen Fehler → Import bricht ab.

### Lösung
Retry-Loop mit exponential backoff für transiente Fehler (502, 503, 504).

### Datei: `supabase/functions/sot-excel-ai-import/index.ts`

**Änderung an Zeile ~110-208:** AI-Aufruf in Retry-Schleife wrappen:

```typescript
// Retry logic for transient gateway errors
const MAX_RETRIES = 3;
let response: Response | null = null;
let lastError = "";

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  console.log(`[sot-excel-ai-import] AI request attempt ${attempt}/${MAX_RETRIES}`);
  
  response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { ... });
  
  if (response.ok || response.status === 429 || response.status === 402) break;
  
  if ([502, 503, 504].includes(response.status)) {
    lastError = `Gateway error ${response.status}`;
    console.warn(`[sot-excel-ai-import] ${lastError}, retrying in ${attempt * 2}s...`);
    if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 2000));
    continue;
  }
  
  // Other errors: don't retry
  break;
}
```

- Maximal 3 Versuche mit 2s/4s/6s Wartezeit
- Nur bei 502/503/504 wiederholen
- 429/402 sofort mit spezifischer Fehlermeldung zurückgeben
- Letzte Fehlermeldung im Response zurückgeben falls alle Retries fehlschlagen

### Freeze-Check
- `supabase/functions/*`: nicht eingefroren ✅

