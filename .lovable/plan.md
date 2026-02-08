

# Zone 1 Fertigstellungsplan v1.1 (korrigiert)

## Korrektur zu Phase 4

Phase 4 (Feature Activation) wird praezisiert:

### Phase 4: Feature Activation (Gruppe 5)

**Status:** Infrastruktur vorhanden, aktuell NICHT aktiv fuer Zone 2

### Wichtige Klarstellung

| Aspekt | Entwicklungs-Account | Echte Tenants |
|--------|---------------------|---------------|
| Modul-Sichtbarkeit | ALLE Module sichtbar | Tile-Aktivierung steuert |
| Code-Logik | `isDevelopmentMode = true` → zeigt alles | `tenant_tile_activation` wird ausgewertet |
| Partner-Verifizierung | Nicht relevant | Schaltet Partner-Zugang |

**Konsequenz fuer jetzt:**
- Tile-Katalog zeigt Modul-Uebersicht (Dokumentation)
- Tenant-Aktivierung Tab ist vorbereitet, aber ohne Wirkung
- Wirkung erst bei Onboarding echter Tenants (Phase 11)

---

### Phase 4 Tasks (aktualisiert)

| Schritt | Aufgabe | Prioritaet | Begruendung |
|---------|---------|------------|-------------|
| 4.1 | MOD-00 in tile_catalog einfuegen | Hoch | Vollstaendigkeit des Katalogs |
| 4.2 | Tile-Katalog als Modul-Dokumentation nutzen | Mittel | Referenz fuer Entwicklung |
| 4.3 | Partner-Verifizierung UI fertigstellen | Niedrig | Erst bei echten Partnern relevant |
| 4.4 | **NICHT:** Zone 2 Sichtbarkeit testen | - | Entwicklungs-Account zeigt alles |

---

### Abhaengigkeit verdeutlicht

```text
Entwicklungs-Account (jetzt):
  PortalNav.tsx Zeile 190-195:
  if (isDevelopmentMode) {
    setActiveTileCodes(null); // null = show all
    return;
  }
  → ALLE Module sichtbar, tenant_tile_activation ignoriert

Echte Tenants (spaeter Phase 11):
  - Zone 1 aktiviert Module pro Tenant
  - Zone 2 liest tenant_tile_activation
  - Nur aktivierte Module erscheinen in Sidebar
```

---

## Aktualisierter Phasenplan (vollstaendig)

### Phase 1: Dokumentation und Datenbereinigung
**Ziel:** Repo und DB synchronisieren

| Schritt | Aufgabe |
|---------|---------|
| 1.1 | MOD-00 in tile_catalog einfuegen |
| 1.2 | integration_registry: OPENAI-Diskrepanz klaeren |
| 1.3 | ZONE1_ADMIN_ROUTES.md aktualisieren |
| 1.4 | A2_Zone1_Admin_Governance.md auf v3.0 |
| 1.5 | ZONE1_COMPLETION_ROADMAP.md erstellen (dieses Dokument) |

---

### Phase 2: Tenants und Access (Gruppe 1)
**Status:** Funktional, Feinarbeit

| Modul | Aufgabe |
|-------|---------|
| Dashboard | KPI-Queries validieren |
| Organisationen | Typ-Filter hinzufuegen |
| Benutzer | Rollen-Badge pruefen |
| Delegationen | Filter nach Typ |

---

### Phase 3: Masterdata (Gruppe 2)
**Status:** Read-Only Viewer (SSOT = Zone 2)

| Modul | Aufgabe |
|-------|---------|
| Immobilienakte Vorlage | Als Read-Only Referenz aus Zone 2 Types |
| Selbstauskunft Vorlage | Als Read-Only Referenz aus Zone 2 Types |

**Regel:** Zone 1 veraendert diese Strukturen NICHT. Sie dienen der Dokumentation.

---

### Phase 4: Feature Activation (Gruppe 5)
**Status:** Infrastruktur bereit, Wirkung erst bei echten Tenants

| Modul | Aufgabe | Wann relevant |
|-------|---------|---------------|
| Tile-Katalog | MOD-00 anzeigen, als Doku nutzen | Jetzt (Dokumentation) |
| Tile-Katalog | Tenant-Aktivierung Tab | Phase 11 (echte Tenants) |
| Partner-Verifizierung | Status-Workflow UI | Phase 11 (echte Partner) |

---

