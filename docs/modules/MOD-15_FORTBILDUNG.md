# MOD-15: Fortbildung

## Übersicht

| Attribut | Wert |
|----------|------|
| **Zone** | 2 (Portal) |
| **Pfad** | `/portal/fortbildung` |
| **Icon** | `GraduationCap` |
| **Org-Types** | `partner`, `subpartner` |
| **Default Visible** | Ja |
| **Display Order** | 15 |

## Beschreibung

Das Fortbildungs-Modul bietet Zugang zu Schulungen, Zertifizierungen und Weiterbildungsinhalten für Partner und Subpartner im Immobilienvertrieb.

## Tiles (4-Tile-Pattern)

### 1. Katalog
- **Route:** `/portal/fortbildung/katalog`
- **Beschreibung:** Verfügbare Kurse
- **Inhalte:**
  - §34c-Schulungen
  - Produktschulungen
  - Verkaufstrainings
  - Compliance-Kurse

### 2. Meine Kurse
- **Route:** `/portal/fortbildung/meine-kurse`
- **Beschreibung:** Laufende Kurse
- **Funktionen:**
  - Fortschritts-Tracking
  - Video-Lektionen
  - Quiz & Tests
  - Kurs-Fortsetzung

### 3. Zertifikate
- **Route:** `/portal/fortbildung/zertifikate`
- **Beschreibung:** Erworbene Zertifikate
- **Funktionen:**
  - Zertifikats-Download
  - Gültigkeits-Tracking
  - Rezertifizierungs-Reminder

### 4. Einstellungen
- **Route:** `/portal/fortbildung/einstellungen`
- **Beschreibung:** Lernpräferenzen
- **Funktionen:**
  - Benachrichtigungen
  - Lernziele
  - Profil-Verknüpfung

## Datenmodell

### Primäre Tabellen
- `courses` — Kurse (zu erstellen)
- `course_enrollments` — Einschreibungen
- `course_progress` — Fortschritt
- `certificates` — Zertifikate

## Integration

### Abhängigkeiten
- **MOD-01 (Stammdaten):** Profil-Verknüpfung
- **MOD-09 (Vertriebspartner):** Qualifikations-Check
