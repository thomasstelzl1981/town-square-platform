

# Hauptperson: Vollstaendige Datenbefuellung + Kachel-Redesign

## Problem (3 Teile)

1. **Trigger kopiert zu wenig**: `handle_new_user()` uebertraegt nur `first_name`, `last_name`, `email` — aber Stammdaten hat auch Strasse, Hausnummer, PLZ, Ort, Telefon (Festnetz + Mobil), Avatar.

2. **Selbstauskunft wird nicht vorbefuellt**: `applicant_profiles` wird bei Erstellung leer angelegt (Zeile 98-106 in SelbstauskunftTab), ohne Daten aus `profiles` zu uebernehmen.

3. **Geschlossene Kachel zeigt zu wenig**: Das aktuelle RecordCard-Design im geschlossenen Zustand zeigt nur Titel + 3-4 Summary-Zeilen. Der Nutzer will alle Kontaktdaten + Foto sichtbar.

---

## Teil 1: Datenbank — Fehlende Spalten + Trigger erweitern

### 1a. Spalten in `household_persons` ergaenzen

Fehlende Spalten hinzufuegen:
- `phone_landline TEXT` (Festnetz — Stammdaten hat es, household_persons nicht)
- `avatar_url TEXT` (Profilbild-URL)

### 1b. Trigger `handle_new_user()` erweitern

Alle verfuegbaren Felder aus den Signup-Metadaten kopieren:

```sql
INSERT INTO public.household_persons (...) VALUES (
  new_org_id, NEW.id, 'hauptperson', true, 0,
  -- Name
  COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
  COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
  NEW.email,
  -- Restliche Felder bleiben NULL (werden spaeter in Stammdaten befuellt)
  NULL, NULL, NULL, NULL, NULL, NULL
);
```

(Strasse, PLZ, Telefon etc. sind bei Signup noch nicht vorhanden — die werden erst in den Stammdaten eingegeben.)

### 1c. Sync-Trigger: Stammdaten-Aenderungen nach household_persons spiegeln

Neuer Trigger auf `profiles` (AFTER UPDATE): Wenn die Hauptperson ihre Stammdaten aendert, werden die matchenden Felder in `household_persons` (is_primary=true, user_id=profiles.id) synchronisiert:

```
profiles.first_name       -> household_persons.first_name
profiles.last_name        -> household_persons.last_name
profiles.street           -> household_persons.street
profiles.house_number     -> household_persons.house_number
profiles.postal_code      -> household_persons.zip
profiles.city             -> household_persons.city
profiles.phone_landline   -> household_persons.phone_landline
profiles.phone_mobile     -> household_persons.phone
profiles.email            -> household_persons.email
profiles.avatar_url       -> household_persons.avatar_url
```

Richtung: Stammdaten -> household_persons (One-Way-Sync fuer Hauptperson).
Zusaetzliche Personen (Partner, Kinder) werden davon nicht betroffen — die werden nur in household_persons direkt editiert.

---

## Teil 2: Selbstauskunft — Vorbefuellung aus Profildaten

### 2a. `SelbstauskunftTab.tsx` — Insert mit Profildaten

Wenn `applicant_profiles` fuer den Tenant noch nicht existiert (Zeile 98-106), werden die vorhandenen `profiles`-Daten als Startwerte eingesetzt:

```typescript
// Vor dem Insert: Profildaten laden
const { data: profileData } = await supabase
  .from('profiles')
  .select('first_name, last_name, email, street, house_number, postal_code, city, phone_landline, phone_mobile')
  .eq('id', user.id)
  .single();

// Insert mit Vorbefuellung
const { data: newProfile } = await supabase
  .from('applicant_profiles')
  .insert({
    tenant_id: activeOrganization.id,
    profile_type: 'private',
    party_role: 'primary',
    // Vorbefuellte Felder:
    first_name: profileData?.first_name,
    last_name: profileData?.last_name,
    email: profileData?.email,
    address_street: profileData?.street ? `${profileData.street} ${profileData.house_number || ''}`.trim() : null,
    address_postal_code: profileData?.postal_code,
    address_city: profileData?.city,
    phone: profileData?.phone_landline,
    phone_mobile: profileData?.phone_mobile,
  })
  .select().single();
```

