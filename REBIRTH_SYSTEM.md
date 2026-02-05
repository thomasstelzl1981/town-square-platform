# Rebirth System - Checkpoint & Restore

## Überblick

Das Rebirth-System ermöglicht es dir, Checkpoints (Wiederherstellungspunkte) im Repository zu erstellen, bevor du größere Änderungen vornimmst. Du kannst jederzeit zu einem früheren Checkpoint zurückkehren.

## Anwendungsfall

Du möchtest:
1. Den aktuellen Zustand des Repos als "sauberen" Checkpoint speichern
2. In Lovable neue Module entwickeln und experimentieren
3. Die Möglichkeit haben, jederzeit zum gespeicherten Zustand zurückzukehren

## Schnellstart

### 1. Checkpoint erstellen

```bash
# Erstelle einen Checkpoint mit automatischem Namen (rebirth-YYYYMMDD)
./scripts/create-checkpoint.sh

# Oder mit eigenem Namen
./scripts/create-checkpoint.sh rebirth-before-lovable-modules
```

### 2. Checkpoints anzeigen

```bash
./scripts/list-checkpoints.sh
```

### 3. Zu einem Checkpoint zurückkehren

```bash
./scripts/restore-checkpoint.sh rebirth-20260205
```

## Detaillierte Nutzung

### Checkpoint erstellen

Das Script `create-checkpoint.sh` erstellt einen Git-Tag mit allen wichtigen Informationen:

```bash
cd /home/runner/work/town-square-platform/town-square-platform
./scripts/create-checkpoint.sh [optional-tag-name]
```

**Was passiert:**
- Ein annotierter Git-Tag wird erstellt
- Der Tag enthält: Datum, Branch-Name, Commit-Hash
- Optional: Tag wird zum Remote-Repository gepusht
- Tag-Format: `rebirth-YYYYMMDD` oder dein eigener Name

**Beispiel:**
```bash
# Automatischer Name
./scripts/create-checkpoint.sh
# Erstellt: rebirth-20260205

# Eigener Name
./scripts/create-checkpoint.sh rebirth-before-major-refactor
```

### Checkpoints auflisten

```bash
./scripts/list-checkpoints.sh
```

Zeigt alle verfügbaren Checkpoints mit Details an.

### Zu Checkpoint zurückkehren

```bash
./scripts/restore-checkpoint.sh <tag-name>
```

**Was passiert:**
1. Das Script warnt bei uncommitted changes
2. Optional: Stashed uncommitted changes automatisch
3. Erstellt einen neuen Branch vom Checkpoint
4. Branch-Name: `restore-<tag>-<timestamp>`
5. Checked aus zum neuen Branch

**Beispiel:**
```bash
./scripts/restore-checkpoint.sh rebirth-20260205
# Erstellt Branch: restore-rebirth-20260205-20260205-143000
```

## Workflow: Lovable-Integration

### Vor dem Prompt in Lovable

```bash
# 1. Aktuellen Stand committen
git add .
git commit -m "Current state before Lovable changes"

# 2. Checkpoint erstellen
./scripts/create-checkpoint.sh rebirth-before-lovable

# 3. Tag pushen (wenn gefragt)
# Wähle "y" um den Checkpoint auch remote zu sichern
```

### Nach Lovable-Änderungen

Wenn Lovable automatisch Änderungen committet hat:

**Option A: Änderungen behalten**
```bash
# Einfach weiterarbeiten, Checkpoint bleibt verfügbar
git pull
git push
```

**Option B: Zum Checkpoint zurückkehren**
```bash
# Zurück zum gespeicherten Zustand
./scripts/restore-checkpoint.sh rebirth-before-lovable

# Review des Zustands
git log
git status

# Wenn zufrieden, pushen
git push origin restore-rebirth-before-lovable-<timestamp>
```

## Manuelle Git-Befehle

Falls du die Scripts nicht nutzen möchtest:

### Tag erstellen
```bash
git tag -a rebirth-20260205 -m "Checkpoint before changes"
git push origin rebirth-20260205
```

### Tags anzeigen
```bash
git tag -l "rebirth-*"
git show rebirth-20260205
```

### Zu Tag zurückkehren
```bash
# Neuer Branch vom Tag
git checkout -b restore-branch rebirth-20260205

# Oder direkt auschecken (detached HEAD)
git checkout rebirth-20260205
```

### Tag löschen
```bash
# Lokal
git tag -d rebirth-20260205

# Remote
git push origin :refs/tags/rebirth-20260205
```

## Best Practices

1. **Regelmäßige Checkpoints**: Erstelle vor jeder größeren Änderung einen Checkpoint
2. **Aussagekräftige Namen**: Nutze beschreibende Tag-Namen
3. **Remote pushen**: Pushe wichtige Checkpoints zum Remote-Repository
4. **Dokumentation**: Nutze die Tag-Message für zusätzliche Infos
5. **Aufräumen**: Lösche alte Checkpoints, die du nicht mehr brauchst

## Troubleshooting

### "Tag already exists"
```bash
# Alten Tag löschen und neu erstellen
git tag -d rebirth-20260205
./scripts/create-checkpoint.sh rebirth-20260205
```

### "Uncommitted changes"
```bash
# Änderungen stashen
git stash

# Checkpoint restore
./scripts/restore-checkpoint.sh <tag>

# Änderungen wiederherstellen (wenn gewünscht)
git stash pop
```

### Script nicht ausführbar
```bash
chmod +x scripts/*.sh
```

## Technische Details

### Tag-Format

Annotierte Tags enthalten:
- **Tag-Name**: `rebirth-YYYYMMDD` oder custom
- **Message**: Erstellungsdatum, Branch, Commit-Info
- **Commit-Hash**: Der genaue Zustand zum Zeitpunkt

### Branch-Strategie

- Restore erstellt **neue Branches**, keine Force-Updates
- Original-Branches bleiben unberührt
- Sicher für Collaboration

### Remote-Synchronisation

- Tags können gepusht/gepullt werden
- Team-Mitglieder können dieselben Checkpoints nutzen
- Dezentrale Backups

## Weitere Informationen

- [Git Tagging Documentation](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Lovable Documentation](https://docs.lovable.dev/)
- Siehe auch: `STATUS_AND_STRATEGY.md` für Projekt-Kontext
