

# Haustierakte — Einheitliche SSOT-Komponente (Universal Pet Dossier)

## Kernprinzip: EINE Komponente, DREI Kontexte

Es gibt **eine einzige** `PetDossier`-Komponente in `src/components/shared/`. Sie wird in allen drei Zonen identisch gerendert — Inline, kein Collapsible, großzügig mit Fotos.

---

## Layout (Inline-Scroll, keine Tabs/Collapsibles)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  BESITZER                             [✏️]    │  │
│  │                                               │  │
│  │  👤 Sabine Berger                             │  │
│  │  📧 sabine.berger@demo.de                     │  │
│  │  📱 +49 171 2223344                           │  │
│  │  📍 Lindenstraße 12, 10969 Berlin             │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  STECKBRIEF                           [✏️]    │  │
│  │                                               │  │
│  │  ┌──────────────┐                             │  │
│  │  │              │  Name: Rocky                │  │
│  │  │  🐕 FOTO     │  Rasse: Labrador Retriever  │  │
│  │  │  (großzügig) │  Geschlecht: Rüde           │  │
│  │  │  256x256     │  Geb.: 15.03.2020 (5 J.)    │  │
│  │  │              │  Gewicht: 32 kg              │  │
│  │  │  [📷 Ändern] │  Farbe: Golden              │  │
│  │  └──────────────┘  Chip-Nr: 276098106...      │  │
│  │                    Kastriert: Ja               │  │
│  │                    Größe: 58 cm                │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  FOTOGALERIE                    [📷 Hinzufügen]│  │
│  │                                               │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │  │
│  │  │    │ │    │ │    │ │    │ │    │          │  │
│  │  │ 📸 │ │ 📸 │ │ 📸 │ │ 📸 │ │ +  │          │  │
│  │  │    │ │    │ │    │ │    │ │    │          │  │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘          │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  GESUNDHEIT                           [✏️]    │  │
│  │                                               │  │
│  │  Tierarzt: Dr. Maria Weber                    │  │
│  │  Praxis: Tierarztpraxis Am Park               │  │
│  │  Tel: +49 30 12345678                         │  │
│  │                                               │  │
│  │  Allergien: Huhn, Weizen                      │  │
│  │  Unverträglichkeiten: Laktose                 │  │
│  │                                               │  │
│  │  ── Impfungen ──                              │  │
│  │  Tollwut       | 15.06.2025 | Dr. Weber       │  │
│  │  Staupe/Parvo  | 15.06.2025 | Dr. Weber       │  │
│  │  Leptospirose  | 20.01.2025 | Dr. Klein       │  │
│  │                                               │  │
│  │  ── Behandlungen ──                           │  │
│  │  Zahnreinigung | 03.03.2025 | Dr. Weber       │  │
│  │  Blutbild      | 15.06.2025 | alle Werte ok   │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  ERNÄHRUNG & PFLEGE                   [✏️]    │  │
│  │                                               │  │
│  │  Futter: Royal Canin Labrador Adult            │  │
│  │  Menge: 350g / Tag (2x)                       │  │
│  │  Leckerli: Ja, aber kein Huhn                 │  │
│  │  Besonderheiten: Muss langsam fressen          │  │
│  │                                               │  │
│  │  Fellpflege: Bürsten 2x/Woche                 │  │
│  │  Baden: Alle 6 Wochen                         │  │
│  │  Krallen: Monatlich kürzen                    │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  VERSICHERUNG                         [✏️]    │  │
│  │                                               │  │
│  │  Anbieter: PetProtect Plus                    │  │
│  │  Policen-Nr: PP-2024-12345                    │  │
│  │  Typ: OP + Kranken                            │  │
│  │  Beitrag: 45,90 € / Monat                    │  │
│  │  SB: 250 € / Jahr                            │  │
│  │  Gültig bis: 31.12.2026                       │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  VERHALTEN & TRAINING                 [✏️]    │  │
│  │                                               │  │
│  │  Verträglich mit Hunden: Ja                   │  │
│  │  Verträglich mit Katzen: Nein                 │  │
│  │  Verträglich mit Kindern: Ja                  │  │
│  │  Leinenpflicht: Nein                          │  │
│  │  Maulkorb: Nein                               │  │
│  │                                               │  │
│  │  Training: Grundgehorsam, Abruf gut           │  │
│  │  Ängste: Gewitter, Feuerwerk                  │  │
│  │  Besonderheiten: Zieht an der Leine           │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  DOKUMENTE (DMS)                    [📎 Neu]  │  │
│  │                                               │  │
│  │  📄 Impfpass_Rocky.pdf        | 15.06.2025    │  │
│  │  📄 EU-Heimtierausweis.pdf    | 20.01.2024    │  │
│  │  📄 OP-Bericht_Zahn.pdf      | 03.03.2025    │  │
│  │  📄 Versicherungspolice.pdf   | 01.01.2024    │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  NOTIZEN                              [✏️]    │  │
│  │                                               │  │
│  │  "Rocky mag keine Katzen. Bei Gewitter        │  │
│  │   braucht er seine Decke. Frisst zu           │  │
│  │   schnell → Anti-Schling-Napf nutzen."        │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Kontext-Steuerung über Props

