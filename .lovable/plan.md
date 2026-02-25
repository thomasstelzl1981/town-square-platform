

## P0.1: Exposé Engine Silent-Fail Fix (diagnostisch)

### Status: IMPLEMENTIERT — wartet auf Test

### Änderungen in `supabase/functions/sot-project-intake/index.ts`:

| Änderung | Vorher | Nachher |
|----------|--------|---------|
| `max_tokens` | 4000 | 8000 |
| `temperature` | nicht gesetzt | 0.1 |
| `tool_choice` | forced (hardcoded) | Toggle via `EXPOSE_TOOL_CHOICE` Env (default: "auto") |
| Tool-Schema | 15+ Felder inkl. `extractedUnits[]` | 14 Felder, nur Metadaten + `summary` |
| System-Prompt | 12 Zeilen, fordert Units-Extraktion | 8 Zeilen, nur Metadaten, explizit "IMMER Tool aufrufen" |
| Logging | minimal | Structured `[expose-diag]` mit model, finish_reason, usage, pdf_size |
| Silent Fail | verschluckt (kein Log) | expliziter Status `ExposeParseEmpty`, Error-Log |
| Response | `{ success, extractedData }` | `{ success, extractedData, exposeStatus }` |

### Nächster Schritt

Test mit Menden-Exposé PDF:
1. Run mit `EXPOSE_TOOL_CHOICE=auto` (default) — Logs prüfen
2. Falls nötig: Run mit `EXPOSE_TOOL_CHOICE=forced` — Vergleich

### Entscheidung nach Test

- Falls `auto` liefert tool_calls → kein Fallback nötig, fertig
- Falls `auto` liefert content aber keine tool_calls → content-Fallback reicht
- Falls beides leer → Phase 2 Fallback (PDF→Text→Tool-Calling) nötig
