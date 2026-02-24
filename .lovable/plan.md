

# Korrekturplan: 4 verbleibende Punkte für Ende-zu-Ende-Funktionalität

## Ausgangslage

Die Architektur zwischen Zone 1 (Lead Desk) und Zone 2 (Lead Manager) ist korrekt aufgebaut. Es gibt 4 kleinere Korrekturen, die den Flow vervollstaendigen.

## Korrekturen

### 1. TemplateCard im Wizard: `image_urls` weitergeben

**Datei:** `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` (Zeile 404-418)

Das `selectable`-Rendering im Kampagnen-Wizard uebergibt `imageUrls` nicht an `TemplateCard`. Templates mit Bildern aus Zone 1 werden daher ohne Bild angezeigt.

**Aenderung:** `imageUrls={(t.image_urls as string[]) || []}` als Prop hinzufuegen (analog zu `LeadManagerBrand.tsx` Zeile 144).

### 2. `template_ids` in `social_mandates` speichern

**Problem:** Der Wizard sendet `template_ids` an die Edge Function, aber `social_mandates` hat kein Feld dafuer. Die IDs gehen verloren.

**Loesung:** `template_ids` im bestehenden `template_slots` JSONB-Feld speichern (kein neues DB-Feld noetig).

**Datei:** `supabase/functions/sot-social-mandate-submit/index.ts`
- Zeile ~105: `template_slots` mit `{ selected_template_ids: template_ids }` befuellen statt leerem Objekt.

### 3. Kampagnenname in Zone 1 Kampagnen-Tab anzeigen

**Datei:** `src/pages/admin/lead-desk/LeadKampagnenDesk.tsx`

Kampagnenname ist in `personalization.campaign_name` gespeichert. Die Admin-Tabelle zeigt ihn nicht an.

**Aenderung:** Neue Spalte "Kampagne" in der Tabelle, die `m.personalization?.campaign_name` anzeigt (nach "Partner"-Spalte).

### 4. Alte Lazy-Seeded Templates aufraeumen (optional)

12 Templates mit `tenant_id: a0000000-...`, `approved: false`, ohne Bilder existieren noch in der DB. Diese stammen aus dem alten Lazy-Seeding und sind fuer den neuen Workflow irrelevant.

**Optionen:**
- A) Loeschen (sauberer Zustand)
- B) Stehen lassen (stoeren nicht, da Zone 2 nach `approved=true` filtert)

**Empfehlung:** Loeschen fuer einen sauberen Zustand.

## Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/portal/lead-manager/LeadManagerKampagnen.tsx` | `imageUrls` Prop bei selectable TemplateCard hinzufuegen |
| `supabase/functions/sot-social-mandate-submit/index.ts` | `template_ids` in `template_slots` speichern |
| `src/pages/admin/lead-desk/LeadKampagnenDesk.tsx` | Kampagnenname-Spalte in Tabelle |
| DB-Cleanup | 12 alte Templates loeschen (optional) |

## Was sich NICHT aendert

- Gesamte Zone 2 Struktur (MOD-10) bleibt unberuehrt
- Zone 1 BrandPostCreator und BrandPostCard bleiben unberuehrt
- DB-Schema bleibt unberuehrt (keine Migration noetig)
- Edge Function Logik fuer Credit-Preflight und Approved-Check bleibt

## Erwartetes Ergebnis nach Korrektur

1. Admin erstellt Post in Zone 1 Brand-Templates → Post mit Bildern, Targeting, Defaults
2. Admin gibt Post frei → `approved = true`
3. Partner in Zone 2 sieht freigegebene Templates in Brand-Gallery UND im Kampagnen-Wizard
4. Partner waehlt Templates mit Bild-Vorschau im Wizard
5. Partner fuellt Kampagnen-Details und reicht ein
6. Edge Function prueft Credits, speichert Mandate mit Template-IDs
7. Zone 1 Kampagnen-Tab zeigt Mandate mit Kampagnenname, Partner, Brand, Budget