```tsx
<PetDossier
  petId="..."
  context="z2-client"    // | "z2-provider" | "z3"
  readOnly={false}
  showOwner={true}       // Besitzer-Sektion immer sichtbar
  onSave={handleSave}    // Z3: Edge Proxy | Z2: Supabase SDK
/>
```

| Sektion | Z2 MOD-05 (Client) | Z2 MOD-22 (Provider) | Z3 (Lennox) |
|---|---|---|---|
| Besitzer | ✅ (eigenes Profil) | ✅ (CRM-Kunde) | ✅ (Z3-Profil) |
| Steckbrief | ✅ editierbar | ✅ editierbar | ✅ editierbar |
| Fotogalerie | ✅ upload | ✅ read-only | ✅ upload |
| Gesundheit | ✅ voll | ✅ voll | ✅ voll |
| Ernährung & Pflege | ✅ voll | ✅ read-only | ✅ voll |
| Versicherung | ✅ voll | ⬜ ausgeblendet | ⬜ ausgeblendet |
| Verhalten & Training | ✅ voll | ✅ wichtig für Pension! | ✅ voll |
| Dokumente | ✅ DMS | ✅ read-only | ✅ upload |
| Notizen | ✅ privat | ✅ Provider-Notizen | ✅ eigene Notizen |

---

## Datenbank-Erweiterung `pets` Tabelle

Fehlende Felder (Migration nötig):

```
color TEXT
height_cm NUMERIC
vet_practice TEXT
vet_phone TEXT
intolerances TEXT[]
food_brand TEXT
food_amount TEXT
food_frequency TEXT
food_notes TEXT
grooming_notes TEXT
insurance_type TEXT
insurance_premium_monthly NUMERIC
insurance_deductible NUMERIC
insurance_valid_until DATE
compatible_dogs BOOLEAN
compatible_cats BOOLEAN
compatible_children BOOLEAN
leash_required BOOLEAN
muzzle_required BOOLEAN
training_level TEXT
fears TEXT[]
behavior_notes TEXT
```

---

## Foto-System (Storage Bucket)

```
Bucket: pet-photos
Pfad:   {tenant_id}/{pet_id}/profile.jpg    ← Profilbild
        {tenant_id}/{pet_id}/gallery/001.jpg ← Galerie
        {tenant_id}/{pet_id}/gallery/002.jpg
```

- Upload via Supabase Storage SDK (Z2) oder Edge Proxy (Z3)
- Profilbild: 1:1 Crop, max 2MB
- Galerie: max 10 Bilder, max 5MB je Bild

---

## Datei-Struktur

```
src/components/shared/
├── pet-dossier/
│   ├── PetDossier.tsx          ← Haupt-Orchestrator
│   ├── PetOwnerSection.tsx     ← Besitzer-Block
│   ├── PetProfileSection.tsx   ← Steckbrief + Profilbild
│   ├── PetGallerySection.tsx   ← Fotogalerie
│   ├── PetHealthSection.tsx    ← Gesundheit
│   ├── PetNutritionSection.tsx ← Ernährung & Pflege
│   ├── PetInsuranceSection.tsx ← Versicherung
│   ├── PetBehaviorSection.tsx  ← Verhalten & Training
│   ├── PetDocumentsSection.tsx ← DMS-Verknüpfung
│   ├── PetNotesSection.tsx     ← Notizen
│   └── usePetDossier.ts        ← Daten-Hook (lädt/speichert)
```

---

## Zusammenfassung

**1 Komponente. 9 Sektionen. 3 Zonen. 0 Collapsibles.**

