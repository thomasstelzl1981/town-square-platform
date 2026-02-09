

# 2. Antragsteller: Echtes Formular statt Platzhalter

## Aktueller Zustand

Zeile 680-693 in `SelbstauskunftFormV2.tsx`: Wenn der Toggle aktiviert wird, erscheint nur ein Hinweistext "Fuer einen zweiten Antragsteller erstellen Sie bitte ein separates Profil." -- kein echtes Formular.

Die DB-Spalte `linked_primary_profile_id` auf `applicant_profiles` ist bereits vorhanden (FK auf sich selbst).

## Was gebaut wird

**Einfaches Prinzip**: Toggle aktivieren = zweites, identisches Formular fuer Person 2 erscheint. Gleiche Felder, eigener Datensatz in `applicant_profiles` mit `party_role = 'co_applicant'`.

## Datentrennung

| Sektion | Antragsteller 1 | Antragsteller 2 | Geteilt? |
|---------|----------------|----------------|----------|
| 1. Person | Eigene Daten | Eigene Daten | Nein |
| 2. Haushalt | Eigene Daten | -- | Ja (gilt fuer beide, nur 1x erfasst) |
| 3. Beschaeftigung | Eigene Daten | Eigene Daten | Nein |
| 4. Bank | Eigene Daten | Eigene Daten | Nein |
| 5. Einnahmen | Eigene Daten | Eigene Daten | Nein |
| 6. Ausgaben | Eigene Daten | Eigene Daten | Nein |
| 7. Vermoegen | Eigene Daten | Eigene Daten | Nein |
| 8. Verbindlichkeiten | Eigene Daten | Eigene Daten | Nein |
| 9. Erklaerungen | Eigene Daten | -- | Ja (gilt fuer beide, nur 1x erfasst) |

## Technischer Ablauf

### SelbstauskunftTab.tsx

- Zusaetzliche Query: Co-Applicant-Profil laden (`party_role = 'co_applicant'` + `linked_primary_profile_id = primary.id`)
- Wenn Toggle aktiviert und kein Co-Applicant existiert: INSERT mit `party_role = 'co_applicant'`, `linked_primary_profile_id = primary.id`
- Co-Applicant-Profil als `coApplicantProfile` an `SelbstauskunftFormV2` uebergeben

### SelbstauskunftFormV2.tsx

- Neue Props: `coApplicantProfile?: ApplicantProfile`, `onCoApplicantToggle?: (enabled: boolean) => void`
- Zweiter `formData`-State: `coFormData` (identische Felder-Struktur)
- Wenn Toggle aktiviert und `coApplicantProfile` vorhanden:
  - Sektion 1: Zweiter Block "2. Antragsteller:in" mit eigenem Formular (gleiche Felder wie Antragsteller 1)
  - Sektionen 3-7: Jeweils ein zweiter Block "2. Antragsteller:in" unter dem ersten
  - Sektion 8: Eigene Verbindlichkeiten-Tabelle fuer Antragsteller 2
  - Sektionen 2 + 9: Bleiben einmalig (Haushalt und Erklaerungen gelten fuer beide)
- Save-Handler: Speichert beide Profile in einer Transaktion

### Kein Routing noetig

Alles bleibt auf derselben Seite. Kein neues Modul, kein neuer Tab, keine neuen Routen. Der Toggle blendet einfach die zweiten Formularfelder ein/aus.

## Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `SelbstauskunftTab.tsx` | Query fuer Co-Applicant, Create-Logik bei Toggle, Props erweitern |
| `SelbstauskunftFormV2.tsx` | `coFormData` State, zweite Formularfelder pro Sektion, erweiterter Save |

Keine DB-Migration noetig -- `linked_primary_profile_id` und `party_role` existieren bereits.

## Risiko

Null bis sehr niedrig. Die bestehenden Formularfelder fuer Antragsteller 1 werden nicht veraendert. Der zweite Antragsteller ist ein eigener Datensatz mit eigener UUID. Keine Vermischung moeglich, da jedes Feld an sein eigenes Profil-Objekt gebunden ist.

