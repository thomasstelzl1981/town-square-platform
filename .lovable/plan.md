
# Fix: X-Frame-Options DENY entfernen

## Problem

In `vite.config.ts`, Zeile 18, steht:
```
"X-Frame-Options": "DENY"
```
Dieser Header verbietet dem Browser, die App in einem iframe zu laden. Lovable's Preview-Panel ist ein iframe — daher der graue Bildschirm.

## Loesung

Den Header fuer den Development-Server auf `SAMEORIGIN` aendern:

```
"X-Frame-Options": "SAMEORIGIN"
```

`SAMEORIGIN` erlaubt das Einbetten in iframes der gleichen Origin, blockiert aber weiterhin fremde Seiten. Das ist fuer die Entwicklung ausreichend sicher.

## Aenderung

**Datei:** `vite.config.ts`, Zeile 18

| Vorher | Nachher |
|--------|---------|
| `"X-Frame-Options": "DENY"` | `"X-Frame-Options": "SAMEORIGIN"` |

Keine weiteren Dateien betroffen. Der `SECURITY.md`-Hinweis auf Produktions-Header bleibt unveraendert — in Produktion kann `DENY` weiterhin empfohlen werden, da dort kein iframe-Preview noetig ist.
