

## ManagerVisitenkarte — Korrekturplan

### 3 Probleme identifiziert

**1. Bild wird nicht angezeigt (kritisch)**
`profile.avatar_url` enthält einen Storage-Pfad (`406f5f7a.../avatars/avatar_xxx.jpeg`), KEINE URL. Die Komponente setzt diesen Pfad direkt als `<img src>` — das Bild kann so nie geladen werden. ProfilTab loest das korrekt ueber `getSignedUrl()` / `getCachedSignedUrl()`.

**2. Bild viel zu klein**
96x96px in einer Karte mit `min-h-[280px]` — das Bild nutzt weniger als 35% der verfuegbaren Hoehe. Laut Plan soll es die **volle Kartenhoehe** ausfuellen.

**3. Layout entspricht nicht dem genehmigten Entwurf**
Das Foto soll als hohe Kachel links stehen (volle Kartenhoehe), nicht als kleines Quadrat.

### Loesung

**Datei:** `src/components/shared/ManagerVisitenkarte.tsx`

| # | Aenderung |
|---|-----------|
| 1 | `useEffect` + `getCachedSignedUrl()` aus `@/lib/imageCache` einbauen, um `profile.avatar_url` (Storage-Pfad) in eine signierte URL aufzuloesen |
| 2 | Avatar-Container auf `w-32 self-stretch rounded-xl` aendern — nimmt die volle Kartenhoehe ein, feste Breite 128px |
| 3 | `<img>` auf `w-full h-full object-cover rounded-xl` — fuellt den Container komplett |
| 4 | Fallback (kein Bild): Gradient-Hintergrund + zentriertes User-Icon beibehalten |

### Soll-Layout (ASCII)

```text
┌──────────────────────────────────────────────┐
│ ██████████ gradient bar ██████████████████████│
│                                              │
│  ┌─────────┐  Max Mustermann           [✏]  │
│  │         │  FINANZIERUNGSMANAGER           │
│  │         │                                 │
│  │  FOTO   │  ✉ max@example.de              │
│  │ (voll-  │  📞 +49 170 1234567            │
│  │ flaech- │  📍 München, 80331             │
│  │   ig)   │                                 │
│  │         │  [Badge 1] [Badge 2]           │
│  │  128px  │                                 │
│  │  breit  │  {children}                     │
│  │         │                                 │
│  └─────────┘                                 │
└──────────────────────────────────────────────┘
```

### Umsetzungsschritte

| # | Aktion |
|---|--------|
| 1 | `useState` fuer `resolvedAvatarUrl` + `useEffect` mit `getCachedSignedUrl(profile.avatar_url, 'tenant-documents')` |
| 2 | Avatar-Container: `w-32 self-stretch rounded-xl` (statt `h-24 w-24 self-center`) |
| 3 | `<img>`: `w-full h-full object-cover rounded-xl` (statt `h-24 w-24`) |
| 4 | Fallback-Icon auf `h-10 w-10` vergroessern |
| 5 | Alle 5 Manager-Module erben automatisch |

