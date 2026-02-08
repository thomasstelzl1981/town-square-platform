

## Sidebar-Bereinigung: Billing loeschen und Armstrong Zone 1 etablieren

### Zusammenfassung

Der duplizierte Menuepunkt "Billing" (Zeile 98) wird entfernt. Eine neue Kategorie **"Armstrong Zone 1"** wird als Gruppe 4 etabliert mit 7 Menuepunkten. Fehlende Komponenten werden als Placeholder erstellt.

---

### Wichtige Unterscheidung: Zwei Billing-Konzepte

| Konzept | Ort | Zweck |
|---------|-----|-------|
| **Abrechnung** | Zone 2 Stammdaten | Kaufmaennische Rechnungsstellung an User (Credits kaufen → Rechnung erhalten) |
| **Armstrong Billing** | Zone 1 Armstrong | Technische Verbrauchserfassung (genutzte Credits durch KI-Aktionen kalkulieren) |

**Abrechnung (Zone 2):** User kauft 500 Credits → System erstellt Rechnung → User bezahlt

**Armstrong Billing (Zone 1):** User nutzt "Web-Recherche" Action → System erfasst 5 Credits Verbrauch → Aggregation fuer Kostenkontrolle

---

### 1. Zu loeschende Route

**Datei:** `src/manifests/routesManifest.ts`

**Zeile 98 entfernen:**
```text
{ path: "billing", component: "Billing", title: "Abrechnung" }
```

Diese Route ist ein Duplikat - die kaufmaennische Abrechnung existiert bereits in Zone 2 unter Stammdaten.

---

### 2. Neue Sidebar-Kategorie: Armstrong Zone 1

**Datei:** `src/components/admin/AdminSidebar.tsx`

**GROUP_CONFIG anpassen (Priority-Shift):**
```text
'foundation': { label: 'Tenants & Access', priority: 1 },
'masterdata': { label: 'Masterdata', priority: 2 },
'ki-office': { label: 'KI Office', priority: 3 },
'armstrong': { label: 'Armstrong Zone 1', priority: 4 },  // NEU
'activation': { label: 'Feature Activation', priority: 5 },
'backbone': { label: 'Backbone', priority: 6 },
'desks': { label: 'Operative Desks', priority: 7 },
'agents': { label: 'AI Agents', priority: 8 },
'system': { label: 'System', priority: 9 },
'platformAdmin': { label: 'Platform Admin', priority: 10 },
```

---

### 3. getGroupKey erweitern

```text
// Armstrong Zone 1
if (path.startsWith('armstrong')) {
  return 'armstrong';
}

// Billing aus Backbone entfernen (Route wird geloescht)
if (path === 'agreements' || path === 'inbox') {
  return 'backbone';
}
```

---

### 4. shouldShowInNav erweitern

```text
// Armstrong Zone 1 - alle 7 Menuepunkte anzeigen
if (path === 'armstrong' || 
    path === 'armstrong/actions' || 
    path === 'armstrong/logs' || 
    path === 'armstrong/knowledge' ||
    path === 'armstrong/billing' ||
    path === 'armstrong/policies' ||
    path === 'armstrong/test') {
  return true;
}
```

---

### 5. ICON_MAP erweitern

**Neue Imports:**
```text
import { BookOpen, Scale, FlaskConical } from 'lucide-react';
```

**Neue Eintraege:**
```text
// Armstrong Zone 1
'ArmstrongDashboard': Sparkles,
'ArmstrongActions': FileText,
'ArmstrongLogs': FileText,
'ArmstrongBilling': CreditCard,
'ArmstrongKnowledge': BookOpen,
'ArmstrongPolicies': Scale,
'ArmstrongTestHarness': FlaskConical,
```

---

### 6. Neue Sidebar-Struktur unter Armstrong Zone 1

| Menuepunkt | Route | Komponente | Zweck |
|------------|-------|------------|-------|
| Armstrong Console | `/admin/armstrong` | ArmstrongDashboard | KPIs: Action-Volumen, Kosten, Fehlerraten |
| Actions-Katalog | `/admin/armstrong/actions` | ArmstrongActions | Manifest-Viewer aller KI-Aktionen |
| Action Logs | `/admin/armstrong/logs` | ArmstrongLogs | Audit-Trail aller ausgefuehrten Aktionen |
| Knowledge Base | `/admin/armstrong/knowledge` | ArmstrongKnowledge | Kuratierte Immobilien-Wissensdatenbank |
| Billing | `/admin/armstrong/billing` | ArmstrongBilling | **Verbrauchskalkulation** (Credits pro Action) |
| Policies | `/admin/armstrong/policies` | ArmstrongPolicies | System-Prompts und Guardrails |
| Test Harness | `/admin/armstrong/test` | ArmstrongTestHarness | Dry-Run-Umgebung fuer Action-Tests |

---

### 7. Armstrong Billing - Detaillierte Funktion

**Zweck:** Technische Verbrauchserfassung und Kostenkalkulation fuer KI-Aktionen

**Funktionen:**
| Feature | Beschreibung |
|---------|--------------|
| Verbrauchsuebersicht | Aggregierte Credit-Nutzung pro Tenant/Zeitraum |
| Action-Kosten-Mapping | Zuweisung von Credit-Kosten zu einzelnen Actions |
| Plan-Zuordnung | Freemium-Limits vs. Paid-Kontingente definieren |
| Kostenprognose | Hochrechnung basierend auf Nutzungstrends |
| Threshold-Alerts | Warnungen bei hohem Verbrauch |

