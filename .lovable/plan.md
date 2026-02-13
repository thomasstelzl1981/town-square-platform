
# Videocalls-Seite: Header-Fix, Einladungen vorab & Kalender-Integration

## 1. VideocallsTab.tsx — Header auf Design-Standard bringen

Aktuell verwendet die Seite einen manuellen Header (Icon + h2). Alle anderen Module nutzen `ModulePageHeader` + `PageShell`. Aenderung:

- Import von `PageShell` und `ModulePageHeader`
- Den manuellen Header-Block (Zeilen 62-73) ersetzen durch:
  ```
  <PageShell>
    <ModulePageHeader title="VIDEOCALLS" description="Starten Sie gebrandete Videocalls direkt aus dem Portal" />
    ...
  </PageShell>
  ```

## 2. Einladung VOR dem Call versenden (auf der Videocalls-Seite)

Neuer Bereich auf der VideocallsTab-Seite: **"Einladung versenden"** — ein Formular zum Planen und Einladen, OHNE sofort in den Call zu gehen.

### Ablauf
1. User gibt Call-Titel + E-Mail-Adresse(n) ein
2. Klickt "Einladung versenden"
3. System erstellt den Videocall (via `sot-videocall-create`), aber navigiert NICHT in den Raum
4. Sendet sofort die Einladung (via `sot-videocall-invite-send`)
5. Der Call erscheint in der Liste mit Status "draft" — der Host kann spaeter beitreten

### UI-Aenderung in VideocallsTab.tsx
- Neuer Abschnitt unter "Neuer Videocall" mit:
  - Titel-Feld (bereits vorhanden, wird wiederverwendet)
  - E-Mail-Feld fuer Eingeladenen
  - Optionales Namensfeld
  - Button "Einladung versenden" (erstellt Call + sendet Invite, bleibt auf der Seite)
  - Button "Sofort starten" (bestehendes Verhalten, navigiert in den Raum)

## 3. Kalender-Integration: Termin mit Videocall-Einladung

### DB-Migration
Neue Spalte in `calendar_events`:
```sql
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS video_call_id uuid REFERENCES video_calls(id);
```

### Kalender "Neuer Termin"-Dialog erweitern
Im bestehenden Termin-Erstellungs-Dialog (KalenderTab.tsx) wird ein Toggle hinzugefuegt:

- **Switch**: "Mit Videocall-Einladung"
- Wenn aktiviert: E-Mail-Feld fuer Teilnehmer wird eingeblendet
- Beim Erstellen:
  1. Videocall wird erstellt (sot-videocall-create)
  2. Einladung wird versendet (sot-videocall-invite-send)
  3. Kalender-Event wird mit `video_call_id` gespeichert
- In der Tagesansicht: Events mit Videocall zeigen ein Video-Icon und einen "Beitreten"-Button

## Technische Umsetzung (Dateien)

| Datei | Aenderung |
|-------|-----------|
| `supabase/migrations/xxx_calendar_videocall.sql` | `video_call_id` Spalte in calendar_events |
| `src/pages/portal/office/VideocallsTab.tsx` | PageShell/ModulePageHeader + Einladungsformular |
| `src/pages/portal/office/KalenderTab.tsx` | Videocall-Toggle im Termin-Dialog + Video-Icon in Tagesansicht |

### Reihenfolge
1. DB-Migration (video_call_id Spalte)
2. VideocallsTab.tsx ueberarbeiten (Header + Einladung vorab)
3. KalenderTab.tsx erweitern (Videocall-Option im Termin-Dialog)
