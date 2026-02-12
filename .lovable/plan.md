

# Kapitaldienstfaehigkeit: Ueberschrift und Button-Verschiebung

## Aenderungen

### 1. Neue CI-konforme Ueberschrift ueber der Kachel

In `FMFinanzierungsakte.tsx` wird direkt ueber der `HouseholdCalculationCard` eine Section-Headline eingefuegt -- identisch zum bestehenden Muster:

```text
<div>
  <h2 className="text-2xl font-bold tracking-tight uppercase">Kapitaldienstfähigkeit</h2>
  <p className="text-sm text-muted-foreground mt-1">
    Simulation der monatlichen Einnahmen und Ausgaben nach Abschluss der neuen Finanzierung
  </p>
</div>
```

### 2. Button "Berechnen" nach oben rechts in die Kachel

In `HouseholdCalculationCard.tsx`:

- Der Button wird aus dem unteren Footer-Bereich (Zeilen 254-268) entfernt
- Stattdessen wird er in den Kachel-Header (Zeile 164-174) integriert, rechts neben dem Titel via `flex justify-between`
- Die Info-Hinweise (Eigennutzung / Vermietung) bleiben im Header oder werden direkt unter den Button gesetzt

Neuer Header-Aufbau:

```text
+--- glass-card ---------------------------------------------------------+
| [Calculator] HAUSHALTSRECHNUNG INKL. FINANZIERUNGSOBJEKT  [Berechnen]  |
| Simulation der monatl. Einnahmen/Ausgaben ...   (Info je Nutzungsart)  |
+------------------------------------------------------------------------+
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `FMFinanzierungsakte.tsx` | Section-Headline `Kapitaldienstfaehigkeit` ueber der Kachel einfuegen (Zeile 282) |
| `HouseholdCalculationCard.tsx` | Button aus Footer in Header verschieben, Footer-Block entfernen |

