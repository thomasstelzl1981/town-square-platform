

## "Mein Bereich" Ausbau + Buchungs-Governance (korrigierter Flow)

### Korrektes Kernprinzip

Der Kunde waehlt den Pet Manager SELBST in Zone 3 aus (z.B. ueber die Provider-Suche oder das Provider-Profil). Die Anfrage wird in Zone 1 getrackt UND geht direkt an den gewaehlten Pet Manager (Z2) weiter. Erst wenn der Pet Manager bestaetigt und die Buchung eintraegt, wird die Buchungsgebuehr beim Kunden ausgeloest.

```text
Kunde (Z3)                   Zone 1 (Tracking)              Pet Manager (Z2)
    |                              |                              |
    |-- waehlt Provider aus ------>|                              |
    |-- Buchungsanfrage ---------->| (trackt + leitet weiter) --->|
    |                              |                              |
    |                              |<-- Bestaetigt + Buchung -----|
    |                              |    eingetragen               |
    |                              |                              |
    |<-- Zahlungsaufforderung -----|                              |
    |   (Buchungsgebuehr)          |                              |
    |                              |                              |
    |-- Zahlung ------------------>| (verbucht) ----------------->|
    |                              |                              |
```

**Wichtige Unterschiede zum vorherigen Plan:**
- Z1 ist NICHT die Stelle, die den Provider auswaehlt -- das macht der Kunde selbst
- Z1 ist die Tracking- und Governance-Schicht (Audit Trail, Gebuehrenabwicklung)
- Die Anfrage geht DIREKT an den vom Kunden gewaehlten Provider
- Die Zahlung wird erst ausgeloest, wenn der Provider bestaetigt hat

---

### 1. Neue Tabelle: `pet_z1_booking_requests`

Ersetzt das aktuelle Speichern von Buchungsanfragen als Freitext in `pet_z1_customers.notes`.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | uuid PK | |
| `tenant_id` | uuid NOT NULL | Mandant (immer Lennox-Tenant) |
| `z1_customer_id` | uuid FK | Verweis auf `pet_z1_customers` (der Kunde) |
| `provider_id` | uuid FK NOT NULL | Vom Kunden gewaehlter Provider |
| `service_title` | text NOT NULL | Gewuenschter Service |
| `preferred_date` | date | Wunschtermin |
| `preferred_time` | text | Wunschzeit (optional) |
| `pet_z1_id` | uuid FK | Verweis auf `pet_z1_pets` (optional) |
| `pet_name` | text | Name des Tieres (Freitext-Fallback) |
| `client_notes` | text | Anmerkungen des Kunden |
| `status` | text NOT NULL DEFAULT 'pending' | Lifecycle (siehe unten) |
| `provider_confirmed_at` | timestamptz | Wann der Provider bestaetigt hat |
| `z2_booking_id` | uuid | Verweis auf `pet_bookings` (nach Bestaetigung) |
| `fee_cents` | integer DEFAULT 0 | Buchungsgebuehr in Cent |
| `payment_status` | text DEFAULT 'none' | `none` / `pending` / `succeeded` / `failed` |
| `payment_intent_id` | text | Stripe Payment Intent (spaeter) |
| `created_at` | timestamptz DEFAULT now() | |
| `updated_at` | timestamptz DEFAULT now() | |

**Status-Lifecycle:**

```text
pending ──> confirmed ──> payment_pending ──> paid ──> active
                |
                └──> rejected
```

- `pending`: Kunde hat Anfrage gestellt, Provider sieht sie
- `confirmed`: Provider hat bestaetigt und Buchung in `pet_bookings` eingetragen
- `payment_pending`: System hat Zahlungsaufforderung an Kunden gesendet
- `paid`: Kunde hat Buchungsgebuehr bezahlt
- `active`: Buchung ist vollstaendig abgeschlossen
- `rejected`: Provider hat abgelehnt

**RLS-Policies:**
- Z3-Kunde: INSERT eigene + SELECT eigene (via `z1_customer_id`)
- Z1-Admin: SELECT alle (Tracking-Dashboard)
- Z2-Provider: SELECT + UPDATE wo `provider_id` dem eigenen Provider entspricht

---

### 2. Aenderungen an "Mein Bereich" (LennoxMeinBereich.tsx)

Kompletter Umbau von 4 Platzhalter-Kacheln zu 2 funktionalen Inline-Sektionen:

**Header (kompakt):**
- Hallo-Begruessung, E-Mail, Telefon, Ort -- alles in einer Zeile/zwei Zeilen
- Abmelden-Button rechts

**Kachel 1: Buchungsanfrage + Status**

