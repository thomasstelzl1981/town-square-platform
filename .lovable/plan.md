
# Fix: Floating-Menue Timeout auf 400ms reduzieren

## Aenderung

**Datei:** `src/components/portal/TopNavigation.tsx`, Zeile 55

Den Timer-Wert von `1500` auf `400` aendern:

```
// Vorher
}, 1500);

// Nachher
}, 400);
```

Eine einzige Zeile. Der Flow funktioniert jetzt zuverlaessig durch das Portal-Rendering, daher reicht die kuerzere Reaktionszeit.