### Phase 5: System (Gruppe 9)
**Status:** Funktional, Bereinigung

| Modul | Aufgabe |
|-------|---------|
| Integrationen | OPENAI korrigieren, Lovable AI dokumentieren |
| Oversight | Fertig (nur KPIs) |
| Audit Log | Filter nach Modul |

---

### Phase 6: Armstrong Zone 1 (Gruppe 4)
**Status:** Nur Mock-Daten

| Schritt | Aufgabe |
|---------|---------|
| 6A | DB-Schema erstellen (armstrong_action_runs, etc.) |
| 6B | Module mit DB verbinden |

---

### Phase 7: Operative Desks (Gruppe 7)
**Status:** Teilweise implementiert

| Desk | Status |
|------|--------|
| FutureRoom | Funktional, Feinarbeit |
| Acquiary | Funktional, Feinarbeit |
| LeadPool | Funktional |
| Provisionen | Grundstruktur |
| Sales Desk | Stub → implementieren |
| Finance Desk | Stub → Redirect oder entfernen |

---

### Phase 8: KI Office (Gruppe 3)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| E-Mail | Resend-Integration (System-Mails) |
| Kontakte | Zone 1 Scope Filter |
| Kommunikation | Event-Timeline |

---

### Phase 9: Backbone (Gruppe 6)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| Vereinbarungen | Template-Liste |
| Posteingang | Caya-Integration |

---

### Phase 10: AI Agents (Gruppe 8)
**Status:** Stubs

| Modul | Aufgabe |
|-------|---------|
| Dashboard | Agenten-Uebersicht |
| Katalog | Verfuegbare Agenten |
| Instanzen | Laufende Agenten |
| Runs | Ausfuehrungshistorie |
| Policies | Sicherheitsregeln |

---

### Phase 11: Platform Admin, Abrechnung und Tenant-Onboarding (Gruppe 10)
**Status:** Zum Schluss

| Modul | Aufgabe |
|-------|---------|
| Support | Ticket-System |
| Rechnungsstellung (NEU) | Sidebar-Menupunkt + Grundstruktur |
| Zahlungen (NEU) | Stripe-Integration |
| **Tenant-Onboarding** | Tile-Aktivierung wird hier relevant |

**Hier wird Feature Activation erst wirklich aktiv:**
- Neue Tenants anlegen
- Module pro Tenant freischalten
- Partner verifizieren

---

## Zusammenfassung: Reihenfolge

```text
Phase 1: Dokumentation und Datengrundlagen
    ↓
Phase 2: Tenants und Access (Feinarbeit)
    ↓
Phase 3: Masterdata (Read-Only Viewer)
    ↓
Phase 4: Feature Activation (Infrastruktur, Doku-Modus)
    ↓
Phase 5: System (Integrationen bereinigen)
    ↓
Phase 6: Armstrong Zone 1 (DB-Schema + Integration)
    ↓
Phase 7: Operative Desks (komplettieren)
    ↓
Phase 8: KI Office (System-Kommunikation)
    ↓
Phase 9: Backbone (Templates, Inbound)
    ↓
Phase 10: AI Agents (Governance)
    ↓
Phase 11: Platform Admin + Abrechnung + Tenant-Onboarding
          (Feature Activation wird hier AKTIV)
```

---

## Governance-Regeln (unveraendert)

### Regel 1: Zone 2 ist SSOT fuer Business-Daten
Zone 1 darf Zone 2 Daten niemals veraendern ohne explizite Freigabe.

### Regel 2: Zone 1 steuert durch Konfiguration
Zone 1 veraendert eigene Governance-Daten:
- Tile-Aktivierungen
- Partner-Verifizierung
- Mandats-Zuweisung
- Lead-Zuweisung

### Regel 3: Masterdata = Read-Only Spiegel
Die Masterdata-Vorlagen sind Viewer, keine Editoren.

### Regel 4: Entwicklungs-Account zeigt alles
Im Development-Mode ist tenant_tile_activation deaktiviert.
Alle Module sind sichtbar fuer vollstaendige Entwicklung.

---

## Naechster Schritt

Phase 1 starten:
1. MOD-00 in tile_catalog einfuegen (DB-Migration)
2. ZONE1_COMPLETION_ROADMAP.md im Repo erstellen
3. ZONE1_ADMIN_ROUTES.md aktualisieren
4. A2_Zone1_Admin_Governance.md auf v3.0

