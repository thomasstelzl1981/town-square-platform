

# Plan: Pet Governance Desk (Zone 1) — Sub-Menue-Struktur + MOD-05/MOD-22 Bereinigung

## Ueberblick

Der Pet Governance Desk in Zone 1 (`/admin/petmanager`) hat aktuell nur eine einzelne Route ohne Sub-Navigation. Alle anderen Desks (Sales, Acquiary, Finance, Projekt) haben eine Sub-Seiten-Struktur mit Sidebar-Eintraegen. Das wird hier nachgezogen.

Gleichzeitig werden MOD-05 und MOD-22 in Zone 2 bereinigt (Fotoalbum entfernen, Mein Bereich hinzufuegen, Uebersicht entfernen, Zahlungen zu Finanzen umbenennen).

---

## Teil 1: Zone 1 — Pet Governance Desk Sub-Menue

### Neue Menue-Struktur (4 Sub-Seiten + Dashboard)

| Nr | Menuepunkt | Route | Zweck |
|----|-----------|-------|-------|
| 1 | Dashboard | `/admin/petmanager` | KPI-Uebersicht, Quick Actions |
| 2 | Provider | `/admin/petmanager/provider` | Provider-Verzeichnis, Verifizierungsstatus, Onboarding |
| 3 | Finanzen | `/admin/petmanager/finanzen` | Umsatz-Governance, offene Forderungen, Abrechnungen |
| 4 | Services | `/admin/petmanager/services` | Service-Katalog-Moderation, Qualitaetskontrolle |
| 5 | Monitor | `/admin/petmanager/monitor` | Franchise-Monitoring, Alerts, Audit-Trail |

### Betroffene Dateien

**`src/manifests/routesManifest.ts`** (Zone 1 Admin-Routes, Zeile 151-152):

```text
Vorher:
  { path: "petmanager", component: "PetmanagerDashboard", title: "Petmanager" }

Nachher:
  { path: "petmanager", component: "PetmanagerDashboard", title: "Pet Governance" }
  { path: "petmanager/provider", component: "PetmanagerProvider", title: "Provider" }
  { path: "petmanager/finanzen", component: "PetmanagerFinanzen", title: "Finanzen" }
  { path: "petmanager/services", component: "PetmanagerServices", title: "Services" }
  { path: "petmanager/monitor", component: "PetmanagerMonitor", title: "Monitor" }
```

**`src/components/admin/AdminSidebar.tsx`** (Icon-Mapping, Zeile 89):

```text
Vorher:
  'PetmanagerDashboard': PawPrint

Nachher:
  'PetmanagerDashboard': PawPrint
  'PetmanagerProvider': Users2
  'PetmanagerFinanzen': CreditCard
  'PetmanagerServices': ClipboardList
  'PetmanagerMonitor': Eye
```

**Neue Dateien** (Platzhalter-Seiten im bestehenden Pattern):

| Datei | Inhalt |
|-------|--------|
| `src/pages/admin/petmanager/PetmanagerProvider.tsx` | Provider-Tabelle (Name, Status, Verifiziert, Umsatz) |
| `src/pages/admin/petmanager/PetmanagerFinanzen.tsx` | Offene Forderungen, Abrechnungs-Uebersicht |
| `src/pages/admin/petmanager/PetmanagerServices.tsx` | Service-Katalog, Moderation-Queue |
| `src/pages/admin/petmanager/PetmanagerMonitor.tsx` | Franchise-KPIs, Alerts, Audit-Log |

**`src/pages/admin/desks/PetmanagerDesk.tsx`** bleibt als Dashboard bestehen (wird von der Route `petmanager` geladen).

---

## Teil 2: Zone 2 — MOD-05 "Haustiere" (Client) bereinigen

### Aenderungen

