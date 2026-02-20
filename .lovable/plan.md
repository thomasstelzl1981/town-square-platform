

# Fix: Preview-iframe funktioniert nicht (Grauer Bildschirm)

## Ursache

Der Header `X-Frame-Options: SAMEORIGIN` in `vite.config.ts` (Zeile 18) blockiert weiterhin das Preview. Grund: Der Lovable-Editor laeuft auf `lovable.dev`, das Preview auf `id-preview--*.lovable.app` — das sind **verschiedene Origins**. `SAMEORIGIN` erlaubt aber nur iframes von der exakt gleichen Origin.

Die vorherige Aenderung von `DENY` auf `SAMEORIGIN` war also nicht ausreichend.

## Loesung

Den `X-Frame-Options` Header komplett aus den Development-Server-Headers entfernen. Clickjacking-Schutz ist in der Entwicklungsumgebung nicht notwendig und blockiert das Lovable Preview.

## Aenderung

**Datei:** `vite.config.ts`, Zeile 18

Entfernen:
```
"X-Frame-Options": "SAMEORIGIN",
```

Die anderen Security-Headers (`X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`) bleiben bestehen — sie beeinflussen das iframe-Verhalten nicht.

## Hinweis fuer Produktion

Wenn die App spaeter deployed wird (z.B. ueber Lovable Publish oder einen eigenen Server), kann `X-Frame-Options: DENY` auf Produktionsebene (z.B. via Cloudflare, nginx, oder Vercel Headers) konfiguriert werden — dort gibt es kein iframe-Preview.

