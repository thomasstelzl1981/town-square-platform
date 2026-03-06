

# Deep Audit: Lennox & Friends (Z3) + Pet Manager (MOD-22) + Haustiere (MOD-05)

---

## Gesamtbewertung: **7 Befunde** (2 Kritisch, 3 Mittel, 2 Niedrig)

---

## 1. KRITISCH — LennoxMeinBereich: service_id Matching per Title statt ID

**Datei:** `src/pages/zone3/lennox/LennoxMeinBereich.tsx` Zeile 185
**Problem:** Die Buchungsanfrage sucht den Service per `title`-String-Match:
```typescript
const selectedSvc = services.find((s: any) => s.title === bookingService);
```
Der `bookingService` State wird aus dem `<select>` mit `s.title` als `value` gesetzt (Zeile 353). Wenn zwei Services den gleichen Titel haben, wird der falsche selektiert. Außerdem: wenn `selectedSvc` nicht gefunden wird, wird `service_id: null` gesendet → der Edge Function Proxy akzeptiert das zwar, aber die Buchung hat dann **keine Preisberechnung** (totalPriceCents = 0).

**Fix:** Den `<select>` value auf `s.id` umstellen statt `s.title`. Dann `bookingService` direkt als `service_id` nutzen. Kein String-Matching nötig.

---

## 2. KRITISCH — LennoxPartnerProfil: Services laden per `slug` statt `provider.id`

**Datei:** `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` Zeile 34-47
**Problem:** Die `useQuery` für Services nutzt `slug` (aus URL-Params) als `provider_id`:
```typescript
.eq('provider_id', slug)
```
Der `slug` kommt aus der URL `/website/tierservice/partner/:slug`. Auf der Startseite (LennoxStartseite) werden Provider-Karten verlinkt mit `provider.id` als slug (Zeile 163: `providers.slice(0, 8).map(p => <PartnerCard key={p.id} provider={p} />`).

Das funktioniert **nur**, wenn der URL-Parameter tatsächlich die UUID des Providers ist. Das ist aktuell der Fall (PartnerCard verlinkt auf `/partner/${provider.id}`). ABER: `useProviderDetail(slug)` lädt den Provider ebenfalls mit `.eq('id', providerId)` — das ist konsistent. **Kein Bug**, aber fragil: Wenn man je auf slugs umstellt, bricht beides.

**Status:** Funktioniert aktuell, aber das `slug` Naming ist irreführend (es ist eine UUID).

---

## 3. MITTEL — useSearchProviders: `enabled: true` + kein Debounce/Timeout

**Datei:** `src/hooks/usePetProviderSearch.ts` Zeile 72
**Problem:**
- `enabled: true` bedeutet, die Query feuert **immer** beim Mount, auch ohne Suchbegriff. In der Startseite wird das durch `hasSearched` gesteuert (Location ist `undefined` → Query holt trotzdem alle Provider, filtert nur clientseitig).
- **Kein Timeout-Handling**: Wenn die DB-Abfrage hängt, dreht der Spinner endlos. Es gibt keinen `staleTime`, keinen `retry`-Limiter, keinen Error-State in der UI (LennoxStartseite zeigt nur Spinner, nie eine Fehlermeldung).
- **Performance**: Bei vielen Providern werden ALLE geladen + ALLE Services → 2 volle Table-Scans. Kein Server-Side-Filtering.

**Fix:**
- `enabled` auf `!!location` setzen (nur feuern wenn tatsächlich gesucht wird)
- `staleTime: 30_000` + `retry: 2` hinzufügen
- Error-Fallback in LennoxStartseite für Query-Fehler

---

## 4. MITTEL — PMKalender nutzt Legacy `useBookings` statt PLC Cases

**Datei:** `src/pages/portal/petmanager/PMKalender.tsx` Zeile 196
**Problem:** Der Kalender liest aus `useBookings` (legacy `pet_bookings`-Tabelle), während alle anderen PM-Seiten (Dashboard, Buchungen) korrekt `useCasesForProvider` (PLC `pet_service_cases`) nutzen. Das bedeutet:
- Neue Buchungen über das PLC-System erscheinen **nicht** im Kalender
- Der Kalender zeigt nur Legacy-Daten

**Fix:** `useBookings` durch `useCasesForProvider` ersetzen, Cases nach `scheduled_start` gruppieren.

---

