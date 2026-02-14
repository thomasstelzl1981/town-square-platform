
# Zone 1 Komplett-Audit — Ergebnisse + Konsolidierungsplan

## IST-Zustand: 11 Sidebar-Gruppen, ca. 80 Routes, ca. 55 Seiten-Dateien

Ich habe jede Route, jede Datei und jeden Menuepunkt systematisch geprueft. Hier ist das vollstaendige Audit mit klaren Handlungsempfehlungen.

---

## Gruppe 1: TENANTS & ACCESS (5 Items) — STATUS: GUT

| Menuepunkt | Typ | Bewertung | Anmerkung |
|---|---|---|---|
| Admin Dashboard | Funktional (DB) | OK | Zeigt echte Stats, Quick Actions, Doc-Export |
| Organisationen | Funktional (DB) | OK | CRUD + Detail-Ansicht |
| Benutzer | Funktional (DB) | OK | Profil-Verwaltung |
| Delegationen | Funktional (DB) | OK | Scope-basiert, immutable History |

**Empfehlung:** Keine Aenderung noetig. Kern-Governance funktioniert.

---

## Gruppe 2: MASTERDATA (6 Items) — STATUS: UEBERMAESSIG

| Menuepunkt | Typ | Bewertung | Problem |
|---|---|---|---|
| Stammdaten-Vorlagen (Hub) | Funktional | OK | Landing-Seite |
| Immobilienakte Vorlage | Funktional | OK | |
| Selbstauskunft Vorlage | Funktional | OK | |
| Projektakte Vorlage | Funktional | OK | |
| Fahrzeugakte Vorlage | Funktional | OK | |
| Photovoltaikakte Vorlage | Funktional | OK | |
| Finanzierungsakte Vorlage | Funktional | OK | |

**Problem:** 6 einzelne Sidebar-Items fuer Read-Only-Vorlagen sind zu viel Platz. Die Hub-Seite `MasterTemplates.tsx` existiert bereits und listet alle auf.

**Empfehlung:** Nur 1 Sidebar-Item "Masterdata" anzeigen, das zur Hub-Seite fuehrt. Die Sub-Seiten bleiben als Routes (erreichbar via Hub), aber verschwinden aus der Sidebar. **Spart 5 Sidebar-Items.**

---

## Gruppe 3: KI OFFICE (3 Items) — STATUS: GERADE KONSOLIDIERT

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Recherche | Funktional (neu) | OK |
| Kontaktbuch | Funktional (neu) | OK |
| E-Mail Agent | Funktional (3-Tab) | OK |

**Problem:** Die alten Dateien liegen noch im Ordner:
- `AdminKiOfficeDashboard.tsx` (nicht mehr geroutet)
- `AdminKiOfficeEmail.tsx` (wird von EmailAgent importiert)
- `AdminKiOfficeSequenzen.tsx` (wird von EmailAgent importiert)
- `AdminKiOfficeTemplates.tsx` (wird von EmailAgent importiert)
- `AdminKiOfficeKontakte.tsx` (nicht mehr geroutet, Kontaktbuch ist Wrapper)
- `AdminKiOfficeRecherche.tsx` (nicht mehr geroutet, Recherche ist Wrapper)

Ausserdem: `CommunicationHub.tsx` ist noch im ManifestRouter registriert, aber NICHT mehr im routesManifest. Es ist ein reiner Platzhalter mit Demo-Daten und hat NULL Funktion.

**Empfehlung:**
1. `AdminKiOfficeDashboard.tsx` loeschen (nicht referenziert)
2. `AdminKiOfficeKontakte.tsx` + `AdminKiOfficeRecherche.tsx` pruefen ob sie noch als Basis-Import dienen oder ob der Code schon in den neuen Wrappern ist
3. `CommunicationHub.tsx` Import aus ManifestRouter entfernen und Datei loeschen
4. `MasterContacts.tsx` — wird nirgends geroutet, kann geloescht werden

---

## Gruppe 4: SOCIAL MEDIA (7 Items) — STATUS: 100% DEMO-DATEN

