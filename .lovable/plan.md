
# Virtueller Walkthrough MOD-13 Golden Path: Fehleranalyse und Reparaturplan

## Walkthrough-Ergebnis

Der Pfad wurde Schritt fuer Schritt durchgespielt. Es wurden **3 Probleme** identifiziert — davon **1 mittel** und **2 klein**. Der Grossteil des Pfads funktioniert korrekt.

---

## Was korrekt funktioniert (bestaetigt)

| Schritt | Status | Begruendung |
|---------|--------|-------------|
| Magic Intake: Expose + Preisliste Upload | OK | Projektanlage mit `dev_projects` + `dev_project_units`, Storage-Tree wird erstellt |
| DMS-Ablage (Expose/Preisliste) | OK | Standardordner (01_expose, 02_preisliste etc.) werden bei Projektanlage geseedet |
| Preisliste entsteht in PortfolioTab | OK | Echte Units werden aus `dev_project_units` geladen (Fix 2 aus letztem Plan) |
| Demo-Projekt bleibt permanent | OK | `isDemoProject()` prueft auf feste ID, Demo-Kachel wird immer als erstes Element gerendert |
| Landing Page Builder | OK | Echte Adressdaten werden durchgereicht, KI-Lagebeschreibung generiert |
| Landing Page Vorschau mit echten Units | OK | `LandingPagePreview` reicht `units`-Prop durch an `LandingPageWebsite` |
| Oeffentlicher Landing Page Link | OK | Route `/projekt/:slug` funktioniert, laedt echte Daten via `useProjectDataForLandingPage` |
| Link zur Website sichtbar | OK | Browser-Frame zeigt `slug.kaufy.app` in URL-Leiste, "Website oeffnen" Button oeffnet `/projekt/{slug}` |
| Vertriebsaktivierung (direkt, kein Pending) | OK | `SalesApprovalSection` setzt Status `approved`, erstellt Listings + Publications |
| Kaufy-Toggle | OK | Upsert auf `listing_publications` mit Channel `kaufy`, `dev_projects.kaufy_listed` wird gesetzt |
| MOD-09 Katalog empfaengt Listings | OK | `KatalogTab` queried `listing_publications` mit `channel: partner_network` + `status: active` — exakt was die Aktivierung erstellt |
| Zone 3 Kaufy empfaengt Listings | OK | Kaufy sucht via `listing_publications` mit `channel: kaufy` + `status: active` |
| Zone 1 Kill-Switch | OK | `SalesDesk` zeigt aktive Projekte, Deaktivierung setzt Listings auf `withdrawn` + Publications auf `paused` |
| Widerrufs-Cleanup | OK | `deactivateVertriebsauftrag()` bereinigt Listings, Publications und `kaufy_listed` Flag |
| `requested_at` Spalte | OK | Existiert im Schema (`sales_desk_requests.requested_at`), wird korrekt in SalesDesk und SalesApprovalSection referenziert |

---

## Problem 1: Kein Refresh-Button in der Landing Page Vorschau (MITTEL)

**Befund:** `LandingPagePreview.tsx` hat keinen Refresh-Button. Nach Aenderungen am Projekt (z.B. neue Bilder, geaenderte Texte) muss der User die Seite komplett neu laden, um die Vorschau zu aktualisieren. Es fehlt ein expliziter "Aktualisieren"-Button, der die Landing-Page-Daten neu laedt.

**Reparatur:** Einen `RefreshCw`-Button in die Action-Bar (Zeile 92-101) der `LandingPagePreview` einfuegen. Beim Klick wird der React-Query-Cache fuer die Landing-Page-Daten und die Unit-Daten invalidiert, was ein erneutes Laden der Vorschau ausloest.

Zusaetzlich muss `LandingPageTab.tsx` eine `onRefresh`-Callback-Prop an `LandingPagePreview` uebergeben, die `queryClient.invalidateQueries` fuer die relevanten Query-Keys ausfuehrt.

| Datei | Aenderung |
|-------|-----------|
| `LandingPagePreview.tsx` | Neuen `onRefresh`-Prop + RefreshCw-Button in Action-Bar |
| `LandingPageTab.tsx` | `onRefresh`-Callback mit Query-Invalidierung uebergeben |

---

## Problem 2: "Bearbeiten"-Button ohne klare Kommunikation (KLEIN)

**Befund:** Der "Bearbeiten"-Button in `LandingPagePreview.tsx` (Zeile 93-96) ist `disabled` mit einem "Soon"-Badge. Das ist grundsaetzlich korrekt fuer den aktuellen Scope. Allerdings fehlt ein Tooltip oder eine kurze Erklaerung, was "Soon" bedeutet — der User koennte erwarten, dass dies bereits funktioniert.

**Reparatur:** Einen Tooltip hinzufuegen: "Inline-Editing wird in einer zukuenftigen Version verfuegbar sein."

| Datei | Aenderung |
|-------|-----------|
| `LandingPagePreview.tsx` | Tooltip um den Bearbeiten-Button |

---

## Problem 3: Landing Page Link nicht als dedizierter klickbarer Link sichtbar (KLEIN)

**Befund:** Der Link zur oeffentlichen Landing Page ist im Browser-Frame als URL-Leiste (`slug.kaufy.app`) sichtbar und ueber den "Website oeffnen"-Button erreichbar. Es gibt jedoch unterhalb der Vorschau keinen eigenen, kopierbaren Link-Bereich — z.B. ein Input-Feld mit "Link kopieren"-Button, damit der User die URL einfach teilen kann.

**Reparatur:** In der Action-Bar (unterhalb des Browser-Frames) einen kleinen kopierbaren Link-Bereich einfuegen: Ein `Input`-Feld (read-only) mit der vollen URL und einem "Kopieren"-Icon-Button daneben, der die URL in die Zwischenablage kopiert.

| Datei | Aenderung |
|-------|-----------|
| `LandingPagePreview.tsx` | Kopierbarer Link-Bereich in Action-Bar |

---

## Zusammenfassung der Aenderungen

| # | Datei | Prioritaet | Problem |
|---|-------|------------|---------|
| 1 | `LandingPagePreview.tsx` | MITTEL | Refresh-Button, kopierbarer Link, Tooltip |
| 2 | `LandingPageTab.tsx` | MITTEL | onRefresh-Callback uebergeben |

## Bestaetigung

- **Demo-Projekt:** Bleibt permanent als erste Kachel sichtbar, unabhaengig von echten Projekten.
- **Landing Page Link:** Existiert bereits (Browser-Frame URL + "Website oeffnen" Button), wird durch kopierbaren Link-Bereich ergaenzt.
- **Vertriebspfad:** Vollstaendig funktional von Aktivierung bis Kaufy/Partner-Katalog.
- **Zone 1 Kill-Switch:** Funktional, deaktiviert rekursiv alle Kanäle.
