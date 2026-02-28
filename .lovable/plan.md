

# Review des Codex-Audits — Faktencheck

## Bewertung: Teilweise korrekt, aber mehrere Befunde sind veraltet oder faktisch falsch

---

## Befund-für-Befund Verifikation

### 1. Zone-Boundary-Verstöße — FALSCH (bereits behoben)
Codex listet 8 Dateien mit direkten `@/components/armstrong/*`-Imports aus Zone 2/3.

**Realität:** Meine Suche über das gesamte `src/`-Verzeichnis (exkl. armstrong + admin) ergibt **null Treffer** für `@/components/armstrong`. Die genannten Dateien (`ComposeEmailDialog`, `MobileBottomBar`, etc.) importieren bereits korrekt aus:
- `@/components/shared/VoiceButton` (shared)
- `@/hooks/useArmstrongVoice` (Hooks sind erlaubt, keine Komponenten-Imports)
- `@/assets/logos/` (Assets, keine Zonen-Verletzung)

**Fazit:** Runde C (Boundary Cleanup) ist **nicht nötig** — bereits erledigt.

### 2. Legacy-Redirect Doppel-Konflikt — FALSCH
Codex behauptet Zone2Router enthält einen eigenen Redirect `leads/* -> /portal/provisionen`.

**Realität:** Zone2Router enthält nur einen **Kommentar** (Zeile 130): `{/* Legacy redirects handled by legacyRoutes ... */}`. Es gibt keinen aktiven Redirect-Code. Alle Legacy-Redirects laufen zentral über `legacyRoutes` in `routesManifest.ts`.

**Fazit:** P0-ARCH-001 (Redirect Harmonisierung) ist **nicht nötig** — kein Konflikt vorhanden.

### 3. Manifest-Test Drift (5 Failures) — VERMUTLICH FALSCH
Codex behauptet `manifestDrivenRoutes.test.ts` hat 5 Drift-Failures.

**Realität:** Die Testdatei zeigt bereits:
- Zeile 74: `expect(modules.length).toBe(23)` — korrekt
- Zeile 87: `MOD-01: 5` — korrekt (nicht 6)
- Zeile 99: `MOD-13: 6` — korrekt (nicht 5)
- Zeile 144: `expect(...).toBe(8)` — 8 Websites, korrekt
- Zeile 241: `expect(tileCount).toBe(111)` — korrekt

**Fazit:** Runde A (Test Drift beheben) ist **nicht nötig** — Tests sind bereits synchronisiert.

### 4. SSOT Drift TS vs YAML — KORREKT, aber irrelevant
Die YAML-Datei (`manifests/routes_manifest.yaml`) ist tatsächlich veraltet (20 Module vs 23 in TS). Dies ist aber bereits als **deprecated/reference-only** bekannt. Runtime-SSOT ist `routesManifest.ts`.

**Fazit:** Kein P0. Optionale Kennzeichnung der YAML als deprecated, aber kein Blocker.

### 5. sot-dms-upload-url Config/Code Drift — KORREKT
`supabase/config.toml` registriert `sot-dms-upload-url`, aber der Function-Ordner existiert nicht.

**Fazit:** Dies ist der **einzige echte P0-Fund** des gesamten Audits. Entweder Function anlegen oder Config-Eintrag entfernen.

### 6. Lint 1963 Findings — Möglich, aber kein Beta-Blocker
Lint-Debt ist typisch für ein Projekt dieser Größe (780+ Dateien). Kein Beta-Blocker, solange Build grün ist.

---

## Gesamtbewertung des Codex-Audits

| Befund | Codex-Status | Realität | Aktion nötig? |
|--------|-------------|----------|---------------|
| Zone-Boundary-Verstöße | RED P1 | Bereits behoben | Nein |
| Legacy-Redirect Konflikt | RED P0 | Kein Konflikt vorhanden | Nein |
| Test Drift (5 Failures) | RED P0 | Tests bereits aktuell | Nein |
| YAML vs TS Drift | RED P0 | Bekannt, YAML deprecated | Nein (optional Label) |
| sot-dms-upload-url Drift | RED P0 | Korrekt, Function fehlt | Ja |
| Lint 1963 Findings | RED | Tech Debt, kein Blocker | Nein (P2) |

**Von 6 Befunden ist 1 korrekt und actionable.** Die restlichen basieren auf veralteten Repo-Ständen oder falschen Annahmen.

---

## Empfehlung

### Einziger echter Fix: sot-dms-upload-url
- Config-Eintrag in `supabase/config.toml` entfernen (Function wurde nie als Datei angelegt, Upload läuft über Supabase Storage SDK direkt)
- Oder minimale Stub-Function anlegen

### Codex-Audit-Dokumente
Die 6 erstellten Markdown-Dateien unter `docs/audit/` wurden **nicht ins Repo committed** (sie sind nicht sichtbar). Das ist gut — sie sollten als externe Referenz behandelt werden, nicht als Repo-Artefakte.

### Runde A/B/C/D Prompts
- **Runde A:** Nicht nötig (Tests bereits synchron)
- **Runde B:** Einziger echter Fix (sot-dms-upload-url)
- **Runde C:** Nicht nötig (Boundaries bereits clean)
- **Runde D:** Optional, kein Beta-Blocker

