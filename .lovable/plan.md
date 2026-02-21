
# Plan: Zone-3 Login/Registrierung und Manager-Bewerbungs-Workflow

## Ueberblick

Zwei getrennte Flows auf den Zone-3 Websites:

1. **Kunden-Registrierung (direkt):** User registriert sich, bekommt sofort 14 Basis-Module, wird zum Portal weitergeleitet. Kein Manager-Modul.
2. **Manager-Bewerbung (nur Bewerbung):** Interessent fuellt Bewerbungsformular auf der Karriere-Seite aus. Es wird ein Eintrag in `manager_applications` erstellt. Kein Login, kein Portal-Zugang. Erst nach Freischaltung durch Zone 1 erhaelt der Manager eine E-Mail mit Zugangsdaten.

### Brand-zu-Modul Zuordnung

| Brand | Manager-Module bei Bewerbung | Kunden-Login |
|---|---|---|
| **Kaufy** | MOD-09, MOD-10, MOD-11, MOD-12, MOD-13 (alle ausser Pet) | Ja, direkt via `/auth` |
| **FutureRoom** | MOD-09, MOD-10, MOD-11, MOD-12, MOD-13 (alle ausser Pet) | Ja, direkt via `/website/futureroom/login` |
| **Acquiary** | MOD-09, MOD-10, MOD-11, MOD-12, MOD-13 (alle ausser Pet) | Nein (kein Kunden-Login noetig, reine Akquise-Plattform) |
| **SoT** | MOD-09, MOD-10, MOD-11, MOD-12, MOD-13 (alle ausser Pet) | Ja, direkt via `/auth` |
| **Lennox** | MOD-22 (Pet Manager), MOD-10 (Lead Manager) | Ja, eigenes Z3-Auth (`useZ3Auth`) — bleibt getrennt |

---

## Ist-Zustand der Karriere-Seiten

| Brand | Seite | Bewerbungsformular | Schreibt nach | Problem |
|---|---|---|---|---|
| FutureRoom | `/website/futureroom/karriere` | Ja, vollstaendig | Nirgends (simuliert mit `setTimeout`) | Kein DB-Insert |
| Acquiary | `/website/acquiary/karriere` | Nein (CTA linkt zu `/acquiary/objekt`) | -- | Kein Formular |
| Lennox | `/website/tierservice/partner-werden` | Ja | `pet_z1_customers` | Schreibt in falsche Tabelle |
| Kaufy | `/website/kaufy/vertrieb` | Nein (CTA linkt zu `/auth`) | -- | Kein Bewerbungsformular |
| SoT | `/website/sot/karriere` | Nein (nur 3 Info-Bloecke) | -- | Kein Formular |

---

## Loesung

### Teil 1: Shared Manager-Bewerbungs-Komponente

**Neue Datei: `src/components/zone3/shared/ManagerApplicationForm.tsx`**

Eine wiederverwendbare Bewerbungskomponente, die:
- Name, E-Mail, Telefon, Qualifikation, Nachricht abfragt
- Branchenspezifische Felder per Props steuert (z.B. §34i fuer FutureRoom, Immobilienerfahrung fuer Acquiary, Hundedienst-Art fuer Lennox)
- In `manager_applications` schreibt (INSERT mit `requested_role`, `qualification_data`, `status: 'submitted'`, `source_brand`)
- Kein Login/Signup ausloest -- nur eine Bewerbung
- Design per Props/CSS-Klassen an die jeweilige Brand anpassbar (Farbschema, Buttons)

**Interface:**
```text
ManagerApplicationForm({
  brand: 'futureroom' | 'acquiary' | 'kaufy' | 'sot' | 'lennox',
  requestedRoles: membership_role[],    // z.B. ['finance_manager'] oder ['pet_manager', 'sales_partner']
  qualificationFields: QualField[],     // Branchenspezifische Felder
  className?: string,
  colorScheme?: { primary: string, ... },
  onSuccess?: () => void,
})
```

### Teil 2: Karriere-Seiten aktualisieren (5 Dateien)

**FutureRoomKarriere.tsx:**
- Bestehender Content bleibt (Benefits, Rolle, Anforderungen)
- Formular-Sektion ersetzt durch `<ManagerApplicationForm brand="futureroom" requestedRoles={['finance_manager']} />`
- Qualifikationsfeld: §34i GewO (ja/in Beantragung/nein), Erfahrung Baufinanzierung

**AcquiaryKarriere.tsx:**
- Bestehender Content bleibt
- CTA-Button aendern: statt Link zu `/acquiary/objekt` → Scroll zu Bewerbungsformular
- `<ManagerApplicationForm brand="acquiary" requestedRoles={['akquise_manager']} />` hinzufuegen
- Qualifikationsfeld: Immobilienerfahrung, Regionales Netzwerk

**Kaufy2026Vertrieb.tsx:**
- Bestehender Content bleibt (Tracks, Features)
- CTA-Buttons aendern: statt Link zu `/auth` → Scroll zu Bewerbungsformular
- `<ManagerApplicationForm brand="kaufy" requestedRoles={['sales_partner']} />` hinzufuegen
- Qualifikationsfeld: §34c GewO, VSH

**SotKarriere.tsx:**
- Erweitern: Statt nur 3 Info-Bloecke → vollstaendige Karriere-Seite mit Formular
- `<ManagerApplicationForm brand="sot" requestedRoles={['sales_partner']} />` hinzufuegen
- Als "Hub" -- erklaert alle Manager-Rollen, Formular fragt gewuenschte Rolle ab

