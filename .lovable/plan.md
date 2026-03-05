

# Analyse: Fehlende Push-Funktion MOD-13 → Downstream

## Aktueller Stand

Es gibt **keine Push-/Sync-Funktion** in MOD-13. Der Datenfluss ist aktuell **einmalig und unidirektional**:

```text
MOD-13 (Projekt) ──create──→ properties ──create──→ listings ──create──→ listing_publications
                     ↑                                                         ↓
              Einmalig bei                                            MOD-08 / MOD-09 / Zone 3
              Vertriebsauftrag                                        lesen direkt aus DB
```

### Was passiert bei Änderungen?

| Aktion in MOD-13 | Auswirkung auf Properties/Listings | Sichtbar in MOD-08/09/Z3? |
|---|---|---|
| Preis einer Einheit ändern | **Keine** — `properties.asking_price` und `listings.asking_price` bleiben unverändert | Nein, alter Preis |
| Projektbeschreibung ändern | **Keine** — `listings.description` bleibt unverändert | Nein, alte Beschreibung |
| Neue Einheit hinzufügen | **Keine** — kein Property/Listing wird erstellt | Nein, unsichtbar |
| Einheit entfernen | **Keine** — Property/Listing bleibt bestehen | Ja, weiterhin sichtbar |

### Drift Detection (vorhanden, aber ungenutzt)

`computeListingHash` existiert in `src/lib/listingHash.ts` und wird von `useSalesDeskListings` verwendet. Dieses System erkennt Drift zwischen Listing-Daten und Publikationsstatus — aber es gibt **keinen Mechanismus, der Änderungen von `dev_project_units` nach `properties`/`listings` propagiert**.

## Empfohlene Lösung: Projekt-Sync-Funktion

### Ansatz

Eine **"Sync"-Aktion** im MOD-13 Vertrieb-Tab, die bei Klick alle Properties und Listings mit den aktuellen Werten aus `dev_project_units` aktualisiert.

### Scope (4 Komponenten)

1. **`src/lib/syncProjectToListings.ts`** (neue Datei, kein Modul — frei editierbar)
   - Pure Funktion: Liest alle `dev_project_units` mit `property_id`, vergleicht Felder (Preis, Fläche, Miete, Zimmer) mit aktuellen `properties`/`listings`-Werten
   - Bei Abweichung: Update auf `properties` + `listings` + neuen `expected_hash` auf `listing_publications`
   - Rückgabe: `{ updated: number, unchanged: number, errors: string[] }`

2. **`SalesApprovalSection.tsx`** (MOD-13, nicht frozen)
   - Neuer Button "Daten synchronisieren" neben dem Kaufy-Toggle
   - Nur sichtbar wenn Vertriebsauftrag aktiv
   - Zeigt Ergebnis als Toast: "5 Listings aktualisiert, 67 unverändert"

3. **Felder die synchronisiert werden:**
   - `list_price` → `properties.asking_price` + `listings.asking_price`
   - `area_sqm` → `properties.living_space`
   - `rooms` → `properties.rooms`
   - `current_rent` → `properties.current_rent` + `properties.annual_income` (×12)
   - `unit_number` → `listings.title` (Projektnname + Einheitennr.)

4. **Drift-Flag**: Nach Sync wird `listing_publications.last_synced_hash` aktualisiert, sodass der SLC-Monitor keinen Drift mehr zeigt.

### Was NICHT automatisch passiert (bewusste Entscheidung)

- **Kein Auto-Sync bei Speichern**: Änderungen an Einheiten propagieren nicht automatisch. Der Nutzer muss explizit "Synchronisieren" klicken. Dies verhindert unbeabsichtigte Veröffentlichungen und gibt dem Nutzer Kontrolle.
- **Keine neuen Properties/Listings**: Sync aktualisiert nur bestehende Verknüpfungen. Neue Einheiten erfordern weiterhin "Vertriebsauftrag aktivieren".

### Betroffene Module / Freeze-Check

| Pfad | Modul/Bereich | Frozen? |
|---|---|---|
| `src/lib/syncProjectToListings.ts` | Shared lib | Nein |
| `src/components/projekte/SalesApprovalSection.tsx` | MOD-13 | Nein |
| MOD-08, MOD-09, Zone 3 | Nur Leser | Keine Änderung nötig |