**Unterschied zur Zone 2 Abrechnung:**
- Zone 2 Abrechnung: "User X hat 500 Credits fuer 49 EUR gekauft"
- Armstrong Billing: "User X hat diese Woche 127 Credits verbraucht (davon 45 fuer Web-Recherche, 82 fuer Dokument-Extraktion)"

---

### 8. Fehlende Komponenten (Placeholder)

**4 neue Dateien erstellen:**

**a) `src/pages/admin/armstrong/ArmstrongKnowledge.tsx`**

Kuratierte Wissensdatenbank fuer deutsche Immobilienthemen.

```text
- Wissenskategorien: Steuern, Mietrecht, Finanzierung, ESG
- Eintraege hinzufuegen/bearbeiten
- Veroeffentlichungsstatus
- Quellenangaben verwalten
```

**b) `src/pages/admin/armstrong/ArmstrongBilling.tsx`**

Verbrauchskalkulation und Credit-Tracking.

```text
- Dashboard: Gesamtverbrauch, Top-Actions, Top-Nutzer
- Action-Kosten-Mapping: Credits pro Action-Typ
- Plan-Verwaltung: Freemium-Limits, Paid-Kontingente
- Alerts: Threshold-Konfiguration
```

**c) `src/pages/admin/armstrong/ArmstrongPolicies.tsx`**

Policy-Editor fuer System-Prompts und Guardrails.

```text
- System-Prompts bearbeiten
- Guardrails konfigurieren (z.B. max. Token, verbotene Topics)
- Sicherheitsregeln
- Versionierung und Audit-Trail
```

**d) `src/pages/admin/armstrong/ArmstrongTestHarness.tsx`**

Dry-Run-Umgebung fuer Action-Validierung.

```text
- Action aus Katalog auswaehlen
- Mock-Context definieren (Tenant, User, Daten)
- Dry-Run ausfuehren (ohne echte Auswirkungen)
- Ergebnis validieren und debuggen
```

---

### 9. Index-Export aktualisieren

**Datei:** `src/pages/admin/armstrong/index.ts`

```text
export { default as ArmstrongDashboard } from './ArmstrongDashboard';
export { default as ArmstrongActions } from './ArmstrongActions';
export { default as ArmstrongLogs } from './ArmstrongLogs';
export { default as ArmstrongKnowledge } from './ArmstrongKnowledge';
export { default as ArmstrongBilling } from './ArmstrongBilling';
export { default as ArmstrongPolicies } from './ArmstrongPolicies';
export { default as ArmstrongTestHarness } from './ArmstrongTestHarness';
```

---

### 10. Zu loeschende Datei

**Datei:** `src/pages/admin/Billing.tsx`

Die duplizierte Billing-Komponente wird geloescht (Zone 2 hat "Abrechnung" in Stammdaten fuer kaufmaennische Rechnungsstellung).

---

### 11. Finale Sidebar-Struktur

```text
Tenants & Access (1)
  - Dashboard
  - Organisationen
  - Benutzer
  - Delegationen

Masterdata (2)
  - Immobilienakte Vorlage
  - Selbstauskunft Vorlage

KI Office (3)
  - E-Mail
  - Kontakte
  - Kommunikation

Armstrong Zone 1 (4)                    
  - Armstrong Console          → KPIs Dashboard
  - Actions-Katalog            → Manifest-Viewer
  - Action Logs                → Audit-Trail
  - Knowledge Base             → Immobilien-Wissen
  - Billing                    → Verbrauchskalkulation
  - Policies                   → Guardrails
  - Test Harness               → Dry-Run Tests

Feature Activation (5)
  - Tile-Katalog

Backbone (6)
  - Vereinbarungen
  - Posteingang

Operative Desks (7)
  - FutureRoom
  - Sales Desk
  - Finance Desk
  - Acquiary

AI Agents (8)
  - Agents

System (9)
  - Integrationen
  - Oversight
  - Audit Log
  - Lead Pool
  - Partner-Verifizierung
  - Provisionen

Platform Admin (10)
  - Support
```

---

### 12. Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/manifests/routesManifest.ts` | Zeile 98 loeschen, 4 neue Routes hinzufuegen |
| `src/components/admin/AdminSidebar.tsx` | GROUP_CONFIG, getGroupKey, shouldShowInNav, ICON_MAP |
| `src/pages/admin/Billing.tsx` | LOESCHEN |
| `src/pages/admin/armstrong/ArmstrongKnowledge.tsx` | NEU (Placeholder) |
| `src/pages/admin/armstrong/ArmstrongBilling.tsx` | NEU (Placeholder) |
| `src/pages/admin/armstrong/ArmstrongPolicies.tsx` | NEU (Placeholder) |
| `src/pages/admin/armstrong/ArmstrongTestHarness.tsx` | NEU (Placeholder) |
| `src/pages/admin/armstrong/index.ts` | Exports erweitern |

---

### 13. Zusammenfassung

1. **Billing Route loeschen:** `/admin/billing` entfernt (Duplikat der Zone 2 Abrechnung)
2. **Armstrong Zone 1:** Neue Sidebar-Gruppe mit Priority 4
3. **7 Menuepunkte:** Console, Actions, Logs, Knowledge, Billing, Policies, Test Harness
4. **Klare Billing-Trennung:** 
   - Zone 2 Abrechnung = Kaufmaennische Rechnungsstellung (Credits kaufen)
   - Armstrong Billing = Technische Verbrauchskalkulation (Credits nutzen)
5. **4 neue Placeholder-Komponenten:** Grundgeruest fuer spaetere Implementierung