## 5. MITTEL — PMFinanzen: Import nutzt shared `generateInvoicePdf` ✅ aber inline jsPDF-Code noch vorhanden?

**Datei:** `src/pages/portal/petmanager/PMFinanzen.tsx` Zeile 37
**Status:** Import von `generateInvoicePdf` aus `@/lib/pdf/generateInvoicePdf` ist vorhanden (QW-2 wurde umgesetzt). **PASS** — kein Duplikat mehr.

---

## 6. NIEDRIG — LennoxPartnerProfil: Gallery Images mit `as any` Cast

**Datei:** `src/pages/zone3/lennox/LennoxPartnerProfil.tsx` Zeile 130
```typescript
{(provider as any).gallery_images?.length > 0 && ...}
```
Das Feld `gallery_images` existiert möglicherweise nicht in den Types. Kein Runtime-Fehler (optional chaining schützt), aber unsauber.

---

## 7. NIEDRIG — LennoxLayout: Pin-Gate Loading Spinner ohne Timeout-Feedback

**Datei:** `src/pages/zone3/lennox/LennoxLayout.tsx` Zeile 31-38
**Status:** Bereits mit 3-Sekunden-Timeout implementiert (`loadingTimedOut`). **PASS** — robustes Pattern.

---

## Zusammenfassung nach Bereich

### Lennox & Friends (Zone 3)
| Bereich | Status | Befund |
|---------|--------|--------|
| Startseite / Hero | ✅ OK | Layout, Suche, Geolocation funktionieren |
| Suche / Provider-Ergebnisse | ⚠️ | Kein Error-Handling, enabled:true lädt immer (#3) |
| Partner-Profil | ✅ OK | Services laden korrekt, Buchung verdrahtet |
| Buchung (PartnerProfil) | ✅ OK | Z3 Edge Proxy, Idempotency, Pricing korrekt |
| Mein Bereich: Buchung | 🔴 | service_id per Title-Match statt ID (#1) |
| Mein Bereich: Hundeakte | ✅ OK | SSOT via Edge Proxies, PetDossier, CRUD |
| Auth (Login/Signup) | ✅ OK | Z3-eigenes Auth, Validation, returnTo |
| Shop | ✅ OK | Widget-Nav, Service Products, externe Links |
| Layout/Footer/SEO | ✅ OK | Pin-Gate mit Timeout, ArmstrongWidget |
| Impressum/Datenschutz | ✅ OK | Zone3LegalPage shared component |

### Pet Manager (MOD-22)
| Bereich | Status | Befund |
|---------|--------|--------|
| Dashboard | ✅ OK | PLC Cases, KPIs, Kapazität |
| Buchungen | ✅ OK | PLC Transitions, Idempotency |
| Leistungen | ✅ OK | CRUD, Cent-Konvertierung, Verfügbarkeit |
| Pension | ✅ OK | Zimmer CRUD, Excel-Kalender, Buchungs-Overlay |
| Kalender | 🔴 | Liest aus Legacy-Tabelle statt PLC (#4) |
| Finanzen | ✅ OK | Shared PDF, KPIs, Umsatz-Chart |
| Profil | ✅ OK | (nicht geprüft, Standard-Pattern) |

### Haustiere (MOD-05)
| Bereich | Status | Befund |
|---------|--------|--------|
| Meine Tiere | ✅ OK | RecordCard, PetDossier inline, Photo-Upload |
| Caring (Suche) | ⚠️ | Gleicher Search-Hook wie Z3, enabled-Problem (#3) |
| Provider Detail | ✅ OK | Navigation, Service-Cards |
| Mein Bereich | ✅ OK | Shared generateInvoicePdf |

---

## Empfohlene Fix-Reihenfolge (vor Präsentation)

| Prio | Fix | Dateien | Aufwand |
|------|-----|---------|---------|
| **1** | LennoxMeinBereich: Service-Select auf `s.id` als value umstellen | `LennoxMeinBereich.tsx` | 5 min |
| **2** | PMKalender: `useBookings` → `useCasesForProvider` migrieren | `PMKalender.tsx` | 15 min |
| **3** | useSearchProviders: `enabled` conditionally, Error-Fallback | `usePetProviderSearch.ts`, `LennoxStartseite.tsx`, `PetsCaring.tsx` | 10 min |

Befunde #6 und #7 sind kosmetisch und können nach der Präsentation behoben werden.

