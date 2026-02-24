

# Erweiterter Plan: Lennox Provider-Seed mit Bildern und DMS-Integration

## Ausgangslage

Die 4 Gallery-Bilder existieren als statische Assets im Code (`src/assets/demo/pm-gallery-*.jpg`), werden aber:
- **NICHT** in die Datenbank (`pet_providers.gallery_images`) geschrieben
- **NICHT** in den Storage-Bucket (`tenant-documents`) des Lennox-Tenants hochgeladen
- **NICHT** im DMS-Ordnerbaum des Tenants registriert (`storage_nodes`)

Aktuell zeigt `PMProfil.tsx` (Z.143) einen Fallback: `dbPhotos.length > 0 ? dbPhotos : [...DEMO_PM_GALLERY_IMAGES]` — die Bilder kommen also nur aus dem lokalen Import, nie aus der DB.

Zone 3 (`LennoxPartnerProfil.tsx`) liest `gallery_images` direkt aus der DB (Z.117) — da diese leer ist, wird keine Galerie angezeigt.

## Loesung: `useLennoxInitialSeed.ts` erstellen

Ein neuer Hook `src/hooks/useLennoxInitialSeed.ts`, der einmalig beim Login des Lennox-Tenants (Robyn) ausgefuehrt wird:

### Phase 1: Provider + Services in DB anlegen

```text
pet_providers:
  id:            d0000000-0000-4000-a000-000000000050
  tenant_id:     eac1778a-23bc-4d03-b3f9-b26be27c9505
  user_id:       99d271be-4ebb-4495-970d-ad91e943e4f0
  company_name:  Lennox & Friends Dog Resorts
  status:        active, is_published: true
  email:         info@lennoxandfriends.app
  ...alle Felder aus DEMO_LENNOX_SEARCH_PROVIDER

pet_services (4 Eintraege):
  IDs ...0060 bis ...0063 (aus demo_pet_services.csv)
```

### Phase 2: Bilder in Storage hochladen

Die 4 Gallery-Bilder (`pm-gallery-pension-1.jpg`, etc.) werden aus `src/assets/demo/` geladen und per Supabase Storage SDK in den Bucket `tenant-documents` hochgeladen:

```text
Pfad-Schema: {tenant_id}/pet-provider/{provider_id}/gallery_{index}.jpg

Konkret:
  eac1778a-.../pet-provider/d0000000-...-000000000050/gallery_0.jpg
  eac1778a-.../pet-provider/d0000000-...-000000000050/gallery_1.jpg
  eac1778a-.../pet-provider/d0000000-...-000000000050/gallery_2.jpg
  eac1778a-.../pet-provider/d0000000-...-000000000050/gallery_3.jpg
```

Danach werden Signed URLs generiert und in `pet_providers.gallery_images` (Array) sowie `cover_image_url` (erstes Bild) geschrieben.

### Phase 3: DMS-Ordnerstruktur anlegen

Ueber den bestehenden `usePetDMS`-Hook wird der DMS-Baum fuer den Provider erstellt:

```text
storage_nodes:
  Root:  "Lennox & Friends Dog Resorts" (entity_type: 'pet', entity_id: provider_id)
    ├── 01_Impfpass
    ├── 02_Tierarzt
    ├── 03_Versicherung
    └── 04_Sonstiges
```

Die hochgeladenen Bilder werden als `storage_nodes` (node_type: 'file') im Root-Ordner oder in einem neuen Unterordner `05_Galerie` registriert (optional, je nach Praeferenz).

### Phase 4: Idempotenz-Check

Der Seed prueft vor jedem Schritt, ob die Daten bereits existieren:
- `pet_providers` mit ID `d0000000-...-050` vorhanden? → Skip
- Storage-Dateien bereits im Bucket? → Skip
- `storage_nodes` Root-Ordner vorhanden? → Skip

So kann der Seed beliebig oft ausgefuehrt werden, ohne Duplikate.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useLennoxInitialSeed.ts` | **NEU** — Einmaliger Seed-Hook |
| `public/demo-data/demo_pet_providers.csv` | Email `.com` → `.app` korrigieren |
| DB-Migration | `pet_providers` + `pet_services` INSERT (Fallback falls Seed nicht laeuft) |

### Modul-Freeze-Check

- `src/hooks/` → kein Modul-Pfad, nicht frozen
- `public/demo-data/` → kein Modul-Pfad, nicht frozen
- DB-Migration → kein Modul-Pfad

Alle Aenderungen sind in nicht-gefrorenen Bereichen.

## Offene Design-Entscheidung

Die Bilder werden aktuell via Signed URLs referenziert (1 Jahr gueltig, wie in PMProfil.tsx Z.182). Alternative waere, den Bucket `tenant-documents` fuer diese Pfade public zu machen. Der aktuelle Ansatz mit Signed URLs ist konsistent mit dem bestehenden Upload-Flow in PMProfil.

