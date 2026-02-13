
# MOD-15 Fortbildung — Zone 1 Management-Modul + Seed-Daten-Aktualisierung

## Ueberblick

Es werden zwei Dinge umgesetzt:

1. **Zone 1 Admin-Seite** (`/admin/fortbildung`) zur Verwaltung aller kuratierten Fortbildungsinhalte (CRUD: Anlegen, Bearbeiten, Loeschen, Sortieren, Aktivieren/Deaktivieren)
2. **Seed-Daten-Aktualisierung** mit echten, verifizierten Daten von den vier Providern (Amazon, Udemy, Eventbrite, YouTube)

---

## Bestandsanalyse

### Vorhandene Seed-Daten (bereits realistisch)
Die Tabelle `fortbildung_curated_items` enthaelt bereits **80 Eintraege** (4 Tabs x 4 Topics x 5 Items). Stichproben zeigen echte Daten:

| Tab | Beispiel-Eintraege |
|-----|-------------------|
| **Buecher** | "Rich Dad Poor Dad" (Kiyosaki, 14,99 EUR), "Erfolg mit Wohnimmobilien" (Knedel, 24,99 EUR), "Betongold" (Bauer, 30 EUR) |
| **Fortbildungen** | "Real Estate Financial Modeling Bootcamp" (Udemy, 84,99 EUR), "Immobilien-Investment Kompakt" (immlab, 49,99 EUR) |
| **Vortraege** | "immocation Festival 2026" (ab 149 EUR), "Betongoldabend München", "Immobilienabend Hamburg" |
| **Kurse** | "Immobilien-Investment Komplettkurs" (immocation, kostenlos), "Immobilien als Kapitalanlage" (Finanzfluss, kostenlos) |

Die Daten sind bereits gut. Fehlende Elemente: `image_url` ist bei allen NULL.

### Gescrapte Echtdaten fuer Anreicherung

**Eventbrite (Live-Events Deutschland):**
- Immobilien-Stammtisch NoLimitClub (Karlsruhe)
- Immobilien Stammtisch Essen
- Das kleine Immobilien-Seminar Stuttgart (Konzept + Grundbesitz GmbH)
- Betongoldabend - Immobilientalk & Networking (Muenchen)
- Immobilienabend Hamburg

**YouTube-Kanaele (verifiziert):**
- immocation (Vermögensaufbau, 300k+ Abonnenten)
- Finanzfluss (Thomas Kehl, 1M+ Abonnenten)
- Immo Tommy (Europas groesster Immobilien-Creator)
- Gerald Hoerhan / Investmentpunk
- Vermietertagebuch
- Finanztip

**Amazon-Buecher (verifiziert):**
- "Immogame" (Tobias Claessens, SPIEGEL-Bestseller)
- "Bau keinen Scheiss" (SPIEGEL-Bestseller)
- "Immobilien Investitionen leicht gemacht" (Stephan Gerlach, 24,99 EUR)

---

## Aenderung 1: Route im Admin-Manifest registrieren

**Datei:** `src/manifests/routesManifest.ts`

Neue Route in `zone1Admin.routes[]`:
```
{ path: "fortbildung", component: "AdminFortbildung", title: "Fortbildung" }
```

---

## Aenderung 2: Admin-Seite (NEUE DATEI)

**Datei:** `src/pages/admin/AdminFortbildung.tsx`

Eine tabellarische Verwaltungsseite mit:

### Oberer Bereich
- ModulePageHeader: "Fortbildung verwalten"
- Tab-Filter: Buecher | Fortbildungen | Vortraege | Kurse (analog zu Zone 2)
- Topic-Filter: Immobilien | Finanzen | Erfolg | Persoenlichkeit
- Button: "+ Neuen Eintrag anlegen"

### Tabelle (Hauptbereich)
| Sortierung | Titel | Autor/Kanal | Provider | Topic | Preis | Bewertung | Aktiv | Aktionen |
|------------|-------|-------------|----------|-------|-------|-----------|-------|----------|
| Drag-Handle | Text | Text | Badge | Badge | Text | Text | Switch | Edit / Delete |

- Sortierung per Drag-and-Drop (`@dnd-kit/sortable`, bereits installiert)
- Aktiv/Inaktiv per Switch-Toggle (sofortige DB-Aktualisierung)
- Loeschen mit AlertDialog-Bestaetigung (Hard-Delete, da kuratierte Inhalte kein Audit benoetigen)