| Aktion | Detail |
|--------|--------|
| Entfernen | `PetsFotoalbum.tsx` — Fotoalbum wird spaeter in die Tierakte integriert |
| Hinzufuegen | `PetsMeinBereich.tsx` — Kundendaten, Bestellhistorie, Service-Uebersicht |
| Route aendern | `fotoalbum` entfernen, `mein-bereich` hinzufuegen |

### Neue Tab-Struktur MOD-05

| Nr | Tab | Route |
|----|-----|-------|
| 1 | Meine Tiere | `/portal/pets/meine-tiere` |
| 2 | Caring | `/portal/pets/caring` |
| 3 | Shop und Services | `/portal/pets/shop` |
| 4 | Mein Bereich | `/portal/pets/mein-bereich` |

### Betroffene Dateien

- `src/manifests/routesManifest.ts` — MOD-05 tiles: `fotoalbum` entfernen, `mein-bereich` hinzufuegen
- `src/pages/portal/pets/PetsMeinBereich.tsx` — **Neue Datei** (Platzhalter)
- `src/pages/portal/pets/PetsFotoalbum.tsx` — **Loeschen**
- `src/components/portal/HowItWorks/moduleContents.ts` — MOD-05 subTiles aktualisieren

---

## Teil 3: Zone 2 — MOD-22 "Pet Manager" (Manager) bereinigen

### Aenderungen

| Aktion | Detail |
|--------|--------|
| Entfernen | `PMUebersicht.tsx` — KPIs werden in andere Tabs integriert |
| Umbenennen | `PMZahlungen.tsx` zu `PMFinanzen.tsx`, Route `zahlungen` zu `finanzen` |

### Neue Tab-Struktur MOD-22

| Nr | Tab | Route |
|----|-----|-------|
| 1 | Kalender und Buchungen | `/portal/petmanager/buchungen` |
| 2 | Leistungen | `/portal/petmanager/leistungen` |
| 3 | Kunden und Tiere | `/portal/petmanager/kunden` |
| 4 | Finanzen | `/portal/petmanager/finanzen` |

### Betroffene Dateien

- `src/manifests/routesManifest.ts` — MOD-22 tiles: `uebersicht` entfernen, `zahlungen` zu `finanzen` umbenennen
- `src/pages/portal/petmanager/PMFinanzen.tsx` — **Neue Datei** (oder PMZahlungen umbenennen)
- `src/pages/portal/petmanager/PMUebersicht.tsx` — **Loeschen**
- `src/components/portal/HowItWorks/moduleContents.ts` — MOD-22 subTiles aktualisieren

---

## Zusammenfassung aller Dateiaenderungen

| Datei | Aktion |
|-------|--------|
| `src/manifests/routesManifest.ts` | Zone 1: 4 Sub-Routes hinzufuegen. Zone 2 MOD-05: fotoalbum->mein-bereich. Zone 2 MOD-22: uebersicht entfernen, zahlungen->finanzen |
| `src/components/admin/AdminSidebar.tsx` | 4 neue Icon-Mappings fuer Petmanager Sub-Seiten |
| `src/pages/admin/petmanager/PetmanagerProvider.tsx` | Neue Datei (Platzhalter) |
| `src/pages/admin/petmanager/PetmanagerFinanzen.tsx` | Neue Datei (Platzhalter) |
| `src/pages/admin/petmanager/PetmanagerServices.tsx` | Neue Datei (Platzhalter) |
| `src/pages/admin/petmanager/PetmanagerMonitor.tsx` | Neue Datei (Platzhalter) |
| `src/pages/portal/pets/PetsMeinBereich.tsx` | Neue Datei (Platzhalter) |
| `src/pages/portal/pets/PetsFotoalbum.tsx` | Loeschen |
| `src/pages/portal/petmanager/PMFinanzen.tsx` | Neue Datei (ersetzt PMZahlungen) |
| `src/pages/portal/petmanager/PMUebersicht.tsx` | Loeschen |
| `src/components/portal/HowItWorks/moduleContents.ts` | subTiles fuer MOD-05 und MOD-22 aktualisieren |

