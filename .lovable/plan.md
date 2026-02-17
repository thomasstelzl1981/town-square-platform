

## Bereinigung Zone 3: Miety, Projekt und Sites entfernen

### Analyse

Im System existieren 7 Zone-3-Websites. Davon bleiben 4 bestehen:
- Kaufy (/website/kaufy)
- System of a Town (/website/sot)
- Acquiary (/website/acquiary)
- FutureRoom (/website/futureroom)

Zu loeschen sind 3 Websites mit allen zugehoerigen Dateien:

### 1. Miety Website (10 Seiten-Dateien)

Dateien loeschen:
- `src/pages/zone3/miety/MietyApp.tsx`
- `src/pages/zone3/miety/MietyHome.tsx`
- `src/pages/zone3/miety/MietyInvite.tsx`
- `src/pages/zone3/miety/MietyKontakt.tsx`
- `src/pages/zone3/miety/MietyLayout.tsx`
- `src/pages/zone3/miety/MietyLeistungen.tsx`
- `src/pages/zone3/miety/MietyPreise.tsx`
- `src/pages/zone3/miety/MietyRegistrieren.tsx`
- `src/pages/zone3/miety/MietySoFunktioniert.tsx`
- `src/pages/zone3/miety/MietyVermieter.tsx`

### 2. Projekt Landing Pages (2 Dateien)

Dateien loeschen:
- `src/pages/zone3/projekt/ProjektLandingLayout.tsx`
- `src/pages/zone3/projekt/ProjektLandingPage.tsx`

### 3. Tenant Sites (2 Dateien)

Dateien loeschen:
- `src/pages/zone3/sites/TenantSiteLayout.tsx`
- `src/pages/zone3/sites/TenantSiteRenderer.tsx`

### 4. Manifest und Router bereinigen

**`src/manifests/routesManifest.ts`:**
- `zone3Websites`: Eintraege `miety`, `projekt` und `sites` entfernen
- `legacyRoutes`: Miety-Redirects (`/miety` und `/miety/*`) und Projekt-Redirects (`/projekt` und `/projekt/*`) entfernen

**`src/router/ManifestRouter.tsx`:**
- Alle lazy-Imports fuer Miety (9 Komponenten), ProjektLanding (2 Komponenten) und TenantSite (2 Komponenten) entfernen
- Zugehoerige Component-Map-Eintraege entfernen

### 5. Audit-Datei aktualisieren

**`artifacts/audit/zone3_sites.json`:**
- Miety-Eintrag entfernen (reduziert von 4 auf 3 Sites, bzw. aktualisieren auf die reale Struktur)

### 6. Zusammenfassung

| Aktion | Anzahl |
|--------|--------|
| Seiten-Dateien loeschen | 14 |
| Verzeichnisse (leer nach Loeschung) | 3 (miety, projekt, sites) |
| Manifest-Eintraege entfernen | 3 Website-Definitionen + 4 Legacy-Redirects |
| Router-Imports entfernen | ~13 lazy-Import-Zeilen |

Hinweis: MOD-20 (Miety/ZUHAUSE) im Portal bleibt vollstaendig erhalten -- nur die oeffentliche Zone-3-Website unter `/website/miety` wird entfernt. Die `useWebsites`-Hook und `tenant_websites`-Tabelle bleiben ebenfalls bestehen, da sie nicht an die statischen Zone-3-Sites gebunden sind.

