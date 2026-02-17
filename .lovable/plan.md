

## Erweitertes Konzept: Lennox Website mit Nutzer-Profil + Buchung

### Ueberblick

Statt eines einfachen Registrierungsformulars bekommt die Lennox-Website ein vollstaendiges **Profil-System** mit Login. Eingeloggte Nutzer koennen ihr Halter-Profil und Tier-Daten verwalten und direkt bei einem Provider buchen. Alle Profile landen automatisch in Zone 1 Pet Desk unter "Kunden".

### Datenfluss

```text
Zone 3 (Lennox Website)                  Zone 1 (Pet Desk)
────────────────────────                  ──────────────────
/website/tierservice/login                Kunden-Tab
  - Auth via Supabase Auth                  pet_z1_customers
  - Login / Registrierung                   (user_id verknuepft)
                                            status: new → qualified → assigned
/website/tierservice/profil
  - Halter: Name, Adresse,
    Telefon, E-Mail
  - Tiere: Name, Rasse, Geburt,
    Gewicht, Chip-Nr. (pet_z1_pets)
  - Bearbeiten + Loeschen

/website/tierservice/anbieter/:id
  - "Jetzt buchen" (nur eingeloggt)       Vorgaenge-Tab
  - Erstellt Buchungsanfrage                pet_bookings (status: 'requested')
```

### Was wird gebaut

**1. Datenbank-Aenderungen**

Neue Tabelle `pet_z1_pets`:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| z1_customer_id | uuid FK pet_z1_customers | Halter-Referenz |
| tenant_id | uuid FK organizations | Mandant |
| name | text NOT NULL | Tiername |
| species | pet_species DEFAULT 'dog' | Tierart (bestehender Enum) |
| breed | text | Rasse |
| gender | pet_gender | Geschlecht (bestehender Enum) |
| birth_date | date | Geburtsdatum |
| weight_kg | numeric | Gewicht |
| chip_number | text | Chip-Nr. |
| neutered | boolean DEFAULT false | Kastriert |
| allergies | text[] | Allergien |
| notes | text | Notizen |
| created_at | timestamptz | |

Neue Spalten in `pet_z1_customers`:
- `city` (text) — Ort
- `postal_code` (text) — PLZ

RLS fuer `pet_z1_pets`:
- SELECT: platform_admin ODER eigener user_id ueber z1_customer_id
- INSERT: authentifizierter User, wenn z1_customer_id.user_id = auth.uid()
- UPDATE: eigener user_id ueber z1_customer_id
- DELETE: eigener user_id ueber z1_customer_id ODER platform_admin

RLS Erweiterung `pet_z1_customers`:
- Neue Policy: Authentifizierte User duerfen ihren eigenen Eintrag (user_id = auth.uid()) lesen und bearbeiten
- Neue Policy: Authentifizierte User duerfen einen neuen Eintrag mit eigenem user_id anlegen (Signup-Trigger)

**2. Neue Zone-3-Seiten**

| Seite | Route | Beschreibung |
|-------|-------|-------------|
| `LennoxAuth.tsx` | `/website/tierservice/login` | Login + Registrierung (E-Mail/Passwort) |
| `LennoxProfil.tsx` | `/website/tierservice/profil` | Halter-Profil anzeigen/bearbeiten |
| `LennoxMeineTiere.tsx` | `/website/tierservice/profil/tiere` | Tiere verwalten (CRUD auf pet_z1_pets) |
| `LennoxBuchen.tsx` | `/website/tierservice/anbieter/:providerId/buchen` | Buchungsformular (Service waehlen, Datum, Notizen) |

**3. Auth-Flow**

- Registrierung: E-Mail + Passwort ueber Supabase Auth
- Bei Registrierung: Edge Function `sot-pet-profile-init` erstellt automatisch einen `pet_z1_customers`-Eintrag mit `user_id = auth.uid()`, `source = 'website'`, `status = 'new'`
- Login: Standard Supabase Auth
- Profil-Seite: Laedt den eigenen `pet_z1_customers`-Eintrag ueber `user_id`
- Der bestehende `/auth`-Flow der Plattform wird NICHT beruehrt — die Lennox-Auth ist eigenstaendig

**4. Edge Function: `sot-pet-profile-init`**

- Trigger: Wird nach erfolgreicher Registrierung ueber die Lennox-Website aufgerufen
- Erstellt `pet_z1_customers`-Eintrag mit Default-Tenant (Lennox-Franchise-Tenant)
- Prueft Duplikate (E-Mail bereits vorhanden)
- Returned: customer_id

**5. Navigation aktualisieren: `LennoxLayout.tsx`**

- Neuer Nav-Link: "Mein Profil" → `/website/tierservice/profil` (nur sichtbar wenn eingeloggt)
- "Login" / "Registrieren" Button → `/website/tierservice/login` (nur sichtbar wenn NICHT eingeloggt)
- Auth-State via `supabase.auth.onAuthStateChange`

**6. Provider-Detail CTA aktualisieren**

- `LennoxProviderDetail.tsx`: "Jetzt buchen" fuehrt zu `/website/tierservice/anbieter/:id/buchen` wenn eingeloggt
- Wenn NICHT eingeloggt: Redirect zu Login mit Return-URL

**7. Pet Desk Kunden-Tab (`PetDeskKunden.tsx`)**

- Query `pet_z1_customers` mit Status-Badges (new, qualified, assigned)
- Anzeige verknuepfter `pet_z1_pets` als aufklappbare Liste
- Quick-Actions: Status aendern, Provider zuweisen

### Routen-Registrierung

```text
lennox.routes += [
  { path: "login",                  component: "LennoxAuth" },
  { path: "profil",                 component: "LennoxProfil" },
  { path: "profil/tiere",           component: "LennoxMeineTiere" },
  { path: "anbieter/:providerId/buchen", component: "LennoxBuchen" },
]
```

### Zusammenfassung der Dateien

| Datei | Aktion |
|-------|--------|
| DB Migration | NEU — `pet_z1_pets` Tabelle, `pet_z1_customers` Spalten + RLS |
| `supabase/functions/sot-pet-profile-init/index.ts` | NEU — Profil-Init nach Registrierung |
| `src/pages/zone3/lennox/LennoxAuth.tsx` | NEU — Login/Registrierung |
| `src/pages/zone3/lennox/LennoxProfil.tsx` | NEU — Halter-Profil |
| `src/pages/zone3/lennox/LennoxMeineTiere.tsx` | NEU — Tier-Verwaltung |
| `src/pages/zone3/lennox/LennoxBuchen.tsx` | NEU — Buchungsformular |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | EDIT — Auth-aware Navigation |
| `src/pages/zone3/lennox/LennoxProviderDetail.tsx` | EDIT — Buchen-CTA mit Auth-Check |
| `src/manifests/routesManifest.ts` | EDIT — Neue Routen |
| `src/router/ManifestRouter.tsx` | EDIT — Lazy Imports |
| `src/pages/admin/petmanager/PetDeskKunden.tsx` | EDIT — Z1-Kundenliste mit Tieren |