| Menuepunkt | Typ | Bewertung | Problem |
|---|---|---|---|
| Social Media | Demo-Platzhalter | LOESCHEN | Hardcoded demoStats, demoMandates |
| Kampagnen | Demo-Platzhalter | LOESCHEN | Hardcoded demoCampaigns |
| Creator | Demo-Platzhalter | LOESCHEN | Fake-Generate mit setTimeout |
| Social Vertrieb | Demo-Platzhalter | LOESCHEN | Hardcoded demoMandates |
| Leads & Routing | Demo-Platzhalter | LOESCHEN | Hardcoded demoLeads, toast-only Actions |
| Templates & CI | Demo-Platzhalter | LOESCHEN | Hardcoded 5 Templates, keine DB |
| Abrechnung | Demo-Platzhalter | LOESCHEN | Hardcoded demoEntries, keine DB |

**Bewertung:** Alle 7 Seiten und 8 Dateien nutzen ausschliesslich hardcodierte Demo-Daten. Keine einzige Supabase-Abfrage. Keine echte Funktionalitaet. Die Buttons (Zuordnen, Export, Generieren) zeigen nur toast-Nachrichten.

**Empfehlung:** Komplette Gruppe "Social Media" entfernen. Alle 8 Dateien loeschen, Routes aus Manifest entfernen, Sidebar-Gruppe entfernen. **Spart 7 Sidebar-Items + 8 Dateien.** Falls Social-Media-Verwaltung spaeter benoetigt wird, wird sie als eigenstaendiges Modul neu gebaut — mit echten DB-Tabellen.

---

## Gruppe 5: ARMSTRONG ZONE 1 (7 Items) — STATUS: FUNKTIONAL

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Armstrong Console | Funktional (DB) | OK |
| Actions-Katalog | Funktional (Manifest) | OK |
| Action Logs | Funktional (DB) | OK |
| Knowledge Base | Funktional (DB) | OK |
| Billing | Funktional (DB) | OK |
| Policies | Funktional (DB) | OK |
| Test Harness | Funktional | OK |

**Problem:** 7 Sidebar-Items sind viel. Die meisten werden selten gebraucht.

**Empfehlung:** Auf 1 Sidebar-Item "Armstrong" reduzieren, das zum Dashboard fuehrt. Dort interne Tab-Navigation zu den 6 Sub-Seiten. **Spart 6 Sidebar-Items.** Die Routes bleiben bestehen (Deep-Links), nur die Sidebar wird bereinigt.

---

## Gruppe 6: FEATURE ACTIVATION (3 Items) — STATUS: GUT

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Tile-Katalog | Funktional (DB) | OK |
| Partner-Verifizierung | Funktional (DB) | OK |
| Rollen & Berechtigungen | Funktional (DB) | OK |

**Empfehlung:** Keine Aenderung. Kern-Governance.

---

## Gruppe 7: BACKBONE (2 Items) — STATUS: GUT

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Vereinbarungen | Funktional (DB) | OK — Templates + Consent-Log |
| Posteingang | Funktional (DB) | OK — Inbound-Routing + Mandate (973 Zeilen!) |

**Empfehlung:** Keine Aenderung. Beides funktional und DB-angebunden.

---

## Gruppe 8: OPERATIVE DESKS (6 Items) — STATUS: GEMISCHT

| Menuepunkt | Typ | Bewertung | Problem |
|---|---|---|---|
| Lead Pool | Funktional (DB) | OK | |
| Provisionen | Funktional (DB) | OK | |
| Future Room | Funktional (DB) | OK | 8 Sub-Seiten, aber via Tabs erreichbar |
| Acquiary | Funktional (DB) | OK | 6-Tab-Struktur |
| Sales Desk | Teil-Funktional | PRUEFEN | Muss mit Oversight verglichen werden |
| Landing Pages | Funktional (DB) | OK | |

**Problem:** FutureRoom hat 8 Sub-Routes die alle ueber die interne Tab-Navigation erreichbar sind — aber 3 davon (`futureroom/contracts`, `futureroom/website-leads`, `futureroom/vorlagen`) koennen ueberfluessig sein, wenn sie nicht in der Tab-Leiste auftauchen.

**Empfehlung:** FutureRoom Sub-Routes pruefen und ggf. die nicht genutzten entfernen.

---

## Gruppe 9: AI AGENTS (1 Item) — STATUS: FUNKTIONAL

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Agents | Funktional (DB) | OK |

**Empfehlung:** Keine Aenderung.

---

## Gruppe 10: SYSTEM (5+ Items) — STATUS: GEMISCHT