Oberer Teil -- Inline-Formular:
- Provider-Dropdown (geladen aus `pet_providers` wo `is_published = true`, Fallback: Lennox & Friends)
- Service-Dropdown (dynamisch basierend auf gewaehltem Provider, geladen aus `pet_services`)
- Wunschtermin (Date-Picker)
- Tier auswaehlen (aus eigenen `pet_z1_pets`, optional)
- Anmerkungen (Textarea)
- "Anfrage senden"-Button

Unterer Teil -- Meine Anfragen (Status-Liste):
- Alle eigenen `pet_z1_booking_requests` mit Status-Badges:
  - Gelb "Angefragt" (pending)
  - Gruen "Bestaetigt" (confirmed)
  - Orange "Zahlung ausstehend" (payment_pending) + Zahlen-Button
  - Gruen-voll "Gebucht" (paid/active)
  - Rot "Abgelehnt" (rejected)

**Kachel 2: Hundeakte (inline CRUD)**
- Tier-Liste mit allen Feldern aus `pet_z1_pets`
- Pro Tier: Stammdaten (Name, Art, Rasse, Geschlecht), Koerperdaten (Geburtsdatum, Gewicht), Identifikation (Chip-Nr, Kastriert), Gesundheit (Tierarzt, Allergien), Notizen
- "Tier hinzufuegen"-Button mit Inline-Formular
- Bearbeiten/Loeschen pro Tier
- Pflichtfelder: nur Name und Tierart

---

### 3. Aenderungen am Pet Desk Vorgaenge (Zone 1)

Der Vorgaenge-Tab bekommt eine neue Sektion "Buchungsanfragen":
- Liest aus `pet_z1_booking_requests` (nicht manuell zuweisen -- nur tracken)
- Zeigt: Kunde, gewaehlter Provider, Service, Datum, Status
- Z1 kann den Status einsehen und bei Problemen eingreifen
- Keine manuelle Provider-Zuweisung mehr noetig (Kunde waehlt selbst)

---

### 4. Aenderungen am Pet Manager (Zone 2)

Im Pet Manager Dashboard oder unter Buchungen erscheinen eingehende Anfragen:
- Liest `pet_z1_booking_requests` wo `provider_id` = eigener Provider und `status = 'pending'`
- Provider kann:
  - **Annehmen**: Erstellt `pet_bookings`-Eintrag (Z2), setzt `pet_z1_booking_requests.status = 'confirmed'` und `z2_booking_id`, `provider_confirmed_at`
  - **Ablehnen**: Setzt Status auf `rejected`
- Nach Annahme: System setzt automatisch `payment_pending` und Kunde sieht Zahlungsaufforderung in Z3

---

### 5. Golden Path GP-PET Erweiterung

Neue Phasen im Lifecycle:

| Phase | Beschreibung | Zone | Task-Kind |
|-------|-------------|------|-----------|
| 3a | Buchungsanfrage | Z3 -> Z1 | service_task |
| 3b | Provider-Bestaetigung | Z2 -> Z1 | user_task |
| 3c | Zahlung Buchungsgebuehr | Z3 -> Z1 | wait_message |

Fail-States:
- `on_rejected`: Provider lehnt ab -> Kunde wird informiert, kann anderen Provider waehlen
- `on_timeout`: Provider reagiert nicht in 48h -> Z1 eskaliert
- `on_payment_failed`: Zahlung fehlgeschlagen -> Buchung bleibt in `payment_pending`, Retry moeglich

---

### 6. Stripe-Zahlungsflow (Platzhalter)

Die Stripe-Integration wird als Status-Feld vorbereitet (`payment_status`, `fee_cents`, `payment_intent_id`). Bis Stripe aktiviert ist, kann Z1 manuell den Status auf `paid` setzen. Der tatsaechliche Stripe-Checkout wird als Folgeschritt implementiert.

---

### Implementierungsreihenfolge

| Schritt | Beschreibung |
|---------|-------------|
| 1 | DB-Migration: `pet_z1_booking_requests` Tabelle + RLS + Trigger |
| 2 | `LennoxMeinBereich.tsx`: Kompletter Umbau mit Buchungsformular + Hundeakte inline |
| 3 | `PetDeskVorgaenge.tsx`: Neue Sektion "Buchungsanfragen" (read-only Tracking) |
| 4 | Pet Manager (Z2): Eingehende Anfragen mit Annehmen/Ablehnen |
| 5 | `GP_PET.ts`: Neue Phasen 3a/3b/3c einfuegen |

**Keine weiteren DB-Migrationen noetig** -- `pet_z1_pets`, `pet_z1_customers`, `pet_providers`, `pet_services`, `pet_bookings` existieren bereits.

