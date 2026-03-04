

## Armstrong Info Page — Redesign-Konzept

### Ist-Zustand (Probleme)

Die Seite `/portal/armstrong` ist aktuell eine lange Scroll-Wüste mit 7 Sektionen:
1. Hero + 3 USP-Cards
2. "Wie Armstrong arbeitet" (3-Step)
3. KostenDashboard (4 KPI-Cards + Top-5-Liste)
4. SystemPreisliste (KI-Aktionen + Infra-Services — bereits collapsible intern)
5. 3 Add-On Cards (Email-Enrichment, WhatsApp, Registry-Import)
6. AktionsKatalog (4 KPI-Cards + Filter + Card-Grid aller Aktionen)
7. CTA-Card

**Hauptprobleme:**
- **Redundanz**: SystemPreisliste und AktionsKatalog zeigen beide Armstrong-Aktionen — einmal als Preistabelle, einmal als Card-Grid mit Filtern. Die Preisliste zeigt Credits, der Katalog zeigt Modul-Badges und Status. Das gehört zusammen.
- **Modulnummern sichtbar**: `MOD-04`, `MOD-14` etc. als Badges in den Action-Cards — interne Kennungen, die der User nicht sehen soll.
- **Keine Collapsibles**: Alles ist offen, die Seite wirkt überladen.
- **KPI-Dopplung**: KostenDashboard hat 4 KPIs, AktionsKatalog hat nochmal 4 KPIs.

---

### Neues Konzept: 5 Collapsible-Sektionen

```text
┌─────────────────────────────────────┐
│  Hero (bleibt)                      │
│  3 USP-Cards (bleibt)               │
├─────────────────────────────────────┤
│ ▶ Wie Armstrong arbeitet            │  ← Collapsible, default geschlossen
├─────────────────────────────────────┤
│ ▼ Verbrauch & Kosten                │  ← Collapsible, default offen
│   KostenDashboard (wie bisher)      │
├─────────────────────────────────────┤
│ ▶ Aktionen & Preise                 │  ← KONSOLIDIERT, Collapsible
│   Vereint: AktionsKatalog +         │
│   SystemPreisliste in einem Block   │
├─────────────────────────────────────┤
│ ▶ Services & Add-Ons                │  ← Collapsible
│   Email, WhatsApp, Registry-Import  │
├─────────────────────────────────────┤
│  CTA (bleibt)                       │
└─────────────────────────────────────┘
```

---

### Änderungen

**Datei: `src/pages/portal/ArmstrongInfoPage.tsx`**

1. **Collapsible-Wrapper** für jede Sektion: Nutzt `<Collapsible>` aus `@radix-ui/react-collapsible` (bereits installiert). Jede Sektion bekommt einen klickbaren Header mit Chevron-Icon.
   - "Wie Armstrong arbeitet" → default **geschlossen**
   - "Verbrauch & Kosten" → default **offen**
   - "Aktionen & Preise" → default **geschlossen**
   - "Services & Add-Ons" → default **geschlossen**

2. **Konsolidierung**: AktionsKatalog und SystemPreisliste werden zu einer einzigen Sektion "Aktionen & Preise". Aufbau:
   - Filter-Bar (Suche + Zone + Status) oben
   - Darunter: Action-Cards wie bisher, aber **mit Credit-Preis** direkt in der Card (aus `cost_hint_cents`)
   - Infra-Services als separate Unter-Collapsible "System-Services" am Ende
   - Die 4 KPI-Cards des AktionsKatalogs (Gesamt/Aktiv/Eingeschränkt/Deaktiviert) entfallen — die Info steckt im Filter

3. **Modulnummern entfernen**: In `AktionsKatalog.tsx` das `module`-Badge (`MOD-XX`) aus den Action-Cards entfernen. Stattdessen den Modulnamen als lesbaren Text anzeigen (z.B. "Immobilien" statt "MOD-04"). Mapping über `routesManifest` → `TileDefinition.title`.

**Datei: `src/pages/portal/communication-pro/agenten/AktionsKatalog.tsx`**

4. **Badge `{action.module}`** (Zeile 171-174) ersetzen: Statt `MOD-04` den lesbaren Modulnamen aus routesManifest anzeigen. Kleines Mapping-Objekt am Dateikopf:
   ```
   MOD-02 → Office, MOD-03 → DMS, MOD-04 → Immobilien, ...
   ```
   Alternativ: Modul-Badge ganz weglassen (da Zone-Badge bereits vorhanden).

5. **Zone-Labels bereinigen**: `Z2` → "Portal", `Z3` → "Website" ist okay, aber die Emoji-Badges (`🔵`, `🟢`) und die Zone-Distribution-Leiste (Zeile 91-95) entfernen — zu technisch für diese Seite.

6. **KPI-Cards entfernen** aus AktionsKatalog (Zeilen 63-88) — redundant mit KostenDashboard.

**Keine Änderung an:**
- `SystemPreisliste.tsx` — wird weiterhin intern in der konsolidierten Sektion verwendet
- `KostenDashboard.tsx` — bleibt wie ist
- Add-On Cards — bleiben, werden nur in Collapsible gewrappt

---

### Zusammenfassung

| Aktion | Datei |
|--------|-------|
| Collapsible-Sektionen einbauen | `ArmstrongInfoPage.tsx` |
| AktionsKatalog + Preisliste konsolidieren | `ArmstrongInfoPage.tsx` |
| Modulnummern → lesbare Namen | `AktionsKatalog.tsx` |
| KPI-Cards + Zone-Stats entfernen | `AktionsKatalog.tsx` |
| Emoji-Badges entfernen | `AktionsKatalog.tsx` |

