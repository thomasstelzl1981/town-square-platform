

## Armstrong auf SoT- und FutureRoom-Website aktivieren

### Ist-Zustand

- **Kaufy**: Hat ein eigenes `KaufyArmstrongWidget` (Orb + Chat, Streaming, Voice) -- voll funktional
- **SoT**: Kein Armstrong-Widget im Layout (`SotLayout.tsx`)
- **FutureRoom**: Kein Armstrong-Widget im Layout (`FutureRoomLayout.tsx`)
- **Generisches Widget**: `src/components/zone3/ArmstrongWidget.tsx` existiert bereits mit Brand-Konfiguration fuer `sot` und `futureroom` (Greeting, Quick Actions, API-Anbindung)

### Loesung

Das generische `ArmstrongWidget` wird in beide Layouts eingebunden. Es bietet:
- Floating Chat-Bubble (unten rechts)
- Klick oeffnet Chat-Panel (350x450px)
- Brand-spezifische Begruessungstexte und Quick Actions
- API-Anbindung an `sot-armstrong-advisor` im Zone-3-Modus

### Aenderungen

| Nr | Datei | Beschreibung |
|----|-------|-------------|
| 1 | `src/pages/zone3/sot/SotLayout.tsx` | Import `ArmstrongWidget` und Einbindung vor dem schliessenden `</div>` des Hauptcontainers, mit `website="sot"` |
| 2 | `src/pages/zone3/futureroom/FutureRoomLayout.tsx` | Import `ArmstrongWidget` und Einbindung vor dem schliessenden `</div>` des Hauptcontainers, mit `website="futureroom"` |

### Detail

**SotLayout.tsx** -- nach `<SotFooter />` und vor dem schliessenden Container-`</div>`:
```text
<ArmstrongWidget website="sot" />
```

**FutureRoomLayout.tsx** -- nach dem Footer-Block und vor dem schliessenden `</div>`:
```text
<ArmstrongWidget website="futureroom" />
```

Keine weiteren Dateien betroffen. Das generische Widget ist bereits vollstaendig implementiert und braucht keine Anpassung.
