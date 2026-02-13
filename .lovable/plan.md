
# MOD-05 umbenennen und KI-Telefonassistent unter Communication Pro anlegen

## Aenderungen

### 1. `src/manifests/routesManifest.ts` — MOD-05 umbenennen (Zeile 269)

Vorher: `name: "KI-Telefon-Assistent"`
Nachher: `name: "Platzhalter"`

### 2. `src/manifests/routesManifest.ts` — MOD-14 Tiles erweitern (Zeile 443)

Neuer Tile-Eintrag nach "Agenten":

```text
{ path: "ki-telefon", component: "CommProKiTelefon", title: "KI-Telefonassistent" }
```

Ergebnis MOD-14 Sub-Tabs: Serien-E-Mails | Recherche | Social | Agenten | **KI-Telefonassistent**

### 3. `src/pages/portal/communication-pro/CommunicationProPage.tsx` — Neue Route

Lazy-Import und Route fuer den KI-Telefonassistenten hinzufuegen:

```text
const KiTelefonPage = lazy(() => import('./ki-telefon/KiTelefonPage'));
<Route path="ki-telefon" element={<KiTelefonPage />} />
```

### 4. Neue Datei: `src/pages/portal/communication-pro/ki-telefon/KiTelefonPage.tsx`

Placeholder-Seite mit dem bestehenden Design aus `KiTelefonUebersicht.tsx` (Phone-Icon, "Kommt bald"-Hinweis), angepasst an den Communication-Pro-Kontext.

### 5. `src/pages/portal/msv/KiTelefonUebersicht.tsx` — Inhalt anpassen

Titel und Beschreibung auf "Platzhalter" aendern, um konsistent mit dem umbenannten Modul zu sein.

### Keine weiteren Aenderungen
- Routen von MOD-05 (`/portal/msv/*`) bleiben bestehen
- Datenbank und RLS bleiben unveraendert
