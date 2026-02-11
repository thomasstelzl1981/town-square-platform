
# Praesentation-Sicherheitscheck MOD-13: Kritischer Bug gefunden

## Kritischer Bug: Base64-Konvertierung stuerzt bei normalen PDFs ab

**Schweregrad: SHOWSTOPPER**

In `supabase/functions/sot-project-intake/index.ts` gibt es auf **Zeile 166** und **Zeile 289** folgenden Code:

```text
const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
```

Der Spread-Operator (`...`) uebergibt jedes einzelne Byte als separates Argument an `String.fromCharCode()`. Bei einem typischen Expose-PDF von 1-5 MB bedeutet das **1.000.000 bis 5.000.000 einzelne Argumente**. Die V8-Engine (Deno) hat ein Limit von ca. 65.000-500.000 Argumenten. Das Ergebnis: **`RangeError: Maximum call stack size exceeded`** -- die KI-Analyse bricht ab, kein Projekt wird erstellt.

Betroffen:
- Zeile 166: Expose-PDF Base64-Konvertierung
- Zeile 289: Preisliste Base64-Konvertierung

### Reparatur

Beide Stellen muessen durch eine chunked Base64-Konvertierung ersetzt werden. Der fix ist eine Hilfsfunktion, die die Bytes in kleinen Bloecken (8192 Bytes) verarbeitet:

```text
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
```

### Aenderungen

| Datei | Zeile | Aenderung |
|-------|-------|-----------|
| `sot-project-intake/index.ts` | 10-17 | Neue Hilfsfunktion `uint8ToBase64()` einfuegen |
| `sot-project-intake/index.ts` | 166 | `btoa(String.fromCharCode(...))` ersetzen durch `uint8ToBase64(new Uint8Array(buffer))` |
| `sot-project-intake/index.ts` | 289 | Gleiche Ersetzung fuer Preisliste |

---

## Restlicher Pfad: Bestaetigt funktional

| Schritt | Status |
|---------|--------|
| Dropzone fuer Expose (PDF) und Preisliste (XLSX/CSV/PDF) | OK |
| Upload via `useUniversalUpload` in `tenant-documents` Bucket | OK |
| Storage-Pfad: `{tenantId}/MOD_13/{filename}` | OK |
| Edge Function Download aus `tenant-documents` | OK |
| KI-Analyse Prompt und JSON-Parsing | OK (nach Base64-Fix) |
| Review-Step mit editierbaren Feldern | OK |
| Projektanlage mit `public_id` Trigger und `project_code` | OK |
| Units Bulk-Insert | OK |
| Storage-Tree Seeding unter `MOD_13/{project_code}` | OK |
| Demo-Projekt bleibt als erste Kachel | OK |
| Vertriebsaktivierung (Toggle 1: Partner-Netzwerk) | OK |
| Kaufy-Toggle (Toggle 2) | OK |
| Zone 1 Sales Desk mit Kill-Switch | OK |
| Provision nur fuer `sold`/`notary` Units | OK |

---

## Zusammenfassung

**1 kritischer Bug** muss vor der Praesentation behoben werden. Nach dem Fix der Base64-Konvertierung ist der gesamte Golden Path stabil. Die Reparatur betrifft nur eine einzige Datei (`sot-project-intake/index.ts`) mit 3 kleinen Aenderungen.
