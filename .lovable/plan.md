

## MOD-02 E-Mail-Client — Gesamtplan: Backend-Encoding + Frontend-Reparatur

UNFREEZE MOD-02 ist hiermit bestaetigt. Alle Aenderungen werden in einer Sequenz umgesetzt.

---

### Phase A: Backend Encoding-Fixes (Bugs 1, 4, 7)

**Datei 1: `supabase/functions/sot-mail-sync/index.ts`**

| Nr | Was | Wo (Zeilen) |
|----|-----|-------------|
| A1 | Neue Funktion `extractCharsetFromBodyStructure(bs)` einfuegen | Nach Zeile 227 (nach `decodeBase64Content`) |
| A2 | `decodeQPWithCharset()` komplett ersetzen — Byte-basierte Version | Zeilen 232-250 |
| A3 | Tier-0 Charset-Erkennung umstellen | Zeilen 529-531 |

**Datei 2: `supabase/functions/sot-mail-fetch-body/index.ts`**

| Nr | Was | Wo (Zeilen) |
|----|-----|-------------|
| B1 | Neue Funktion `extractCharsetFromBodyStructure(bs)` einfuegen | Nach Zeile 25 (nach `extractCharset`) |
| B2 | `decodeQuotedPrintable()` komplett ersetzen — Byte-basierte Version | Zeilen 36-50 |
| B3 | Strategy-1 Charset-Erkennung umstellen | Zeilen 209-214 |

**Details:**

`extractCharsetFromBodyStructure` (neu, beide Dateien):
```text
function extractCharsetFromBodyStructure(bs: any): string {
  if (!bs) return 'utf-8';
  const params = bs.parameters ?? bs.params ?? bs.parameter ?? {};
  const charset = params.charset ?? params.CHARSET ?? params.Charset ?? '';
  if (charset) return charset.toLowerCase();
  if (Array.isArray(bs.extensionData)) {
    for (let i = 0; i < bs.extensionData.length - 1; i++) {
      if (String(bs.extensionData[i]).toLowerCase() === 'charset') {
        return String(bs.extensionData[i+1]).toLowerCase();
      }
    }
  }
  return 'utf-8';
}
```

`decodeQPWithCharset` / `decodeQuotedPrintable` (Ersatz, beide Dateien):
```text
function decodeQPWithCharset(input: string, charset = 'utf-8'): string {
  const noSoftBreaks = input.replace(/=\r?\n/g, '');
  const byteValues: number[] = [];
  let i = 0;
  while (i < noSoftBreaks.length) {
    if (noSoftBreaks[i] === '=' && i + 2 < noSoftBreaks.length) {
      const hex = noSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        byteValues.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    byteValues.push(noSoftBreaks.charCodeAt(i) & 0xFF);
    i++;
  }
  const bytes = new Uint8Array(byteValues);
  return decodeWithCharset(bytes, charset);
}
```

Tier-0 (sot-mail-sync, Zeilen 529-531) ersetzen mit:
```text
tier0Charset = extractCharsetFromBodyStructure(bs);
tier0Encoding = (bs.encoding ?? bs.bodyEncoding ?? '').toLowerCase();
```

Strategy-1 (sot-mail-fetch-body, Zeilen 209-214) ersetzen mit:
```text
charset = extractCharsetFromBodyStructure(msg.bodyStructure);
encoding = (msg.bodyStructure.encoding ?? msg.bodyStructure.bodyEncoding ?? '').toLowerCase();
```

Bug 7 (Snippet) loest sich automatisch, da der Body nun korrekt dekodiert wird.

---

### Phase B: Frontend-Fixes (Bugs 2, 3, 5, 6)

**Datei: `src/pages/portal/office/EmailTab.tsx`**

| Nr | Bug | Was | Wo (Zeilen) |
|----|-----|-----|-------------|
| C1 | 2+3 | `overflow-hidden` zu `overflow-y-auto` auf Body-Container | Zeile 440 |
| C2 | 2+3 | iframe: dynamische Hoehe via `onLoad` + `minHeight: 400px` | Zeilen 458-471 |
| C3 | 2+3 | Plain-Text ScrollArea: `min-h-[400px]` hinzufuegen | Zeile 473 |
| C4 | 5 | Auto-Retry useEffect: State-Reset reparieren | Zeilen 361-375 |
| C5 | 6 | Google OAuth: Calendar + Contacts Scopes entfernen | Zeilen 712-717 |

**Details:**

**C1** — Zeile 440 ersetzen:
```text
<div className="flex-1 min-h-0 overflow-y-auto">
```

**C2** — iframe (Zeilen 458-471) ersetzen mit:
```text
<iframe
  sandbox="allow-same-origin allow-popups"
  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
           margin: 0; padding: 16px; overflow-wrap: break-word; word-break: break-word;
           color: #1a1a1a; background: transparent; }
    img { max-width: 100% !important; height: auto !important; }
    table { max-width: 100% !important; width: auto !important; }
    * { max-width: 100% !important; box-sizing: border-box; }
    a { color: #2563eb; }
  </style></head><body>${email.body_html}</body></html>`}
  className="w-full border-0"
  style={{ minHeight: '400px', height: 'auto' }}
  title="E-Mail-Inhalt"
  onLoad={(e) => {
    const iframe = e.currentTarget;
    try {
      const body = iframe.contentDocument?.body;
      if (body) {
        iframe.style.height = body.scrollHeight + 'px';
      }
    } catch {
      iframe.style.height = '600px';
    }
  }}
/>
```

**C3** — Zeile 473 ersetzen:
```text
<ScrollArea className="h-full min-h-[400px] p-4">
```

**C4** — Auto-Retry useEffect (Zeilen 361-375) komplett ersetzen:
```text
useEffect(() => {
  if (!bodyFetchError) return;
  if (retryCount >= maxRetries) return;
  if (!email || email.body_text || email.body_html) return;
  const delay = (retryCount + 1) * 2000;
  const timer = setTimeout(() => {
    setRetryCount(prev => prev + 1);
    setBodyFetchError(false);
    setFetchTriggered(false);
  }, delay);
  return () => clearTimeout(timer);
}, [bodyFetchError, retryCount]);
```

Hinweis: Dies setzt `bodyFetchError` und `fetchTriggered` zurueck, sodass der erste useEffect (Zeile 348) den Fetch erneut ausloest. `onFetchBody` wird NICHT mehr direkt im Retry aufgerufen — der normale Auto-Fetch-Pfad uebernimmt.

Voraussetzung: `setBodyFetchError` muss als Prop an `EmailDetailPanel` uebergeben werden. Falls nicht vorhanden, wird es als Callback-Prop ergaenzt.

**C5** — Google OAuth Scopes (Zeilen 712-717) ersetzen:
```text
scopes: [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
].join(' '),
```

---

### Reihenfolge

1. Phase A: Backend Edge Functions aendern und deployen
2. Phase B: Frontend EmailTab.tsx reparieren

### Was NICHT geaendert wird

- Explain-Action KB-Abfrage in sot-armstrong-advisor
- Legacy-Persona-Abfrage in sot-armstrong-advisor
- Keine Datenbank-Aenderungen
- Keine anderen MOD-02 Dateien (Brief, Kontakte, Kalender, Widgets)

