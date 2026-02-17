

## Pet Manager Pension -- Vertikales Widget-Layout mit 10 Zimmern

### Konzept

Die Widgets werden **nicht** wie bei CarsFahrzeuge in einem 4-Spalten-Grid horizontal angeordnet, sondern **vertikal links** als Seitenleiste. Klick auf ein Widget oeffnet die Akte inline rechts daneben.

### Layout-Skizze

```text
┌──────────────────────────────────────────────────────────────────────┐
│  PENSION                                              [+] (rund)    │
│  Zimmerverwaltung und Belegungskalender                             │
├──────────────┬───────────────────────────────────────────────────────┤
│              │                                                      │
│  ┌────────┐  │   ZIMMERAKTE: Zimmer 3                         [X]   │
│  │Zimmer 1│  │   ─────────────────────────────────────────────────  │
│  │2/3 🐕  │  │   Name:      [Zimmer 3          ]                   │
│  │[amber] │  │   Raumtyp:   [Zimmer ▾]                             │
│  └────────┘  │   Kapazitaet: [1]                                    │
│  ┌────────┐  │   Beschreibung: [Einzelzimmer fuer ...]              │
│  │Zimmer 2│  │   Aktiv:     [✓]                                     │
│  │0/2 🐕  │  │                                                      │
│  │[green] │  │   ─── Aktuelle Belegung ──────────────────────────   │
│  └────────┘  │   🐕 Bello    [Check-Out]                            │
│  ┌────────┐  │                                                      │
│  │Zimmer 3│◄─│   [Speichern]  [Loeschen]                            │
│  │1/1 🐕  │  │                                                      │
│  │ [red]  │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 4│  │                                                      │
│  │0/4 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 5│  │                                                      │
│  │0/2 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 6│  │                                                      │
│  │1/3 🐕  │  │                                                      │
│  │[amber] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 7│  │                                                      │
│  │0/1 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 8│  │                                                      │
│  │0/2 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimmer 9│  │                                                      │
│  │0/2 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│  ┌────────┐  │                                                      │
│  │Zimm. 10│  │                                                      │
│  │0/3 🐕  │  │                                                      │
│  │[green] │  │                                                      │
│  └────────┘  │                                                      │
│              │                                                      │
├──────────────┴───────────────────────────────────────────────────────┤
│  BELEGUNGSKALENDER (volle Breite, darunter)                         │
│  ... wie bisher ...                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

### Prinzip

- **Links:** Scrollbare Spalte (ca. w-64) mit quadratischen Zimmer-Widgets untereinander
- **Rechts:** Inline-Akte des ausgewaehlten Zimmers (flex-1), kein Dialog/Popup
- **Darunter:** Belegungskalender ueber volle Breite
- **Plus-Button:** Im `ModulePageHeader` rechts oben (variant="glass", size="icon-round")
- **Kein "+"-Kachel** mehr im Grid

### Gleicher Ansatz fuer Mitarbeiter

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MITARBEITER                                          [+] (rund)    │
│  Teammitglieder und Dienstleistungszuordnung                        │
├──────────────┬───────────────────────────────────────────────────────┤
│  ┌────────┐  │   MITARBEITERAKTE: Anna Mueller                [X]   │
│  │Anna M. │  │   ────────────────────────────────────────────────   │
│  │Salon   │  │   Name:      [Anna Mueller       ]                   │
│  │3 Termi.│  │   Rolle:     [Hundefriseur ▾]                        │
│  └────────┘  │   E-Mail:    [anna@example.de    ]                   │
│  ┌────────┐  │   Telefon:   [0171 1234567       ]                   │
│  │Max K.  │  │   Aktiv:     [✓]                                     │
│  │Gassi   │  │                                                      │
│  │5 Termi.│  │   ─── Dienstleistungen ───────────────────────────   │
│  └────────┘  │   [Gassi] [Hundesalon✓] [Training] [Tagesstaette]    │
│  ┌────────┐  │                                                      │
│  │Lisa S. │  │   [Speichern]  [Loeschen]                            │
│  │Betreuun│  │                                                      │
│  │2 Termi.│  │                                                      │
│  └────────┘  │                                                      │
├──────────────┴───────────────────────────────────────────────────────┤
```

### Technische Umsetzung

| Datei | Aenderung |
|-------|-----------|
| `PMPension.tsx` | Kompletter Umbau: horizontales Grid -> vertikale linke Spalte + rechte Inline-Akte. Dialog entfernen. ModulePageHeader mit Plus-Button. |
| `PMPersonal.tsx` | Gleicher Umbau: vertikale Widgets links, Inline-Akte rechts. Dialog entfernen. ModulePageHeader mit Plus-Button. |

### Widget-Design (einzelne Kachel)

Jedes Widget bleibt quadratisch (aspect-square) und zeigt:

**Zimmer-Widget:**
- Farbiger Top-Balken (gruen/amber/rot je nach Belegung)
- Raumtyp-Icon + Name
- Belegung als Badge (z.B. "2/3 🐕")
- Raumtyp-Label

**Mitarbeiter-Widget:**
- Farbiger Top-Balken (primary fuer aktiv, muted fuer inaktiv)
- Name (fett)
- Rolle (klein)
- Service-Badges (max 3)

### Inline-Akte Felder

**Zimmerakte:**
| Feld | Typ |
|------|-----|
| Name | Input |
| Raumtyp | Select (Zimmer/Auslauf/Box) |
| Kapazitaet | Number Input |
| Beschreibung | Textarea |
| Aktiv | Switch |
| Aktuelle Belegung | Liste mit Check-Out-Buttons |

**Mitarbeiterakte:**
| Feld | Typ |
|------|-----|
| Name | Input |
| Rolle | Select |
| E-Mail | Input |
| Telefon | Input |
| Aktiv | Switch |
| Dienstleistungen | Badge-Auswahl (toggle) |

### Mobile-Verhalten

Auf Mobile stapelt sich das Layout vertikal: Widgets oben als horizontale Scroll-Reihe, Akte darunter. Die linke Spalte wird nur auf Desktop (md+) als feste Seitenleiste angezeigt.

