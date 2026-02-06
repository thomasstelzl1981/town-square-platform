
# UX-Audit MOD-12 Akquise-Manager — Ergebnisse & Verbesserungsplan

## Aktueller Golden Path (Ist-Zustand)

```text
EINSTIEG → Dashboard
├── KPIs (Aktive Mandate, Objekteingänge, Freigegeben) ✅
├── Quick Actions:
│   ├── "Neues Mandat" → Wizard ⚠️ NUR PLATZHALTER
│   └── Pending Summary ✅
└── Mandate-Listen (Pending, Active, Self-created) ✅

MANDATE WORKBENCH → /mandate/:id
├── Gate Panel (Split-Bestätigung) ✅
└── Tabs: Sourcing | Outreach | Eingang | Analyse | Delivery ✅

OBJEKTEINGANG → Zentrale Inbox
├── Liste mit Filter + Suche ✅
└── Detail-View:
    ├── Status-Dropdown ✅
    ├── Action-Buttons (Absage/Interesse/Preisvorschlag) ⚠️ UI ohne Funktion
    ├── Tab: Objektdaten ✅
    ├── Tab: Kalkulation (Bestand/Aufteiler) ✅✅
    ├── Tab: Anbieter ⚠️ Platzhalter
    ├── Tab: E-Mail/Quelle ⚠️ Minimal
    ├── Tab: Dokumente ✅
    └── Tab: Aktivitäten ⚠️ Nur Auto-Entry

TOOLS → /tools
├── Exposé-Upload & Analyse (7.1) ✅
├── Standalone-Kalkulatoren (7.2) ✅
├── Portal-Recherche (7.3) ?
└── Immobilienbewertung (7.4) ?
```

---

## Bewertungsübersicht

| Bereich | Status | Details |
|---------|--------|---------|
| Routing & Navigation | ✅ Vollständig | 4 Tiles korrekt, "Kunden" entfernt |
| Dashboard | ✅ Vollständig | KPIs, Listen, Quick Actions |
| Gate-Panel (Split) | ✅ Vollständig | Acceptance-Flow funktional |
| Mandate-Workbench | ✅ Vollständig | 5 Tabs mit Inhalten |
| Objekteingang-Liste | ✅ Vollständig | Filter, Suche, Navigation |
| Kalkulation | ✅✅ Exzellent | Bestand + Aufteiler mit Charts |
| Tools (7.1, 7.2) | ✅ Vollständig | Drag-Drop + KI-Extraktion |
| Mandats-Wizard | ⚠️ Platzhalter | "Kontakt-First" nicht implementiert |
| Action-Dialoge | 🔴 Fehlend | Absage/Interesse/Preisvorschlag |
| E-Mail-Ansicht | 🔴 Fehlend | Original-E-Mail nicht sichtbar |
| Datenraum-Integration | 🔴 Fehlend | DMS-Ordner + Share-Link |

---

## Kritische Lücken im Golden Path

### 1. Action-Dialoge fehlen komplett

**Problem:** Die Buttons "Absage", "Interesse", "Preisvorschlag" im Objekteingang-Detail haben keine Funktionalität.

**Auswirkung:** Der wichtigste Teil des Akquise-Workflows — die Entscheidung mit automatischer E-Mail-Generierung — ist nicht nutzbar.

**Lösung:**

| Dialog | Funktionen |
|--------|------------|
| AbsageDialog | Grund-Dropdown, optionale Nachricht, KI-generierte E-Mail-Preview, Senden-Button |
| PreisvorschlagDialog | Preis-Eingabe, Dokumenten-Checkboxen (Mietliste, Energieausweis, etc.), KI-E-Mail-Preview |
| InteresseDialog | Datenraum-Checkbox, Mandant-Benachrichtigung, E-Mail-Preview, DMS-Ordner-Erstellung |

### 2. E-Mail-Ansicht fehlt

**Problem:** Tab "E-Mail/Quelle" zeigt nur `source_inbound_id`, nicht die tatsächliche E-Mail.

**Lösung:** 
- `acq_inbound_messages` laden wenn `source_inbound_id` vorhanden
- E-Mail formatiert anzeigen (Absender, Betreff, Datum, Body)
- Attachments-Liste mit Download-Link

### 3. Mandats-Wizard unvollständig

**Problem:** Der "Kontakt-First Wizard" ist ein Platzhalter ohne Funktion.

**Lösung — 3-Step-Wizard:**

| Step | Inhalt |
|------|--------|
| 1. Kontakt | Bestehenden Kontakt aus MOD-02 wählen ODER inline neuen anlegen |
| 2. Profil | Ankaufsprofil: Region, Objektart, Preis, Rendite + KI-Generierung |
| 3. Bestätigung | Übersicht + "Als Entwurf" oder "Aktivieren" (eigene Mandate sofort aktiv) |

---

## Verbesserungsvorschläge

### Dashboard optimieren

**Aktuell:** 2 Kacheln (Neues Mandat, Pending Summary)

