

## Sidebar-Reorganisation: LeadPool, Provisionen und Partner-Verifizierung

### Zusammenfassung

Drei Module werden aus der "System"-Gruppe in passendere Kategorien verschoben, basierend auf ihrer tatsaechlichen Funktion.

---

### Analyse der drei Module

| Modul | Aktuelle Gruppe | Funktion | Empfohlene Gruppe |
|-------|-----------------|----------|-------------------|
| **LeadPool** | System | Operative Lead-Verwaltung und Partner-Zuweisung | **Operative Desks** |
| **Provisionen** | System | Operative Provisionsfreigabe und Zahlungsuebersicht | **Operative Desks** |
| **Partner-Verifizierung** | System | Status-Aktivierung von Partnern (approved/rejected) | **Feature Activation** |

---

### Detailanalyse: Partner-Verifizierung

**Aktuelle Funktion (aus Code-Review):**
- Zeigt alle Vertriebspartner mit Verifizierungsstatus
- Status-Workflow: `pending` → `documents_submitted` → `under_review` → `approved` / `rejected`
- Aktionen: Partner genehmigen oder ablehnen
- Setzt `verified_at` und aktiviert damit Partner-Funktionen

**Warum Feature Activation:**
Die Partner-Verifizierung ist KEINE reine Uebersicht. Sie **aktiviert Features** fuer Partner:
- Ein `approved` Partner kann Listings im Objektkatalog (MOD-09) sehen
- Ein `rejected` Partner hat keinen Zugang zu Plattform-Features
- Entspricht dem gleichen Pattern wie Tile-Aktivierung (Modul freischalten)

---

### Detailanalyse: LeadPool

**Aktuelle Funktion (aus Code-Review):**
- Zentrale Lead-Verwaltung (zone1_pool = true)
- Lead-Zuweisung an Partner
- Status-Tracking: new → contacted → qualified → converted

**Warum Operative Desks:**
Der LeadPool ist eine **operative Workstation** mit aktiven Zuweisungen.
Vergleichbar mit FutureRoom (Mandatszuweisung) oder Acquiary (Objektzuordnung).

---

### Detailanalyse: Provisionen

**Aktuelle Funktion (aus Code-Review):**
- Provisionsfreigabe-Workflow: pending → approved → invoiced → paid
- Aktive Genehmigungsaktionen
- Zahlungsueberwachung

**Warum Operative Desks:**
Provisionen sind **operative Finanzvorgaenge** mit Genehmigungsworkflow.
Gehoert funktional zu Finance Desk oder Sales Desk (plattformweite Provisionen).

---

### Aenderungen in AdminSidebar.tsx

#### 1. getGroupKey erweitern (Zeile 108-149)

**Vorher:**
```typescript
if (path === 'integrations' || path === 'oversight' || 
    path === 'audit' || path === 'leadpool' || path === 'partner-verification' || path === 'commissions') {
  return 'system';
}
```

**Nachher:**
```typescript
// Feature Activation
if (path === 'tiles' || path === 'partner-verification') {
  return 'activation';
}

// Operative Desks: LeadPool und Provisionen hinzufuegen
if (path === 'leadpool' || path === 'commissions') {
  return 'desks';
}

// System (bereinigt)
if (path === 'integrations' || path === 'oversight' || path === 'audit') {
  return 'system';
}
```

---

### Finale Sidebar-Struktur

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
  - Armstrong Console
  - Actions-Katalog
  - Action Logs
  - Knowledge Base
  - Billing
  - Policies
  - Test Harness

Feature Activation (5)
  - Tile-Katalog
  - Partner-Verifizierung      ← NEU HIER

Backbone (6)
  - Vereinbarungen
  - Posteingang

Operative Desks (7)
  - FutureRoom
  - Sales Desk
  - Finance Desk
  - Acquiary
  - Lead Pool                   ← NEU HIER
  - Provisionen                 ← NEU HIER

AI Agents (8)
  - Agents

System (9)                      ← BEREINIGT
  - Integrationen
  - Oversight
  - Audit Log

Platform Admin (10)
  - Support
```

---

### Begruendung der Kategorisierung

| Gruppe | Kriterium | Module |
|--------|-----------|--------|
| **Feature Activation** | Schaltet Funktionen fuer Tenants/Partner EIN/AUS | Tile-Katalog, Partner-Verifizierung |
| **Operative Desks** | Tagesgeschaeft mit aktiven Workflows | FutureRoom, Sales Desk, Finance Desk, Acquiary, LeadPool, Provisionen |
| **System** | Read-only Monitoring, Konfiguration | Integrationen, Oversight, Audit Log |

---

### Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/components/admin/AdminSidebar.tsx` | getGroupKey Funktion anpassen (Zeilen 124-148) |

---

### Technische Umsetzung

**Zeilen 124-148 in AdminSidebar.tsx ersetzen:**

```typescript
// Feature Activation (inkl. Partner-Verifizierung)
if (path === 'tiles' || path === 'partner-verification') {
  return 'activation';
}
// FutureRoom gehört zu Operative Desks
if (path.startsWith('futureroom')) {
  return 'desks';
}
// Backbone
if (path === 'agreements' || path === 'inbox') {
  return 'backbone';
}
// Operative Desks (Desks + LeadPool + Provisionen)
if (path.startsWith('sales-desk') || path.startsWith('finance-desk') || 
    path.startsWith('acquiary') || path === 'leadpool' || path === 'commissions') {
  return 'desks';
}
if (path.startsWith('agents')) {
  return 'agents';
}
// System (bereinigt - nur Read-only Monitoring)
if (path === 'integrations' || path === 'oversight' || path === 'audit') {
  return 'system';
}
```

