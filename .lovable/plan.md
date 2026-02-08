
# Bereinigung des doppelten Headers in der Immobilienakte

## Zusammenfassung

Die Immobilienakte zeigt redundante Informationen in zwei separaten Headern an:
1. **PropertyDetailPage Header** (Page-Level)
2. **DossierHeader** (Component-Level)

Die Lösung ist, den **Page-Level Header zu entfernen** und nur den DossierHeader zu behalten.

---

## Aktueller Zustand (Problem)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [←] DEMO-001 – Leipziger Straße 42                              │  ← PropertyDetailPage Header
│     [ETW]  04109 Leipzig                                        │
├─────────────────────────────────────────────────────────────────┤
│ [ Akte | Simulation | Exposé | Features | Mietverhältnis | ... ]│  ← Tab Navigation
├─────────────────────────────────────────────────────────────────┤
│ DEMO-001                                [Vermietet]             │  ← DossierHeader (DOPPELT!)
│ 📍 Leipziger Straße 42 • ECW 04109 Leipzig                      │
│──────────────────────────────────────────────────────────────── │
│ [Rest der Akte...]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Problem:** Die Information `DEMO-001`, `Leipziger Straße 42`, `04109 Leipzig` erscheint zweimal.

---

## Zielzustand (Bereinigt)

```text
┌─────────────────────────────────────────────────────────────────┐
│ [←] Immobilienakte: DEMO-001                                    │  ← Kompakter Back-Button
├─────────────────────────────────────────────────────────────────┤
│ [ Akte | Simulation | Exposé | Features | Mietverhältnis | ... ]│  ← Tab Navigation
├─────────────────────────────────────────────────────────────────┤
│ DEMO-001                                [Vermietet]             │  ← DossierHeader (EINZIGER)
│ 📍 Leipziger Straße 42 • ECW 04109 Leipzig     Stand: 08.02.26  │
│ ✓ Daten OK                                                      │
│──────────────────────────────────────────────────────────────── │
│ [Rest der Akte...]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technische Lösung

### Änderung in PropertyDetailPage.tsx

**Zeilen 274-295 ersetzen:**

Vorher:
```tsx
{/* Header */}
<div className="flex items-start justify-between mb-6">
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild className="no-print">
        <Link to="/portal/immobilien/portfolio">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <h2 className="text-2xl font-bold tracking-tight">
        {property.code ? `${property.code} – ` : ''}{property.address}
      </h2>
    </div>
    <div className="flex items-center gap-2 ml-10">
      <Badge variant="outline">{property.property_type}</Badge>
      <span className="text-muted-foreground">
        {property.postal_code} {property.city}
      </span>
    </div>
  </div>
</div>
```

Nachher:
```tsx
{/* Minimaler Header: Nur Back-Button */}
<div className="flex items-center gap-2 mb-4">
  <Button variant="ghost" size="sm" asChild className="no-print">
    <Link to="/portal/immobilien/portfolio">
      <ArrowLeft className="h-4 w-4" />
    </Link>
  </Button>
  <span className="text-sm text-muted-foreground">Zurück zur Übersicht</span>
</div>
```

---

## Warum diese Lösung?

| Aspekt | Begründung |
|--------|------------|
| **DossierHeader behalten** | Enthält mehr Infos (Status, Stand, Datenqualität) |
| **Page-Header entfernen** | Nur redundante Infos, keine Zusatzfunktion |
| **Back-Button behalten** | Navigationsfluss muss erhalten bleiben |
| **Tabs unverändert** | Funktionieren unabhängig vom Header |

---

## Alternative Überlegung: DossierHeader entfernen?

Wurde verworfen, weil:
- DossierHeader enthält **Status-Badge** (Vermietet/Leerstand)
- DossierHeader enthält **Stand-Datum** (asofDate)
- DossierHeader enthält **Datenqualitäts-Indikator** (OK/Prüfen)
- DossierHeader ist Teil des **SSOT-Dossier-Konzepts**

---

## Zu ändernde Datei

| Datei | Zeilen | Änderung |
|-------|--------|----------|
| `PropertyDetailPage.tsx` | 274-295 | Page-Header durch minimalen Back-Link ersetzen |

---

## Implementierungsschritte

1. PropertyDetailPage.tsx öffnen
2. Zeilen 274-295 (kompletter Header-Block) ersetzen
3. Nur Back-Button und "Zurück zur Übersicht" Text behalten
4. Testen, dass die Akte nun sauber ohne Dopplung aussieht

---

## Vorher/Nachher Vergleich

| Vorher | Nachher |
|--------|---------|
| 2x Objektcode | 1x Objektcode |
| 2x Adresse | 1x Adresse |
| 2x PLZ/Stadt | 1x PLZ/Stadt |
| ~80px Header-Höhe verschwendet | Sauberes, aufgeräumtes Layout |
