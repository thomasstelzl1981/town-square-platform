
# Lennox & Friends — Website Redesign + Pet-Card Datenstandard (SSOT)

## 1. Pet-Card Datenstandard (SSOT für Z1/Z2/Z3)

Die Z2 `pets`-Tabelle (MOD-05 Haustiere) ist die **Vorlage** und wird NICHT verändert.
Die Z1/Z3 `pet_z1_pets`-Tabelle wurde erweitert, um den gleichen Feldstandard abzubilden.

### Feld-Matrix

| Feld | Z3 Minimum (Quick) | Z1/Z3 Standard (Profil) | Z2 Vollständig (MOD-05) | Tabelle |
|------|:---:|:---:|:---:|---------|
| **Tiername** | ✅ Pflicht | ✅ | ✅ | `name` |
| **Tierart** | ✅ Pflicht | ✅ | ✅ | `species` (Enum: dog, cat, bird, rabbit, hamster, fish, reptile, horse, other) |
| **Rasse** | — | ✅ | ✅ | `breed` |
| **Geschlecht** | — | ✅ | ✅ | `gender` (Enum: male, female, unknown) |
| **Geburtsdatum** | — | ✅ | ✅ | `birth_date` |
| **Gewicht (kg)** | — | ✅ | ✅ | `weight_kg` |
| **Chip-Nr.** | — | ✅ | ✅ | `chip_number` |
| **Kastriert** | — | ✅ | ✅ | `neutered` |
| **Tierarzt** | — | ✅ | ✅ | `vet_name` |
| **Allergien** | — | ✅ | ✅ | `allergies` (text[]) |
| **Foto** | — | ✅ | ✅ | `photo_url` |
| **Notizen** | — | ✅ | ✅ | `notes` |
| **Versicherer** | — | — | ✅ nur Z2 | `insurance_provider` |
| **Policen-Nr.** | — | — | ✅ nur Z2 | `insurance_policy_no` |
| **Impfhistorie** | — | — | ✅ nur Z2 | `pet_vaccinations` (Relation) |
| **Krankengeschichte** | — | — | ✅ nur Z2 | `pet_medical_records` (Relation) |
| **Pflege-Timeline** | — | — | ✅ nur Z2 | `pet_caring_events` (Relation) |
| **Lennox Tracker** | — | — | ✅ nur Z2 | Placeholder (Shop-Link) |
| **DMS-Tree** | — | — | ✅ nur Z2 | `EntityStorageTree` |

### Halter-Daten (pet_z1_customers)

| Feld | Z3 Minimum | Z1/Z3 Standard | Spalte |
|------|:---:|:---:|--------|
| **Vorname** | ✅ Pflicht | ✅ | `first_name` |
| **Nachname** | ✅ Pflicht | ✅ | `last_name` |
| **E-Mail** | ✅ Pflicht | ✅ | `email` |
| **Telefon** | ✅ Pflicht | ✅ | `phone` |
| **Straße** | — | ✅ | `address` |
| **PLZ** | — | ✅ | `postal_code` |
| **Ort** | — | ✅ | `city` |

### Datentransfer Z1 → Z2

Bei Zuweisung eines Z1-Kunden an einen Z2-Provider werden die Daten aus `pet_z1_pets` in die `pets`-Tabelle übertragen. Die Felder `insurance_provider` und `insurance_policy_no` werden erst in Z2 ergänzt.

---

## 2. CI / Look & Feel (Alpine Modern)

### Logos (in `src/assets/logos/`)
- `lennox_logo_main.jpeg` — Hauptlogo (LF + Berge + Hunde, Tannengrün)
- `lennox_logo_minimal.jpeg` — Minimallogo (Lineart, nur Hunde + Text)
- `lennox_logo_patch.jpeg` — Patch-Style (Tannengrün auf Offwhite)
- `lennox_logo_badge.jpeg` — Badge rund (Berge + Hunde im Kreis)

### Hero-Bild
- `src/assets/lennox/hero_alpine.jpg` — Generiert, zwei Labradors auf Almwiese mit Bergpanorama