**LennoxPartnerWerden.tsx:**
- Bestehender Content bleibt (Vision, Benefits, Hero)
- Formular umstellen: statt `pet_z1_customers` INSERT → `manager_applications` INSERT
- `<ManagerApplicationForm brand="lennox" requestedRoles={['pet_manager']} />` hinzufuegen
- Qualifikationsfeld: Angebotene Leistung(en), Region

### Teil 3: Kunden-Login auf Karriere-Seiten trennen

Die Karriere-Seiten sind NUR fuer Bewerbungen. Login-Links auf den Websites bleiben wie sie sind:
- **Kaufy**: `/auth` → Portal-Login (unveraendert)
- **SoT**: `/auth` → Portal-Login (unveraendert)
- **FutureRoom**: `/website/futureroom/login` → Kunden-Login (unveraendert)
- **Lennox**: `/website/tierservice/login` → Z3-Kunden-Login (unveraendert, eigenes Auth-System)
- **Acquiary**: Kein Kunden-Login (reine B2B-Plattform)

### Teil 4: DB-Erweiterung fuer manager_applications

Die Tabelle existiert bereits. Erweiterung um:
- `source_brand` (text): Welche Website die Bewerbung ausgeloest hat (kaufy/futureroom/acquiary/sot/lennox)
- RLS-Policy: Anonymous INSERT erlauben (Public-Formular ohne Login), SELECT nur fuer den eigenen Tenant oder Admins

---

## Workflow-Ablauf (End-to-End)

```text
1. Interessent besucht z.B. /website/futureroom/karriere
2. Liest Benefits, Anforderungen
3. Fuellt Bewerbungsformular aus (Name, E-Mail, §34i, Erfahrung)
4. Klickt "Bewerbung absenden"
5. INSERT in manager_applications:
   - requested_role: 'finance_manager'
   - qualification_data: { has_34i: 'yes', experience: '3-5', ... }
   - status: 'submitted'
   - source_brand: 'futureroom'
   - tenant_id: NULL (noch kein Tenant!)
   - user_id: NULL (noch kein User!)
6. Bestaetigung: "Bewerbung eingegangen. Wir melden uns innerhalb von 48h."

--- Zone 1 ---
7. Admin sieht Bewerbung in /admin/manager-freischaltung
8. Admin prueft Qualifikation
9. Admin genehmigt:
   a. System erstellt User (supabase.auth.admin.createUser)
   b. handle_new_user() erstellt Client-Tenant + 14 Basis-Module
   c. Admin-Logik: org_type → 'partner', membership_role → 'finance_manager'
   d. Tile MOD-11 aktivieren
   e. Willkommens-E-Mail mit Login-Link senden
10. Manager loggt sich ein → sieht 14 Basis + MOD-11
```

---

## Technische Details

### Neue/Geaenderte Dateien

| Datei | Aktion | Modul-Zuordnung |
|---|---|---|
| `src/components/zone3/shared/ManagerApplicationForm.tsx` | NEU | Kein Modul (shared Z3) |
| `src/pages/zone3/futureroom/FutureRoomKarriere.tsx` | AENDERN | Kein Modul (Z3) |
| `src/pages/zone3/acquiary/AcquiaryKarriere.tsx` | AENDERN | Kein Modul (Z3) |
| `src/pages/zone3/kaufy2026/Kaufy2026Vertrieb.tsx` | AENDERN | Kein Modul (Z3) |
| `src/pages/zone3/sot/SotKarriere.tsx` | AENDERN | Kein Modul (Z3) |
| `src/pages/zone3/lennox/LennoxPartnerWerden.tsx` | AENDERN | Kein Modul (Z3) |
| Migration SQL | NEU | DB |
| `src/pages/admin/ManagerFreischaltung.tsx` | AENDERN | Kein Modul (Z1 Admin) |

### DB-Migration

```text
-- source_brand Spalte hinzufuegen
ALTER TABLE manager_applications ADD COLUMN IF NOT EXISTS source_brand text;

-- tenant_id und user_id nullable machen (Bewerbung ohne Account)
ALTER TABLE manager_applications ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE manager_applications ALTER COLUMN user_id DROP NOT NULL;

-- RLS: Anonymous INSERT fuer Bewerbungen
CREATE POLICY "anon_can_apply" ON manager_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'submitted');

-- RLS: Nur Admins koennen lesen
CREATE POLICY "admin_can_read_applications" ON manager_applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

### ManagerFreischaltung.tsx Erweiterung

Die Zone-1 Seite muss um Schritt 9 erweitert werden:
- Bei "Genehmigen" → Edge Function aufrufen die:
  1. User erstellt (supabase.auth.admin.createUser mit E-Mail + generiertem Passwort)
  2. Willkommens-E-Mail versendet (mit Link zu Password-Reset)
  3. Org-Type upgraded
  4. Tiles aktiviert

Dies erfordert eine neue Edge Function `sot-manager-activate` die diese Schritte atomar ausfuehrt.

### Keine Modul-Freezes betroffen

Alle geaenderten Dateien liegen in Zone 3 (`src/pages/zone3/`) oder Zone 1 Admin (`src/pages/admin/`), die nicht in der Modul-Freeze-Matrix enthalten sind.

---

## Was NICHT in diesem Schritt umgesetzt wird

- Zone-2 Bewerbungsformular (fuer bestehende User die Manager werden wollen) → spaetere Phase
- Kunden-Zuweisung UI (org_link + org_delegation) → spaetere Phase
- E-Mail-Templates fuer Willkommens-E-Mail → spaetere Phase (vorerst Standard-Reset-E-Mail)
- SoT-Karriereseite als "Hub" fuer alle Rollen → kann einfach gehalten werden mit Verweis auf die Brand-spezifischen Seiten