| Menuepunkt | Typ | Bewertung | Problem |
|---|---|---|---|
| Stammdaten-Vorlagen | Funktional | UMZIEHEN | Gehoert nach Masterdata (siehe oben) |
| Integrationen | Funktional (DB) | OK | |
| Oversight | Funktional (DB) | OK | Systemweite Uebersicht |
| Audit Hub | Funktional (DB) | OK | |
| Fortbildung | Funktional (DB) | OK | |
| Website Hosting | Funktional (DB) | OK | |
| Domains | Dummy | LOESCHEN | Zeigt WebHostingDashboard (gleiche Komponente!) |
| Abuse | Dummy | LOESCHEN | Zeigt WebHostingDashboard (gleiche Komponente!) |
| Templates | Dummy | LOESCHEN | Zeigt WebHostingDashboard (gleiche Komponente!) |

**Problem:** `WebHostingDomains`, `WebHostingAbuse`, `WebHostingTemplates` sind alle auf die GLEICHE Komponente (`WebHostingDashboard`) gemappt. Das sind 3 Phantom-Routes ohne eigene UI.

**Empfehlung:** Website Hosting auf 1 Route reduzieren. Die 3 Sub-Routes entfernen.

---

## Gruppe 11: PLATFORM ADMIN (1 Item) — STATUS: OK

| Menuepunkt | Typ | Bewertung |
|---|---|---|
| Support | Funktional | OK |

---

## Verwaiste Dateien (nicht geroutet, aber vorhanden)

| Datei | Status | Empfehlung |
|---|---|---|
| `src/pages/admin/CommunicationHub.tsx` | Nicht geroutet, nur Demo-Daten | LOESCHEN |
| `src/pages/admin/MasterContacts.tsx` | Nicht geroutet | LOESCHEN |
| `src/pages/admin/AuditLog.tsx` | Im Router, aber AuditHub ist aktiv | PRUEFEN |
| `src/pages/admin/ki-office/AdminKiOfficeDashboard.tsx` | Nicht geroutet | LOESCHEN |
| `src/pages/admin/acquiary/AcquiaryObjekteingang.tsx` | Nicht geroutet | LOESCHEN |
| `src/pages/admin/acquiary/AcquiaryMonitoring.tsx` | Nicht geroutet (AcquiaryMonitor existiert separat) | LOESCHEN |

---

## Zusammenfassung der Konsolidierung

```text
VORHER: ~45 Sidebar-Items in 11 Gruppen
NACHHER: ~25 Sidebar-Items in 8 Gruppen

Einsparungen:
- Social Media:      -7 Items, -8 Dateien (komplett Demo)
- Masterdata Sidebar: -5 Items (Hub bleibt, Sub-Routes intern)
- Armstrong Sidebar:  -6 Items (Dashboard bleibt, Sub intern)
- Website Hosting:    -3 Items (Sub-Routes Phantom)
- Verwaiste Dateien:  -6 Dateien loeschen
```

---

## Schritt-fuer-Schritt Implementierung

### Phase A: Sofort-Bereinigung (Low Risk, High Impact)

1. **Social Media komplett entfernen** — 8 Dateien loeschen, 7 Routes aus Manifest, Sidebar-Gruppe entfernen
2. **Verwaiste Dateien loeschen** — CommunicationHub, MasterContacts, AdminKiOfficeDashboard, AcquiaryObjekteingang, AcquiaryMonitoring
3. **Website Hosting Sub-Routes entfernen** — Domains/Abuse/Templates Routes weg, nur Dashboard behalten
4. **CommunicationHub Import aus ManifestRouter entfernen**

### Phase B: Sidebar-Optimierung (Medium Effort)

5. **Masterdata:** Nur 1 Sidebar-Item "Masterdata" zeigen, Sub-Seiten via Hub erreichbar
6. **Armstrong:** Nur 1 Sidebar-Item "Armstrong" zeigen, Sub-Seiten via Dashboard-Tabs oder internem Routing

### Phase C: Aufraeum-Prüfung

7. **FutureRoom Sub-Routes** pruefen und ggf. bereinigen
8. **AuditLog vs. AuditHub** klaeren (Dopplung?)

---

## Risikobewertung

| Aenderung | Risiko | Begruendung |
|---|---|---|
| Social Media loeschen | KEIN Risiko | Null DB-Abfragen, null echte Funktion |
| Verwaiste Dateien loeschen | KEIN Risiko | Nicht geroutet |
| Sidebar-Reduktion Masterdata/Armstrong | NIEDRIG | Routes bleiben, nur Sidebar-Visibility |
| Website Hosting Phantom-Routes | KEIN Risiko | Alle zeigen gleiche Komponente |