Alle Felder bleiben vollstaendig editierbar und speicherbar — es ist nur eine Startvorbefuellung.

---

## Teil 3: Geschlossene Kachel — Neues Kompakt-Layout

### 3a. RecordCard Closed-State erweitern

Die aktuelle geschlossene Kachel ist quadratisch (aspect-square, ca. 260px mobil) und zeigt nur Avatar + Titel + 3-4 Summary-Zeilen. Das reicht nicht fuer 11 Felder + Foto.

**Neues Layout (geschlossener Zustand)**:

```
+------------------------------------------+
|  [Badge: Hauptperson]                    |
|                                          |
|  +------+  Name Nachname                |
|  | FOTO |  Anrede                       |
|  | 64x64|  Geb.: 01.01.1980            |
|  +------+                               |
|                                          |
|  Strasse 12                              |
|  80331 Muenchen                          |
|                                          |
|  Tel: +49 89 123456                      |
|  Mob: +49 170 123456                     |
|  max@example.de                          |
|                                     [>]  |
+------------------------------------------+
```

**Umsetzung**: Neues optionales Prop `compactDetails` an RecordCard, das eine strukturierte Kontakt-Ansicht rendert statt der generischen Summary-Liste. Alternativ (einfacher): Die `summary`-Liste auf 8-10 Eintraege erweitern und das `.slice(0, 4)` Limit in RecordCard entfernen bzw. dynamisch machen.

### 3b. Konkreter Ansatz

In `RecordCard.tsx` im geschlossenen Zustand:
- Das `.slice(0, 4)` Limit auf die Summary-Liste entfernen
- Layout aendern: Foto links, Daten rechts (statt alles zentriert uebereinander)
- Alle uebergebenen Summary-Felder rendern

In `UebersichtTab.tsx`: Die Summary-Daten um alle gewuenschten Felder erweitern:

```typescript
summary={[
  ...(person.salutation ? [{ label: 'Anrede', value: person.salutation }] : []),
  ...(person.street ? [{ label: 'Strasse', value: `${person.street} ${person.house_number || ''}` }] : []),
  ...(person.zip ? [{ label: 'PLZ/Ort', value: `${person.zip} ${person.city || ''}` }] : []),
  ...(person.birth_date ? [{ label: 'Geb.', value: new Date(person.birth_date).toLocaleDateString('de-DE') }] : []),
  ...(person.phone_landline ? [{ label: 'Tel.', value: person.phone_landline }] : []),
  ...(person.phone ? [{ label: 'Mobil', value: person.phone }] : []),
  ...(person.email ? [{ label: 'E-Mail', value: person.email }] : []),
]}
```

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| SQL-Migration | `household_persons` +2 Spalten, Trigger erweitern, Sync-Trigger neu |
| `src/components/shared/RecordCard.tsx` | Closed-State: Layout umbauen (Foto links, Daten rechts, kein 4er-Limit) |
| `src/pages/portal/finanzanalyse/UebersichtTab.tsx` | Summary um alle Felder erweitern, avatar_url/phone_landline nutzen |
| `src/pages/portal/finanzierung/SelbstauskunftTab.tsx` | Insert mit Profildaten vorbefuellen |

## Ergebnis

- Neue Accounts: Hauptperson sofort mit Name + E-Mail angelegt
- Stammdaten-Aenderungen: Automatisch in household_persons gespiegelt
- Selbstauskunft: Beim ersten Oeffnen mit allen verfuegbaren Profildaten vorbefuellt, alles editierbar
- Geschlossene Kachel: Zeigt Foto + alle 11 Kontaktfelder in kompaktem Layout

