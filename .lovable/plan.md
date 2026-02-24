
# Fix: Lead Desk Sidebar-Eintraege bereinigen

## Problem

Die alten 6 Sub-Routen des Lead Desks stehen noch im `routesManifest.ts` (Zeilen 152-156). Die zugehoerigen Dateien wurden bereits geloescht, aber die Manifest-Eintraege nicht. Die Sidebar generiert ihre Menuepunkte aus diesem Manifest — deshalb erscheinen "Kontakte", "Lead Pool", "Zuweisungen", "Provisionen" und "Monitor" weiterhin unter "SYSTEM" und fuehren alle auf `/admin/lead-desk` zurueck.

## Loesung

Eine einzige Aenderung in `src/manifests/routesManifest.ts`:

**Zeilen 150-156 ersetzen:**

```text
VORHER:
// Lead Desk (MOD-10 Leadmanager) — 6-Tab Structure
{ path: "lead-desk", component: "LeadDeskRouter", title: "Lead Desk" },
{ path: "lead-desk/kontakte", component: "LeadDeskKontakte", title: "Kontakte" },
{ path: "lead-desk/pool", component: "LeadPoolPage", title: "Lead Pool" },
{ path: "lead-desk/assignments", component: "LeadAssignmentsPage", title: "Zuweisungen" },
{ path: "lead-desk/commissions", component: "LeadCommissionsPage", title: "Provisionen" },
{ path: "lead-desk/monitor", component: "LeadMonitorPage", title: "Monitor" },

NACHHER:
// Lead Desk (MOD-10 Leadmanager) — 2-Tab Structure (Website Leads + Kampagnen)
{ path: "lead-desk", component: "LeadDeskRouter", title: "Lead Desk" },
{ path: "lead-desk/kampagnen", component: "LeadKampagnenDesk", title: "Kampagnen Leads" },
```

5 Zeilen entfernt, 1 Zeile hinzugefuegt. Die Tab-Navigation innerhalb des Lead Desks (Website Leads / Kampagnen Leads) bleibt unveraendert — sie wird von `LeadDesk.tsx` selbst gesteuert.

## Auswirkung

Die Sidebar zeigt danach nur noch **einen** Eintrag "Lead Desk" unter Operative Desks. Die 5 Geister-Eintraege unter "System" verschwinden.
