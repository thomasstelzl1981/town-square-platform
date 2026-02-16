
# Caring-Seite: Auto-Anzeige + Lennox & Friends Demo-Provider

## Uebersicht

Drei Aenderungen:
1. Ergebnisse sofort beim Seitenaufruf anzeigen (ohne erst "Suchen" zu klicken)
2. Den bestehenden Demo-Provider "Pfoetchen Paradies" durch **Lennox & Friends Dog Resorts** ersetzen (mit echten Daten von der Website)
3. Alle neuen IDs in der Demo-Engine registrieren

## 1. Auto-Anzeige der Ergebnisse

**Datei: `src/pages/portal/pets/PetsCaring.tsx`**

- `searchTriggered` wird initial auf `true` gesetzt statt `false`
- Das Ergebnis-Grid wird dadurch sofort beim Laden angezeigt
- Der Hook `useSearchProviders` laeuft sofort ohne Filter und liefert alle aktiven Provider

## 2. Demo-Provider: Lennox & Friends Dog Resorts

### Datenbank-Migration (SQL)

**Provider aktualisieren** (ID `d0000000-...0050` bleibt bestehen):

```
UPDATE pet_providers SET
  company_name = 'Lennox & Friends Dog Resorts',
  address = 'Rosenheimer Str. 45, 85521 Ottobrunn',
  phone = '+49 89 66096690',
  email = 'info@lennoxandfriends.com',
  bio = 'Dein Hund – Unsere Leidenschaft. Wir sind ein kleines, liebevolles Team ...',
  rating_avg = 4.9,
  cover_image_url = 'https://images.unsplash.com/photo-...',
  service_area_postal_codes = ARRAY['85521','85579','85635','81369','80339','80689']
WHERE id = 'd0000000-0000-4000-a000-000000000050';
```

**Services aktualisieren** (bestehende IDs `...0060`, `...0061`, `...0062`):
- `...0060`: grooming → "Hundesalon Komplett" (65 EUR)
- `...0061`: walking → "Gassi-Service (1h)" (25 EUR)  
- `...0062`: daycare → "Tagesstaette" (35 EUR)

**Neuen Service einfuegen**:
- `d0000000-0000-4000-a000-000000000063`: boarding → "Urlaubsbetreuung / Pension" (45 EUR/Tag)

**Verfuegbarkeit einfuegen** (`pet_provider_availability`):
- Mo-Fr 08:00-12:00 und 14:00-18:00 (2 Slots pro Tag, je max 8 Buchungen)
- Sa 09:00-14:00 (1 Slot, max 4 Buchungen)
- So geschlossen

Das ergibt 11 Eintraege mit IDs `d0000000-0000-4000-a000-000000000070` bis `...007A`.

### Demo-Engine registrieren

**Datei: `src/engines/demoData/data.ts`**

Neue Konstanten:
```
export const DEMO_PET_PROVIDER_LENNOX = 'd0000000-0000-4000-a000-000000000050';
const ID_PET_SVC_GROOMING  = 'd0000000-0000-4000-a000-000000000060';
const ID_PET_SVC_WALKING   = 'd0000000-0000-4000-a000-000000000061';
const ID_PET_SVC_DAYCARE   = 'd0000000-0000-4000-a000-000000000062';
const ID_PET_SVC_BOARDING  = 'd0000000-0000-4000-a000-000000000063';
```

Alle fuenf IDs (Provider + 4 Services) werden in `ALL_DEMO_IDS` aufgenommen, Kommentar `// Pet Provider + Services (DB-geseedet)`.

Demo Coverage Map wird aktualisiert:
```
GP-PETS (MOD-05) — DB: 2 Demo-Pets + Lennox & Friends Provider + 4 Services + Availability
```

## 3. Provider-Kachel mit Emerald-Glow

**Datei: `src/pages/portal/pets/PetsCaring.tsx`**

In der Ergebnis-Kachel wird `isDemoId(provider.id)` geprueft. Demo-Provider erhalten:
- `getActiveWidgetGlow('emerald')` statt `'teal'`
- Ein DEMO-Badge oben rechts

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| DB-Migration | UPDATE provider + services, INSERT boarding service + 11 availability slots |
| `src/engines/demoData/data.ts` | 5 neue IDs registrieren |
| `src/pages/portal/pets/PetsCaring.tsx` | `searchTriggered` initial `true` + Emerald-Glow fuer Demo-Provider |
