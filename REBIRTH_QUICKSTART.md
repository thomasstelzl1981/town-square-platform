# Schnellstart: Rebirth System

## Was ist das?

Ein System zum Erstellen von "Wiederherstellungspunkten" (Checkpoints) in deinem Repository, bevor du größere Änderungen in Lovable vornimmst.

## Sofort loslegen (3 Schritte)

### 1️⃣ Checkpoint erstellen (JETZT)

```bash
./scripts/create-checkpoint.sh
```

Das wars! Ein Checkpoint mit dem heutigen Datum wurde erstellt.

### 2️⃣ Arbeite in Lovable

Gehe zu Lovable und gib deine Prompts ein. Lovable wird automatisch Änderungen committen.

### 3️⃣ Zurück zum Checkpoint (falls gewünscht)

```bash
./scripts/restore-checkpoint.sh rebirth-20260205
```

## Häufige Fragen

**Q: Wann sollte ich einen Checkpoint erstellen?**
- Vor jedem größeren Lovable-Prompt
- Vor experimentellen Änderungen
- Wenn du einen "sauberen" Zustand sichern möchtest

**Q: Wie viele Checkpoints kann ich haben?**
- So viele du willst! Jeder Checkpoint ist nur ein Git-Tag.

**Q: Kann ich mehrere Checkpoints haben?**
- Ja! Nutze aussagekräftige Namen:
  ```bash
  ./scripts/create-checkpoint.sh rebirth-before-module-x
  ./scripts/create-checkpoint.sh rebirth-working-state
  ```

**Q: Was passiert beim Restore?**
- Ein neuer Branch wird vom Checkpoint erstellt
- Deine aktuellen Änderungen werden gesichert (stash)
- Du kannst den wiederhergestellten Zustand reviewen

**Q: Beeinflusst das meine aktuelle Arbeit?**
- Nein! Restore erstellt einen neuen Branch
- Deine originalen Branches bleiben unberührt

## Alle verfügbaren Checkpoints anzeigen

```bash
./scripts/list-checkpoints.sh
```

## Detaillierte Dokumentation

Für alle Details siehe: [REBIRTH_SYSTEM.md](./REBIRTH_SYSTEM.md)

## Bereits erstellter Checkpoint

✅ **rebirth-pre-lovable-2026-02-05**
- Erstellt am: 2026-02-05
- Branch: copilot/update-lovable-modules
- Commit: 134eace

Dies ist dein "sauberer" Ausgangspunkt vor den Lovable-Änderungen.

## Nächste Schritte

1. ✅ Checkpoint erstellt
2. 🚀 Gehe zu Lovable und gib deine Prompts ein
3. 🔄 Bei Bedarf: Zurück zum Checkpoint mit `./scripts/restore-checkpoint.sh`

## Support

Falls etwas nicht funktioniert:
- Siehe: [REBIRTH_SYSTEM.md](./REBIRTH_SYSTEM.md) (Troubleshooting-Sektion)
- Oder nutze manuelle Git-Befehle (siehe Dokumentation)
