

## Befund

### Was bereits existiert
Die **Armstrong-Adresse** (`vorname.nachname@neilarmstrong.space`) wird bereits in der **ProfilTab RecordCard** angezeigt (Zeile 517-518) mit dem Hint: *"E-Mails an diese Adresse werden von Armstrong als Aufträge verarbeitet"*. ABER: Dieses Feld ist nur sichtbar, wenn die RecordCard **aufgeklappt** ist. Wenn sie zugeklappt ist, sieht man nur das OutboundIdentityWidget.

### Was falsch ist
Der Info-Text im **OutboundIdentityWidget** (Zeile 308-312) sagt:
> *"Diese Absenderkennung wird für alle Outbound-E-Mails im Portal verwendet..."*

Das stimmt nicht mehr. Das System nutzt die Outbound-Kennung nur als **Fallback**, wenn kein eigenes E-Mail-Konto (Gmail) verbunden ist. Wenn ein eigenes Konto eingerichtet ist, wird dieses verwendet.

### Betroffene Dateien

| Datei | Freeze-Check | Status |
|-------|-------------|--------|
| `src/components/portal/OutboundIdentityWidget.tsx` | Kein Modul-Pfad | FREI editierbar |

### Geplante Aenderungen

1. **Info-Text korrigieren** — Fallback-Hinweis: *"Diese Absenderkennung wird als Fallback verwendet, wenn kein eigenes E-Mail-Konto (z.B. Gmail) verbunden ist."*

2. **Armstrong-Adresse als eigene Section hinzufuegen** — Unterhalb der Upload-E-Mail-Section eine neue Section "KI-Assistent (Armstrong)" mit:
   - Anzeige der `armstrong_email` aus dem Profil (`profiles.armstrong_email`)
   - Kopier-Button
   - Hint: *"Senden Sie Aufgaben, E-Mails und Unterlagen an diese Adresse — Armstrong verarbeitet sie automatisch."*
   - Icon: `Sparkles` oder `Bot`

3. **Kein Freeze-Unfreeze noetig** — Die Datei liegt unter `src/components/portal/`, was keinem Modul-Pfad zugeordnet ist.

Zum Umsetzen bitte bestaetigen.