**Empfehlung — 3 Quick Actions:**
1. ➕ **Neues Mandat** → /mandate/neu
2. 📤 **Exposé hochladen** → /tools
3. 🗑️ **Abgelehnte Objekte** → /objekteingang?status=rejected

### Objekteingang-Detail UX

**Status-Stepper hinzufügen:**
```text
[Eingegangen] → [In Analyse] → [Analysiert] → [Präsentiert] → [Entschieden]
```
Visuelle Pipeline im Header für klaren Statusfortschritt.

**Aktivitäten-Tab erweitern:**
- Button "Aktivität hinzufügen" → Modal
- Typen: Anruf, E-Mail gesendet, Notiz, Besichtigung
- Automatische Einträge bei Statusänderungen

**Anbieter-Tab befüllen:**
- Daten aus `extracted_data` parsen (Makler-Name, E-Mail, Telefon)
- Falls vorhanden: Link zu Kontakt in MOD-02

### Mandats-Workbench: Redundanz klären

**Inbound-Tab** zeigt Objekteingänge für *dieses Mandat*.
**Objekteingang-Tile** zeigt *alle Mandate*.

Dies ist korrekt und sinnvoll — keine Änderung nötig.

### Tools-Seite erweitern

**Portal-Recherche (7.3) prüfen:**
- Komponente `PortalSearchTool.tsx` existiert
- Integration mit Apify-Edge-Function bestätigen

**Immobilienbewertung (7.4) prüfen:**
- Komponente `PropertyResearchTool.tsx` existiert
- Integration mit KI-Recherche + GeoMap bestätigen

---

## Implementierungsplan

### Phase 1 (P0 — Kritisch)

| # | Feature | Aufwand | Dateien |
|---|---------|---------|---------|
| 1 | AbsageDialog implementieren | M | AbsageDialog.tsx, useGenerateResponse.ts |
| 2 | PreisvorschlagDialog implementieren | L | PreisvorschlagDialog.tsx |
| 3 | InteresseDialog + Datenraum | L | InteresseDialog.tsx, sot-acq-create-dataroom |
| 4 | E-Mail-Ansicht im Quelle-Tab | S | ObjekteingangDetail.tsx |
| 5 | Mandats-Wizard (Kontakt-First) | L | MandatCreateWizardManager.tsx |

### Phase 2 (P1 — Wichtig)

| # | Feature | Aufwand |
|---|---------|---------|
| 6 | Aktivitäten-Log mit manueller Erfassung | M |
| 7 | Anbieter-Tab aus Extraktionsdaten | S |
| 8 | Status-Stepper im Header | S |
| 9 | Quick Actions im Dashboard erweitern | S |

### Phase 3 (P2 — Nice-to-have)

| # | Feature | Aufwand |
|---|---------|---------|
| 10 | Portal-Recherche (7.3) validieren | S |
| 11 | Immobilienbewertung (7.4) validieren | S |
| 12 | Bulk-Aktionen in Objekteingang-Liste | M |

---

## Technische Details (für Entwicklung)

### Neue Komponenten

```text
src/pages/portal/akquise-manager/components/
├── AbsageDialog.tsx (NEU)
├── PreisvorschlagDialog.tsx (NEU)
├── InteresseDialog.tsx (NEU)
├── SourceEmailViewer.tsx (NEU)
├── ActivityLogPanel.tsx (NEU)
└── StatusStepper.tsx (NEU)
```

### Neue/Erweiterte Edge Functions

| Function | Zweck |
|----------|-------|
| sot-acq-generate-response | KI-E-Mail für Absage/Interesse/Preisvorschlag |
| sot-acq-create-dataroom | DMS-Ordner + Share-Link erstellen |

### Datenbank-Erweiterungen

```sql
-- Datenraum-Verknüpfung (falls nicht bereits vorhanden)
ALTER TABLE acq_offers 
ADD COLUMN IF NOT EXISTS data_room_folder_id UUID REFERENCES storage_nodes(id);

-- Aktivitäten-Tabelle (falls nicht vorhanden)
CREATE TABLE IF NOT EXISTS acq_offer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES acq_offers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'call', 'email_sent', 'note', 'status_change', 'viewing'
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Zusammenfassung

**Was funktioniert exzellent:**
- Kalkulation (Bestand + Aufteiler) mit Charts
- Exposé-Upload mit KI-Extraktion
- Standalone-Kalkulatoren mit Drag-Drop
- Objekteingang-Liste mit Filtern
- Gate-Panel für Mandatsannahme

**Was fehlt für einen vollständigen Golden Path:**
1. Action-Dialoge (Absage/Interesse/Preisvorschlag) — **KRITISCH**
2. E-Mail-Ansicht — **KRITISCH**
3. Mandats-Wizard — **WICHTIG**
4. Aktivitäten-Log — **NICE-TO-HAVE**

**Empfehlung:** Phase 1 (P0) zuerst implementieren, um den Golden Path vollständig nutzbar zu machen.
