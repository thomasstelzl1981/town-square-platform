

## Landing Page Builder: KI-Magie und Daten-Uebernahme

### Ist-Zustand (Probleme)

1. **Erstellen** erzeugt nur einen leeren DB-Eintrag mit Projektname + Stadt — keine Beschreibungen, keine Bilder, kein Impressum
2. **Kein Zuruecksetzen** — existierende Landing Page kann nicht auf Entwurf zurueckgesetzt oder geloescht werden
3. **Bilder** kommen aus dem alten `project_images` JSON-Feld statt aus dem neuen `document_links`-System (Multi-Image)
4. **Beschreibung** aus dem Datenblatt (`full_description`, `location_description`) wird nicht in die Landing Page uebernommen
5. **Impressum/Datenschutz** sind leer — `developer_contexts`-Daten werden nicht beim Erstellen geladen
6. **Kein Logo-Upload** — es gibt keinen Slot fuer ein Projektlogo/Partnerlogo
7. **Editor** hat keinen "KI-Website optimieren"-Button

### Plan (6 Aenderungen)

#### 1. Landing Page Erstellung mit Daten-Uebernahme (`LandingPageTab.tsx`)

`handleCreate` wird erweitert: Nach dem Insert werden automatisch alle verfuegbaren Daten aus `dev_projects` und `developer_contexts` in die `landing_pages`-Zeile geschrieben:

- `about_text` ← `full_description`
- `location_description` ← `location_description` 
- `hero_subheadline` ← Adresse + PLZ + Stadt
- `footer_company_name` ← `developer_contexts.name + legal_form`
- `footer_address` ← `developer_contexts` Adressdaten
- `contact_email` / `contact_phone` ← aus `developer_contexts`
- `highlights_json` ← `features` Array aus `dev_projects`

#### 2. Zuruecksetzen-Button (`LandingPageTab.tsx`)

Neuer Button "Zuruecksetzen" in der Status-Bar neben "Vorschau". Loescht die Landing-Page-Zeile aus der DB und invalidiert den Query-Cache — danach erscheint wieder die "Website erstellen"-Ansicht.

#### 3. Logo-Slot im Datenblatt (`ProjectDataSheet.tsx`)

`IMAGE_SLOTS` wird um `{ key: 'logo', label: 'Logo', desc: 'Projekt-/Partnerlogo fuer Website' }` erweitert (5 Slots statt 4). Das Logo wird auf der Landing Page im Header angezeigt.

#### 4. Bilder aus document_links statt project_images (Zone 3 Seiten)

`ProjectLandingHome.tsx` und `ProjectLandingObjekt.tsx` werden angepasst: Statt `project_images` JSON-Feld werden Bilder ueber `document_links` + `documents` + signierte Storage-URLs geladen (gleiche Logik wie `loadSlotImages`). So sind Multi-Image-Uploads sofort auf der Website sichtbar.

#### 5. KI-Website-Optimierung Button (`LandingPageTab.tsx`)

Neuer Button "KI-Texte generieren" im Editor-Bereich. Ruft `sot-project-description` auf (existiert bereits) und schreibt die generierten Texte direkt in die Landing-Page-Felder. Falls noch keine Beschreibung im Projekt existiert, wird sie zuerst generiert und dann uebernommen.

#### 6. Impressum/Datenschutz aus developer_contexts (Zone 3)

`ProjectLandingImpressum.tsx` und `ProjectLandingDatenschutz.tsx` laden bereits den `developer_context`. Aktuell fehlt aber die Befuellung beim Erstellen. Die `handleCreate`-Funktion laedt den `developer_context` des Projekts und schreibt `imprint_text` und `privacy_text` als vorausgefuellte Texte in die Landing Page.

### Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `src/pages/portal/projekte/LandingPageTab.tsx` | handleCreate mit Datenpopulation, Reset-Button, KI-Button |
| `src/components/projekte/ProjectDataSheet.tsx` | Logo-Slot hinzufuegen |
| `src/pages/zone3/project-landing/ProjectLandingHome.tsx` | Bilder aus document_links laden |
| `src/pages/zone3/project-landing/ProjectLandingObjekt.tsx` | Bilder aus document_links laden |
| `src/pages/zone3/project-landing/ProjectLandingLayout.tsx` | Logo im Header anzeigen |

### Freeze-Check

Alle Dateien gehoeren zu MOD-13 (Projekte) oder Zone 3 Project-Landing — beides nicht eingefroren.

