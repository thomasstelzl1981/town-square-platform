

# Systemweiter Stabilitaets-Check — Ergebnisse

## Status: Weitgehend produktionsreif mit 4 adressierbaren Schwachstellen

---

## A. BESTAETIGT — Kein Handlungsbedarf

| Bereich | Status |
|---------|--------|
| **Freeze-System** | Alle 23 Module, 6 Zone-3-Sites, 12 Engines, 6 Infra-Bereiche korrekt frozen |
| **Orphan-Cleanup** | Keine verwaisten Imports auf geloeschte Dateien (ArmstrongSidebar, KaufyPropertyCard, UnitDossierView etc.) |
| **Expose-SSOT** | 5/5 Seiten konsolidiert auf InvestmentExposeView |
| **RLS-Abdeckung** | 0 Tabellen ohne RLS-Policies (vollstaendige Abdeckung) |
| **Demo-Data-Governance** | Keine MOCK_/mockData/dummyData Verletzungen in Modul-Komponenten |
| **Golden Path Fail-States** | GP_FINANCE_Z3, GP_PET, GP_COMMISSION alle mit on_timeout + on_error ausgestattet |
| **Golden Path Validator** | DEV-only (import.meta.env.PROD return), keine Prod-Auswirkung |

---

## B. GEFUNDENE SCHWACHSTELLEN (4 Punkte)

### B1: Ungeschuetzte console.log in Produktion (MITTEL)

3 Dateien enthalten console.log OHNE `import.meta.env.DEV` Guard — diese leaken in Produktion:

| Datei | Zeilen | Inhalt |
|-------|--------|--------|
| `src/hooks/useImageSlotUpload.ts` | 56, 79 | Tenant-ID, Entity-ID, Storage-Pfade |
| `src/hooks/useLennoxInitialSeed.ts` | 69, 75, 89, 105, 150, 184, 234 | Gallery-Seeding Fortschritt |
| `src/pages/portal/stammdaten/ProfilTab.tsx` | 302, 304 | User-ID, Tenant-ID, Slot-Keys |
| `src/pages/portal/projekte/InvestEngineTab.tsx` | 149 | Project-ID |

**Risiko:** Datenlecks (Tenant-IDs, User-IDs, Storage-Pfade) in Browser-Konsole von Endnutzern. Verstoesst gegen Governance-Regel "Webhook and Token Hardening Standard".

**Fix:** Alle 11 console.log-Aufrufe in `import.meta.env.DEV` Guards einwickeln. Betrifft:
- UNFREEZE INFRA-shared_investment (nein — useImageSlotUpload liegt in hooks, nicht frozen)
- Hooks und Pages sind NICHT in frozen Pfaden, koennen direkt editiert werden

---

### B2: React forwardRef Warning (NIEDRIG)

```
Warning: Function components cannot be given refs.
Check the render method of `ManifestRouter` → AreaOverviewPage
Check the render method of `AreaOverviewPage` → AreaModuleCard
```

**Ursache:** `AreaOverviewPage` wird via `React.lazy()` geladen und `AreaModuleCard` erhaelt einen ref-Durchleitungsversuch. Keine funktionale Auswirkung, aber verunreinigt die Konsole.

**Fix:** `React.forwardRef()` um AreaOverviewPage wickeln oder den ref-Pass im ManifestRouter entfernen. Da AreaOverviewPage in keinem frozen Pfad liegt, direkt editierbar.

---

### B3: RLS "Always True" Policies — Bewertung (NIEDRIG)

Der Linter meldet 4 WARN fuer permissive Policies. Analyse zeigt:

| Tabelle | Policy | Cmd | Bewertung |
|---------|--------|-----|-----------|
| mail_campaign_* (3 Tabellen) | Service role full access | ALL | **OK** — Service-Role-Only, kein Anon-Zugriff |
| user_outbound_identities | Service role full access | ALL | **OK** — Service-Role-Only |
| pet_z1_booking_requests | anon_insert | INSERT | **Akzeptabel** — Zone 3 Buchungsformular, absichtlich offen |
| zone3_website_settings | INSERT/UPDATE auth | INSERT/UPDATE | **Pruefenswert** — jeder authentifizierte User kann Settings fuer jede Zone 3 Site aendern |

**Einziger Kandidat:** `zone3_website_settings` — INSERT und UPDATE mit `true` statt Tenant-Scoping. Wenn nur Admins Website-Settings aendern duerfen sollten, muss die Policy verschaerft werden.

---

### B4: Auth-Konfiguration Warnings (NIEDRIG)

- **OTP Expiry zu lang:** Standard-Empfehlung ist 5 Minuten; aktuell laenger konfiguriert
- **Leaked Password Protection deaktiviert:** HaveIBeenPwned-Check nicht aktiv

**Fix:** Konfigurationsaenderung im Auth-System, keine Code-Aenderung noetig.

---

## C. ZUSAMMENFASSUNG

```text
PRODUKTIONSREIF:
✅ Alle Module frozen und stabil
✅ RLS-Abdeckung 100%
✅ Expose-SSOT konsolidiert (5/5)
✅ Golden Path Fail-States vollstaendig
✅ Demo-Data-Governance eingehalten
✅ Keine verwaisten Dateien/Imports

STABILISIERUNG EMPFOHLEN:
⬜ B1: 11 console.log Guards einbauen (useImageSlotUpload, useLennoxInitialSeed, ProfilTab, InvestEngineTab)
⬜ B2: forwardRef Warning beheben (AreaOverviewPage)
⬜ B3: zone3_website_settings RLS verschaerfen (optional)
⬜ B4: Auth OTP Expiry + Leaked Password Protection (optional)
⬜ Regel F in Custom Knowledge eintragen (manuell)
```

### Umsetzungsplan (nach Freigabe)

**Phase 1 — Console.log Hardening (kein Unfreeze noetig):**
- `useImageSlotUpload.ts`: 2 Zeilen wrappen
- `useLennoxInitialSeed.ts`: 7 Zeilen wrappen
- `ProfilTab.tsx`: 2 Zeilen wrappen
- `InvestEngineTab.tsx`: 1 Zeile wrappen

**Phase 2 — forwardRef Fix (kein Unfreeze noetig):**
- `AreaOverviewPage.tsx`: `React.forwardRef()` hinzufuegen

**Phase 3 — RLS Hardening (optional, UNFREEZE INFRA-edge_functions noetig):**
- `zone3_website_settings` INSERT/UPDATE Policies auf Tenant-Scoping umstellen

