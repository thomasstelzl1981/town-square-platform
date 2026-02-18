

## "Kontakte" in "Briefe" umbenennen (Mobile Home)

### Problem

Auf Mobile fuehrt der Eintrag "Kontakte" zum Office-Modul (MOD-02), wird aber sofort auf den Brief-Tab umgeleitet (da Kontakte desktop-only ist). Der User sieht also nur den Brief-Generator — der Name "Kontakte" ist irrefuehrend.

### Aenderungen

| Datei | Aenderung |
|-------|-----------|
| `src/config/mobileHomeConfig.ts` | Eintrag von `tile: 'kontakte', label: 'Kontakte', icon: 'Users'` aendern zu `tile: 'brief', label: 'Briefe', icon: 'FileText'` |

Das ist eine einzige Zeilen-Aenderung. Der Eintrag zeigt dann direkt auf den Brief-Tab und traegt den korrekten Namen "Briefe" mit einem passenden Icon.

