

## Analyse: Exposé-OCR-Extraktion und Kaufy-Readiness

### Was die KI heute schon extrahiert

Die Edge Function `sot-project-intake` sendet das Exposé-PDF bereits als Base64 an Gemini Pro und extrahiert via Tool-Calling:

| Feld | Extrahiert? | Wert (Menden) |
|---|---|---|
| `projectName` | ✅ | "Menden Living" |
| `city`, `postalCode`, `address` | ✅ | Menden, 58706, Wunne 6-28 |
| `description` | ✅ | 200 Zeichen Kurzbeschreibung |
| `constructionYear` | ✅ | 1980 |
| `modernizationStatus` | ✅ | "gepflegt / modernisiert" |
| `developer` | ✅ | "Kalo Eisenach GmbH" |
| `projectType` | ✅ | "aufteilung" |
| `wegCount` + `wegDetails` | ✅ | 3 WEGs |

### Was NICHT extrahiert wird (aber im Exposé steht)

Das Tool `extract_project_data` hat nur 12 Properties definiert — alle auf Kurzform. Folgende Daten stehen im Exposé, werden aber ignoriert:

| Datenpunkt | Kaufy braucht es? | DB-Spalte existiert? |
|---|---|---|
| **Ausfuehrliche Objektbeschreibung** (Lage, Ausstattung, Besonderheiten) | ✅ Pflicht | `properties.description` — aber nur 200 Zeichen |
| **Energieausweis** (Typ, Kennwert, Klasse, gueltig bis) | ✅ Rechtlich (EnEV) | `properties.energy_certificate_type` etc. — nur in `units`, nicht in `properties` |
| **Heizungsart** | ✅ Kaufy-Datenblatt | `properties.heating_type` ✅ |
| **Energietraeger** | ✅ Kaufy-Datenblatt | `properties.energy_source` ✅ |
| **Sanierungsjahr** | ✅ | `properties.renovation_year` ✅ |
| **Ausstattungsmerkmale** (Balkon, Stellplatz-Typ, Aufzug, Keller) | ✅ Features-Liste | ❌ nur als Tags auf Unit-Ebene |
| **Lage-Beschreibung** (Infrastruktur, Verkehrsanbindung) | ✅ Kaufy-SEO | ❌ kein eigenes Feld |
| **Grundriss-Referenzen** | Nice-to-have | ❌ (kommt via DMS) |

### Was zu tun ist

**Kernproblem:** Der Gemini-Pro-Call liest das Exposé bereits vollstaendig — aber das Tool-Schema fragt nur nach 12 Kurzfeldern. Wir muessen das Schema erweitern, nicht einen neuen OCR-Prozess bauen.

#### Loesung: `extract_project_data` Tool-Schema erweitern

Neue Properties im bestehenden Tool-Call (kein zweiter AI-Call noetig):

```text
Neue Felder im EXTRACT_PROJECT_TOOL.parameters.properties:

1. fullDescription     (string)  — Ausfuehrliche Objektbeschreibung (500-1000 Woerter)
                                   Lage, Ausstattung, Besonderheiten, Verkehrsanbindung
2. locationDescription (string)  — Lagebeschreibung separat (Infrastruktur, OEPNV, Schulen)
3. features            (array)   — Ausstattungsmerkmale als Liste
                                   z.B. ["Balkon", "Aufzug", "Keller", "TG-Stellplatz"]
4. energyCertType      (string)  — "Verbrauchsausweis" | "Bedarfsausweis"
5. energyCertValue     (number)  — Kennwert in kWh/(m²·a)
6. energyClass         (string)  — "A+" bis "H"
7. energyCertValidUntil(string)  — Gueltig bis (Datum als String)
8. heatingType         (string)  — "Zentralheizung" | "Etagenheizung" | "Fernwaerme" etc.
9. energySource        (string)  — "Gas" | "Fernwaerme" | "Waermepumpe" etc.
10. renovationYear     (number)  — Letztes Sanierungsjahr
11. parkingType        (string)  — "Tiefgarage" | "Stellplatz" | "Carport" | "keine"
12. parkingPrice       (number)  — Stellplatzpreis (falls separat)
```

#### Aenderungen im Detail

| # | Datei | Aenderung |
|---|---|---|
| 1 | `sot-project-intake/index.ts` Z.39-77 | `EXTRACT_PROJECT_TOOL` um 12 neue Properties erweitern |
| 2 | `sot-project-intake/index.ts` Z.79-87 | `EXPOSE_SYSTEM_PROMPT` anpassen: "Extrahiere auch die ausfuehrliche Beschreibung, Energiedaten und Ausstattung" |
| 3 | `sot-project-intake/index.ts` Z.324-339 | Mapping der neuen Felder in `extractedData` |
| 4 | `sot-project-intake/index.ts` (Projekt-INSERT) | Neue Felder in `dev_projects` oder `intake_data` speichern |
| 5 | DB-Migration | `dev_projects` um Spalten erweitern: `full_description`, `location_description`, `features` (jsonb), `energy_cert_type`, `energy_cert_value`, `energy_class`, `heating_type`, `energy_source`, `parking_type` |
| 6 | `ProjectOverviewCard.tsx` | Erweiterte Beschreibung anzeigen |
| 7 | `CreatePropertyFromUnits.tsx` | Beim Massenerstellung diese Felder in `properties` mitmappen |

#### Kein separater OCR-Prozess noetig

Gemini Pro liest das PDF bereits komplett (inkl. Bilder, Tabellen, Fliesstext). Es ist kein zusaetzlicher OCR-Schritt noetig — wir muessen nur das Tool-Schema erweitern und dem Modell sagen, dass es mehr Felder extrahieren soll. Das ist ein reines Schema-Update, kein neuer Service.

#### Fuer bestehende Projekte: Re-Extraction

Da das Exposé bereits im Storage liegt (`tenant-documents/...`), koennte ein "Re-Analyse"-Button das Exposé erneut durch die erweiterte Extraktion schicken und die fehlenden Felder nachfuellen. Das waere ein optionaler zweiter Schritt.

### Zusammenfassung

| Frage | Antwort |
|---|---|
| Kann die KI das Exposé lesen? | ✅ Ja — Gemini Pro liest das PDF bereits vollstaendig |
| Warum fehlen Daten? | Das Tool-Schema fragt nur 12 Kurzfelder ab |
| Brauchen wir einen neuen OCR-Prozess? | ❌ Nein — Schema-Erweiterung reicht |
| Was muss passieren? | Tool-Schema erweitern + neue DB-Spalten + Mapping |
| Aufwand? | ~45 Min (Schema + Prompt + DB + Mapping) |

