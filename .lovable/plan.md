
# Plan: Manifest- & Spec-Synchronisation

## Status: ENTWURF — Warten auf Freigabe

---

## Ziel

YAML-Manifeste und Modul-Specs mit dem aktuellen Stand in `routesManifest.ts` synchronisieren.

---

## Phase 1: YAML-Manifeste aktualisieren

### 1a) `manifests/routes_manifest.yaml`

**Korrekturen:**
- MOD-07: Tiles aktualisieren → selbstauskunft, dokumente, anfrage, status

**Ergänzungen Zone 1:**
- futureroom/bankkontakte, futureroom/finanzierungsmanager
- agents/* (5 Routes)
- acquiary/* (4 Routes)
- sales-desk/* (5 Routes)
- finance-desk/* (5 Routes)

**Ergänzungen Zone 2 (MOD-12 bis MOD-20):**
```yaml
MOD-12:
  name: "Akquise-Manager"
  base: "/akquise-manager"
  tiles: [dashboard, kunden, mandate, tools]
  visibility: { org_types: [partner], requires_activation: true }

MOD-13:
  name: "Projekte"
  base: "/projekte"
  tiles: [uebersicht, portfolio, timeline, settings]
  visibility: { org_types: [client, partner] }

MOD-14:
  name: "Communication Pro"
  base: "/communication-pro"
  tiles: [serien-emails, recherche, social, agenten]
  visibility: { org_types: [partner], requires_activation: true }

MOD-15:
  name: "Fortbildung"
  base: "/fortbildung"
  tiles: [katalog, meine-kurse, zertifikate, settings]
  visibility: { org_types: [partner, subpartner] }

MOD-16:
  name: "Services"
  base: "/services"
  tiles: [katalog, anfragen, auftraege, settings]
  visibility: { org_types: [client, partner] }

MOD-17:
  name: "Car-Management"
  base: "/cars"
  tiles: [uebersicht, fahrzeuge, service, settings]
  visibility: { org_types: [partner], requires_activation: true }

MOD-18:
  name: "Finanzanalyse"
  base: "/finanzanalyse"
  tiles: [dashboard, reports, szenarien, settings]
  visibility: { org_types: [client] }

MOD-19:
  name: "Photovoltaik"
  base: "/photovoltaik"
  tiles: [angebot, checkliste, projekt, settings]
  visibility: { org_types: [client] }

MOD-20:
  name: "Miety"
  base: "/miety"
  tiles: [uebersicht, dokumente, kommunikation, zaehlerstaende, versorgung, versicherungen]  # 6 Tiles!
  visibility: { org_types: [client], requires_activation: true }
```

---

### 1b) `manifests/tile_catalog.yaml`

Gleiche Module wie oben, vollständig mit:
- Icons
- Sub-Tiles mit Routes
- Visibility-Regeln
- Descriptions

---

## Phase 2: Modul-Specs erstellen

| Datei | Status |
|-------|--------|
| `docs/modules/MOD-11_FINANZIERUNGSMANAGER.md` | NEU |
| `docs/modules/MOD-12_AKQUISE_MANAGER.md` | NEU |
| `docs/modules/MOD-13_PROJEKTE.md` | NEU |
| `docs/modules/MOD-14_COMMUNICATION_PRO.md` | NEU |
| `docs/modules/MOD-15_FORTBILDUNG.md` | NEU |
| `docs/modules/MOD-16_SERVICES.md` | NEU |
| `docs/modules/MOD-17_CAR_MANAGEMENT.md` | NEU |
| `docs/modules/MOD-18_FINANZANALYSE.md` | NEU |
| `docs/modules/MOD-19_PHOTOVOLTAIK.md` | NEU |
| `docs/modules/MOD-20_MIETY.md` | NEU (6-Tile-Exception) |

**Spec-Template:**
```markdown
# MOD-XX: [Name]

## Übersicht
- **Zone:** 2 (Portal)
- **Pfad:** /portal/[base]
- **Icon:** [lucide-icon]
- **Org-Types:** [client/partner/subpartner]

## Tiles (4-Tile-Pattern)
1. **[Tile 1]** — Beschreibung
2. **[Tile 2]** — Beschreibung
3. **[Tile 3]** — Beschreibung
4. **[Tile 4]** — Beschreibung

## Datenmodell
- Tabellen: ...
- Beziehungen: ...

## Workflows
- Cases/Events: ...

## Integration
- Abhängigkeiten zu anderen Modulen
```

---

## Phase 3: Zone 1 Admin dokumentieren

**Neue Datei:** `docs/architecture/ZONE1_ADMIN_ROUTES.md`

Inhalt:
- Backbone (Dashboard, Organizations, Users, etc.)
- Desks (Sales, Finance, Acquiary)
- Agents
- FutureRoom

---

## Reihenfolge der Umsetzung

| Schritt | Aktion | Dateien |
|---------|--------|---------|
| 1 | YAML routes_manifest.yaml aktualisieren | 1 Datei |
| 2 | YAML tile_catalog.yaml aktualisieren | 1 Datei |
| 3 | Modul-Specs erstellen | 10 Dateien |
| 4 | Zone 1 Admin dokumentieren | 1 Datei |

**Geschätzte Änderungen:** 13 Dateien

---

## Hinweise

- `routesManifest.ts` bleibt **Runtime-SSOT**
- YAML-Dateien sind **Dokumentation** und müssen manuell synchron gehalten werden
- Bei zukünftigen Änderungen: Immer beide aktualisieren (TS + YAML)
