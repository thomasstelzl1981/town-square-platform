

## MOD-22 Pet Manager: Profil-Tab + Akten-Systematik + Modul-Kreislauf-Definition

### Ist-Zustand: Was existiert bereits?

**Vorhandene "Akten" im Haustier-Kreislauf:**

| Akte | Wo? | Status | Datenquelle |
|------|-----|--------|-------------|
| Tier-Akte (persoenlich) | MOD-05 /portal/pets/:petId | Vorhanden | `pets` (owner_user_id) |
| Tier-Akte (Business) | MOD-22 /portal/petmanager/kunden | Inline in Kunden-Ansicht | `pets` (customer_id) |
| Mitarbeiter-Akte | MOD-22 /portal/petmanager/mitarbeiter | Vorhanden (Vertikales Widget) | `pet_staff` |
| Kunden-Akte | MOD-22 /portal/petmanager/kunden | Vorhanden (Liste + Inline) | `pet_customers` |
| **Provider-Profil (Werbeprofil)** | **FEHLT** | Nicht vorhanden | `pet_providers` (Felder vorhanden!) |

**Preise:** Bereits in `pet_services` definiert (PMLeistungen.tsx). Price_cents, price_type (fixed/hourly/daily/per_session/on_request) sind vollstaendig modelliert. Diese koennen im Profil-Tab uebernommen (read-only Anzeige) werden.

**DB-Felder in `pet_providers` bereits vorhanden:**
- `company_name`, `bio`, `cover_image_url`, `gallery_images[]`
- `address`, `phone`, `email`
- `operating_hours` (JSONB), `facility_type`
- `service_area_postal_codes[]`, `rating_avg`

---

### Kompletter Kreislauf "Modulwelt Haustiere"

```text
ZONE 3 — Lennox & Friends Website (/website/tierservice)
  Startseite, Partner-Profil, Shop, Partner werden, Login, Mein Bereich
       |                    ^
       v                    | (Profil-Daten fliessen hierher)
ZONE 1 — Pet Desk (/admin/pet-desk)
  Governance | Vorgaenge | Kunden | Shop | Billing
       |
       v
ZONE 2 — Pet Manager MOD-22 (/portal/petmanager)
  Dashboard | Profil [NEU] | Pension | Services | Mitarbeiter | Kunden | Finanzen
       |
ZONE 2 — Pets MOD-05 (/portal/pets) [Client-Modul]
  Meine Tiere | Caring | Shop | Mein Bereich
```

---

### Was wird gebaut?

**1. Neuer Tile "Profil" in MOD-22**

Route: `/portal/petmanager/profil`
Komponente: `PMProfil.tsx`

Aufbau (vertikal, scrollbar):

1. **Bilder-Sektion**
   - Cover-Bild (Drag-and-Drop Upload)
   - Galerie-Bilder (bis zu 6 Bilder, Drag-and-Drop)
   - Quelle: `pet_providers.cover_image_url` + `pet_providers.gallery_images`

2. **Beschreibung**
   - Firmenname, Bio/Beschreibungstext, Facility-Typ
   - Quelle: `pet_providers.company_name`, `bio`, `facility_type`

3. **Kontakt / Ansprechpartner**
   - Adresse, Telefon, E-Mail, Oeffnungszeiten
   - Quelle: `pet_providers.address`, `phone`, `email`, `operating_hours`

4. **Angebotene Services** (Read-Only Referenz)
   - Auflistung der aktiven Services aus `pet_services`
   - Hinweis: "Services werden unter Leistungen verwaltet"
   - Keine Doppelpflege — Preise kommen aus PMLeistungen

5. **Preise** (Read-Only Uebersicht)
   - Automatische Uebernahme aus `pet_services` (price_cents + price_type)
   - Keine separate Preispflege hier, da bereits in PMLeistungen definiert

6. **Vorschau-Button**
   - Link zum oeffentlichen Profil auf Zone 3: `/website/tierservice/partner/{provider_id}`

**2. Manifest-Update**

In `routesManifest.ts` wird der Tile "Profil" als zweiter Eintrag nach Dashboard eingefuegt:

```text
tiles: [
  { path: "dashboard", ..., default: true },
  { path: "profil", component: "PMProfil", title: "Profil" },   // NEU
  { path: "pension", ... },
  { path: "services", ... },
  ...
]
```

**3. PetManagerPage.tsx Router-Update**

Neue lazy Route fuer `PMProfil` hinzufuegen.

**4. GP-PET Golden Path Update**

Die Provider-Profil-Akte wird als Phase in den Golden Path aufgenommen:
- `profile_complete`: Pruefen ob `bio`, `cover_image_url` und mindestens 1 aktiver Service vorhanden

---

### Akten-Uebersicht (Konsolidiert)

Nach Umsetzung hat die Modulwelt Haustiere folgende Akten:

| # | Akte | Zone | Route | Datentabelle |
|---|------|------|-------|-------------|
| 1 | Provider-Profil | Z2 (MOD-22) | /portal/petmanager/profil | `pet_providers` |
| 2 | Kunden-Akte | Z2 (MOD-22) | /portal/petmanager/kunden | `pet_customers` + `pets` |
| 3 | Mitarbeiter-Akte | Z2 (MOD-22) | /portal/petmanager/mitarbeiter | `pet_staff` + `pet_staff_vacations` |
| 4 | Tier-Akte (Business) | Z2 (MOD-22) | Inline in Kunden-Akte | `pets` (via customer_id) |
| 5 | Tier-Akte (Persoenlich) | Z2 (MOD-05) | /portal/pets/:petId | `pets` (via owner_user_id) |
| 6 | Z1-Kundenprofil | Z1 | /admin/pet-desk/kunden | `pet_z1_customers` |

---

### Technische Dateien

| Datei | Aktion |
|-------|--------|
| `src/pages/portal/petmanager/PMProfil.tsx` | NEU — Provider-Profilseite |
| `src/pages/portal/PetManagerPage.tsx` | EDIT — Lazy-Import + Route fuer PMProfil |
| `src/manifests/routesManifest.ts` | EDIT — Tile "profil" in MOD-22 einfuegen |
| `src/manifests/goldenPaths/GP_PET.ts` | EDIT — Phase "profile_complete" hinzufuegen |

### Abgrenzung zum bestehenden Portal

MOD-22 ist ein eigenstaendiger Franchise-Kreislauf — vergleichbar mit MOD-12 (Akquisemanager) oder MOD-11 (Finanzierungsmanager). Die Datenisolierung erfolgt ueber:
- `pet_providers.user_id` (Provider-Zuordnung)
- `pet_customers.provider_id` (Kunden gehoeren zum Provider)
- MOD-05 nutzt `owner_user_id` — komplett getrennt

Der Kreislauf ist: **Z3 Lead -> Z1 Governance -> Z2 Provider-Betrieb** (und parallel Z2 MOD-05 fuer Endkunden).