### Drawer: Eintrag anlegen/bearbeiten

**Datei:** `src/pages/admin/AdminFortbildungDrawer.tsx` (NEUE DATEI)

Formular-Drawer (Sheet) mit allen Feldern der Tabelle:
- Tab (Select: books/trainings/talks/courses)
- Topic (Select: immobilien/finanzen/erfolg/persoenlichkeit)
- Provider (Select: amazon/udemy/eventbrite/youtube/impact)
- Titel (Text, required)
- Autor/Kanal (Text)
- Beschreibung (Textarea)
- Affiliate-Link (URL, required)
- Preis-Text (Text)
- Bewertung-Text (Text)
- Dauer-Text (Text)
- Bild-URL (Text)
- Externe ID (Text)
- Sortierung (Number)
- Aktiv (Checkbox)

---

## Aenderung 3: Admin-Hook fuer CRUD (NEUE DATEI)

**Datei:** `src/hooks/useAdminFortbildung.ts`

- `useAdminFortbildungItems(tab, topic?)` — Query mit Filtern
- `useCreateFortbildungItem()` — Insert-Mutation
- `useUpdateFortbildungItem()` — Update-Mutation (inkl. `is_active` Toggle und `sort_order`)
- `useDeleteFortbildungItem()` — Delete-Mutation (Hard-Delete)
- `useReorderFortbildungItems()` — Batch-Update der `sort_order` nach Drag-and-Drop

---

## Aenderung 4: Seed-Daten aktualisieren (Migration)

SQL-Migration zum Aktualisieren/Ergaenzen der bestehenden 80 Eintraege:

### Neue Eventbrite-Events ersetzen Platzhalter (Tab: talks)
- "Immobilien-Stammtisch NoLimitClub" (Karlsruhe, kostenlos, Eventbrite-Link)
- "Das kleine Immobilien-Seminar Stuttgart" (Konzept + Grundbesitz, ab 29 EUR)
- "Betongoldabend - Immobilientalk & Networking" (Muenchen, kostenlos)

### Neue YouTube-Kanaele/Videos ergaenzen (Tab: courses)
- "Immo Tommy — Erste Immobilie kaufen" (Immo Tommy, kostenlos)
- "Finanzfluss — ETF vs. Immobilien Vergleich" (Finanzfluss, kostenlos)
- "Finanztip — Immobilie als Kapitalanlage" (Finanztip, kostenlos)

### Neue Amazon-Buecher ergaenzen (Tab: books)
- "Immogame" (Tobias Claessens, 19,99 EUR, SPIEGEL-Bestseller)
- "Bau keinen Scheiss" (SPIEGEL-Bestseller)
- "Immobilien Investitionen leicht gemacht" (Stephan Gerlach, 24,99 EUR)

Die Migration wird als UPSERT formuliert, um bestehende Eintraege nicht zu duplizieren.

---

## Aenderung 5: RLS-Policy fuer Admin-Zugriff

Die Tabelle `fortbildung_curated_items` benoetigt RLS-Policies:
- **SELECT**: Alle authentifizierten Benutzer (fuer Zone 2 Anzeige)
- **INSERT/UPDATE/DELETE**: Nur `platform_admin` Rolle (fuer Zone 1 Verwaltung)

Pruefung: Ob RLS bereits aktiviert ist oder noch eingerichtet werden muss.

---

## Dateien-Uebersicht

| Aktion | Datei |
|--------|-------|
| EDIT | `src/manifests/routesManifest.ts` — Route `/admin/fortbildung` hinzufuegen |
| NEU | `src/pages/admin/AdminFortbildung.tsx` — Verwaltungsseite mit Tabelle, Filtern, Drag-and-Drop |
| NEU | `src/pages/admin/AdminFortbildungDrawer.tsx` — Formular-Drawer fuer Anlegen/Bearbeiten |
| NEU | `src/hooks/useAdminFortbildung.ts` — CRUD-Hooks + Reorder-Mutation |
| MIGRATION | Seed-Daten mit echten Eventbrite-Events, YouTube-Kanaelen und Amazon-Buechern aktualisieren |
| MIGRATION | RLS-Policies fuer `fortbildung_curated_items` (Admin: full CRUD, User: read-only) |