### Farbschema
- Tannengrün: `hsl(155, 35%, 25%)` — Primary
- Offwhite: `hsl(40, 30%, 97%)` — Background
- Sand: `hsl(35, 30%, 85%)` — Borders/Muted
- Neon Coral: `hsl(10, 85%, 60%)` — Akzent (nur Hover/Badge)
- Dunkelgrün Text: `hsl(155, 25%, 15%)` — Foreground

---

## 3. Seitenstruktur (4 Bereiche)

| Route | Komponente | Beschreibung |
|-------|-----------|-------------|
| `/website/tierservice` | LennoxStartseite | One-Pager: Hero → Partnerfinder → Trust → Shop-Teaser → Partner-CTA |
| `/website/tierservice/partner/:slug` | LennoxPartnerProfil | Dynamisches Partnerprofil mit Service-Kacheln + Inline-Booking |
| `/website/tierservice/shop` | LennoxShop | Lennox Essentials + Affiliate |
| `/website/tierservice/partner-werden` | LennoxPartnerWerden | Bewerbungsformular → Z1 Intake |
| `/website/tierservice/login` | LennoxAuth | Login / Registrierung |
| `/website/tierservice/mein-bereich` | LennoxMeinBereich | Dashboard: Tiere, Buchungen, Einstellungen |

### Startseite — Zwei Zustände

**A) Vor Suche:** Hero groß + Standort-Widget + Trust + Shop-Teaser + Partner-CTA
**B) Nach Suche:** Hero kompakt + Partner-Kacheln (Bild, Name, Ort, 2 Tags, Rating) + gleicher Rest

### Partnerprofil — Standardisiert

- Partner Hero (Bild, Name, Region, Badge "Geprüfter Partner")
- Service-Module (max 4 Kacheln mit Service-Tags aus `pet_service_category` Enum)
- Booking Block (inline): Datum, "5 € Anzahlung", Login-Check, Tier auswählen/Quick-Form
- Galerie + Kontakt

### Zwei Buchungspfade

1. **Mit Profil:** Eingeloggt → Tier auswählen aus `pet_z1_pets` → Buchung senden
2. **Ohne Profil (Quick):** Minimalpflichtfelder inline → Erstellt `pet_z1_customers` (source: 'website_quick') + `pet_z1_pets`

---

## 4. Navigation (LennoxLayout)

```
[Logo]                    [Shop] [Partner werden] [Login/Mein Bereich]
```

---

## 5. Acceptance Criteria

1. ✅ Startseite zeigt NIE globale Leistungen
2. ✅ Partner-Kacheln NUR nach Standort/Ort
3. ✅ Klick auf Partner → sofort Partnerprofil (kein Zwischenscreen)
4. ✅ Leistungen nur im Partnerprofil (max 4 Kacheln)
5. ✅ Booking → Zone 1 Lennox Desk Intake
6. ✅ Schnellbuchung ohne Login mit Minimalpflichtfeldern
7. ✅ Pet-Card Datenstandard konsistent über Z1/Z2/Z3

---

## 6. Dateien-Übersicht

| Datei | Aktion |
|-------|--------|
| `src/pages/zone3/lennox/LennoxStartseite.tsx` | NEU |
| `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` | NEU |
| `src/pages/zone3/lennox/LennoxShop.tsx` | NEU |
| `src/pages/zone3/lennox/LennoxPartnerWerden.tsx` | NEU |
| `src/pages/zone3/lennox/LennoxMeinBereich.tsx` | NEU |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | EDIT — Alpine CI + neue Navigation |
| `src/pages/zone3/lennox/LennoxAuth.tsx` | EDIT — Redirect zu /mein-bereich |
| `src/pages/zone3/lennox/LennoxHome.tsx` | ENTFERNEN |
| `src/pages/zone3/lennox/LennoxUeberUns.tsx` | ENTFERNEN |
| `src/pages/zone3/lennox/LennoxProfil.tsx` | ENTFERNEN |
| `src/pages/zone3/lennox/LennoxMeineTiere.tsx` | ENTFERNEN (→ MeinBereich) |
| `src/pages/zone3/lennox/LennoxBuchen.tsx` | ENTFERNEN (→ PartnerProfil) |
| `src/pages/zone3/lennox/LennoxProviderDetail.tsx` | ENTFERNEN (→ PartnerProfil) |
| `src/manifests/routesManifest.ts` | EDIT |
| `src/router/ManifestRouter.tsx` | EDIT |
