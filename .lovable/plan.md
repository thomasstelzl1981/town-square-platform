

## Bereinigung: Oversight und Testdaten-Konsolidierung

### Zusammenfassung

Oversight und Tile-Katalog haben beide Golden Path Seeds implementiert. Dies fuehrt zu Redundanz und Verwirrung. Die Bereinigung entfernt die Seeds aus Oversight und behaelt es als reines Monitoring-Dashboard.

---

### Analyse: Die 4 Golden Paths

| Golden Path | Workflow | Seeds-Funktion | Implementierung |
|-------------|----------|----------------|-----------------|
| **E2E (MOD-04 Immobilien)** | 10 Phasen von Erfassung bis Verkauf | `seed_golden_path_data` RPC | TestDataManager in Tile-Katalog |
| **Finanzierung (MOD-07/11)** | Selbstauskunft → FutureRoom → Bank | Teilweise in E2E-Seeds enthalten | Workflow implementiert |
| **Akquise (MOD-12)** | Mandat → Sourcing → Delivery | Keine eigenen Seeds | Workflow implementiert, keine Testdaten |
| **Sanierung (MOD-04)** | 8-Schritte Ausschreibung | Keine eigenen Seeds | Workflow implementiert, keine Testdaten |

---

### Aktuelle Duplikation

```text
/admin/oversight                    /admin/tiles
├── System-KPIs (Orgs, Users)       ├── Modul-Katalog
├── Golden Path Seeds ◄──DUPLIKAT──►├── Tab "Testdaten"
└── Tenant/Property-Listen          │   ├── Golden Path Seeds
                                    │   ├── Excel-AI-Import
                                    │   ├── Batch-Loeschung
                                    │   └── Reset-Funktion
                                    └── Tenant-Aktivierung
```

---

### Bereinigungsplan

#### Schritt 1: Golden Path Seeds aus Oversight entfernen

**Datei:** `src/pages/admin/Oversight.tsx`

**Zu entfernen:**
- Import: `useGoldenPathSeeds, SeedResult`
- State: `runSeeds, isSeeding, lastResult, isSeedAllowed`
- Handler: `handleRunSeeds`
- UI: Komplette "Golden Path Demo Data" Card (Zeilen 274-392)

**Beizubehalten:**
- System-KPIs (Organizations, Profiles, Properties, etc.)
- Tenant-Tabelle
- Property-Tabelle
- Finance-Pakete-Tabelle
- Tile-Aktivierungen-Tabelle

---

#### Schritt 2: Oversight-Header aktualisieren

**Neuer Header:**
```text
System Oversight
Systemweite Uebersicht ueber alle Tenants, Immobilien und Module (Read-only)
```

**Hinweis hinzufuegen:**
```text
Testdaten → /admin/tiles → Tab "Testdaten"
```

---

#### Schritt 3: Sidebar-Position beibehalten

Oversight bleibt in der **System-Gruppe** da es:
- Plattformweite KPIs anzeigt
- Read-only Monitoring bietet
- NICHT zur Feature-Aktivierung gehoert

```text
System (9)
  - Integrationen
  - Oversight        ← Bleibt hier
  - Audit Log
  - Lead Pool
  - Partner-Verifizierung
  - Provisionen
```

---

### Finale Struktur

#### Oversight (bereinigt)

```text
/admin/oversight
├── System-KPIs (6 Cards)
│   ├── Organisationen
│   ├── Benutzer
│   ├── Immobilien
│   ├── Aktive Module
│   ├── Finance Pakete
│   └── Public Listings
│
└── Tabs
    ├── Tenants        → Org-Tabelle mit Counts
    ├── Immobilien     → Property-Tabelle
    ├── Finance Pakete → Finance-Request-Tabelle
    └── Module         → Tile-Aktivierungen
```

**KEINE Seeds mehr!**

---

#### Tile-Katalog (unveraendert, bleibt SSOT)

```text
/admin/tiles
├── Tab: Modul-Katalog
│   └── Alle MOD-XX Karten
│
├── Tab: Tenant-Aktivierung
│   └── Switch pro Modul/Tenant
│
└── Tab: Testdaten          ← EINZIGER Ort fuer Seeds
    ├── Golden Path Demo-Daten
    │   ├── Seeds erstellen
    │   └── Seeds zuruecksetzen
    │
    ├── Excel-AI-Import
    │   └── KI-gestuetzter Import
    │
    └── Test-Batches
        └── Batch-Loeschung
```

---

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/Oversight.tsx` | Golden Path UI + Imports entfernen |

---

### Nicht-Aenderungen

| Aspekt | Begruendung |
|--------|-------------|
| Sidebar-Position Oversight | Bleibt in System (korrekt) |
| TestDataManager | Bereits SSOT, keine Aenderung |
| Akquise/Sanierung-Seeds | Existieren nicht, out of scope |

---

### Technische Details

#### Zu entfernende Imports (Oversight.tsx)

```typescript
// ENTFERNEN:
import { useGoldenPathSeeds, SeedResult } from '@/hooks/useGoldenPathSeeds';
import { Sparkles, ShieldAlert } from 'lucide-react';
```

#### Zu entfernende States (Oversight.tsx)

```typescript
// ENTFERNEN:
const { runSeeds, isSeeding, lastResult, isSeedAllowed } = useGoldenPathSeeds(...);
const handleRunSeeds = async () => { ... };
```

#### Zu entfernende UI (Oversight.tsx, ca. Zeilen 274-392)

```typescript
// ENTFERNEN:
{/* Golden Path Seeds Card */}
<Card className={...}>
  ...
</Card>
```

---

### Zusammenfassung

1. **Duplikation beseitigen:** Golden Path Seeds nur noch im Tile-Katalog
2. **Oversight bleibt read-only:** Nur KPIs und Tabellen
3. **Sidebar unveraendert:** Oversight bleibt in System-Gruppe
4. **Akquise/Sanierung-Seeds:** Nicht vorhanden, keine Aktion erforderlich

