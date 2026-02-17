
## Pet Desk — Zone 1 Umbau

### Was wird gemacht

Der bestehende "Pet Governance" Admin-Bereich unter `/admin/petmanager` wird umgebaut:

1. **Umbenennung**: "Pet Governance" wird zu **"Pet Desk"** (analog zu Sales Desk, Finance Desk)
2. **Tab-Navigation**: 5 Tabs nach dem Acquiary-Muster (OperativeDeskShell + Tabs + Routes)
3. **Neue Sub-Seiten**: Governance (bisheriges Dashboard), Vorgaenge (neu), Kunden (neu), Shop (neu), Billing (neu)

### Tab-Struktur

| Tab | Pfad | Inhalt |
|-----|------|--------|
| Governance | `/admin/pet-desk` (index) | Bisheriges KPI-Dashboard (Provider, Umsatz, Buchungen) |
| Vorgaenge | `/admin/pet-desk/vorgaenge` | Lead-Qualifizierung, Zuweisungen, offene Anfragen |
| Kunden | `/admin/pet-desk/kunden` | Z1-Kundendatenbank (`pet_z1_customers`) |
| Shop | `/admin/pet-desk/shop` | Service-Katalog-Moderation, Provider-Services |
| Billing | `/admin/pet-desk/billing` | Rechnungen, Zahlungen, Provisionen |

### Technische Umsetzung

**1. `src/pages/admin/desks/PetmanagerDesk.tsx` umbauen**
- Rename zu Router-Komponente mit OperativeDeskShell (wie Acquiary)
- Title: "Pet Desk", Subtitle aktualisieren
- zoneFlow: Z3 "Lennox Website", Z1 "Pet Desk", Z2 "MOD-22 Pet Manager"
- 5 Tabs mit Link-Routing
- Lazy-loaded Sub-Seiten

**2. Neue Sub-Seiten anlegen** (unter `src/pages/admin/petmanager/`)
- `PetDeskGovernance.tsx` — KPI-Dashboard (bestehender Code aus PetmanagerDesk verschoben)
- `PetDeskVorgaenge.tsx` — Placeholder mit OperativeDeskShell-konformem Layout
- `PetDeskKunden.tsx` — Placeholder fuer Z1-Kundenverwaltung (pet_z1_customers)
- `PetDeskShop.tsx` — Placeholder (Services + Provider-Katalog)
- `PetDeskBilling.tsx` — Placeholder (Rechnungen)

**3. Manifests aktualisieren**
- `routesManifest.ts`: Route-Pfade von `petmanager` auf `pet-desk` aendern, neue Sub-Routen hinzufuegen (vorgaenge, kunden, shop, billing)
- `operativeDeskManifest.ts`: `deskId` und `route` auf `pet-desk` aendern, `displayName` auf "Pet Desk"
- Bestehende Sub-Seiten (PetmanagerProvider, PetmanagerServices, PetmanagerFinanzen, PetmanagerMonitor) werden in die neuen Tabs integriert oder als Content innerhalb der neuen Struktur referenziert

**4. Export-Index aktualisieren**
- `src/pages/admin/desks/index.ts`: Export-Name anpassen

### Keine Datenbank-Aenderungen

Rein Frontend-Umbau. Die `pet_z1_customers` Tabelle existiert bereits aus dem vorherigen Schritt.
