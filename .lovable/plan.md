

# Domain-Router fur Zone 3 Websites

## Ziel
Jede der 5 Custom Domains zeigt automatisch die richtige Zone-3-Website an, wahrend das Portal (Zone 1+2) weiterhin uber systemofatown.com erreichbar bleibt.

## Domain-Zuordnung

| Domain | Zone 3 Route | Rolle |
|--------|-------------|-------|
| systemofatown.com | `/website/sot` | Hauptdomain + Portal-Login |
| futureroom.online | `/website/futureroom` | Nur FutureRoom Website |
| acquiary.com | `/website/acquiary` | Nur Acquiary Website |
| kaufy.immo | `/website/kaufy` | Nur Kaufy Website |
| lennoxandfriends.app | `/website/tierservice` | Nur Lennox Website |

## Funktionsweise

Wenn ein Besucher z.B. `kaufy.immo` offnet, erkennt der Domain-Router den Hostnamen und zeigt automatisch die Kaufy-Website. Der Besucher sieht in der URL nur `kaufy.immo/vermieter` statt `kaufy.immo/website/kaufy/vermieter`.

Bei `systemofatown.com` wird die SoT-Website als Startseite gezeigt, aber `/portal` und `/admin` bleiben erreichbar (Login/Zone 2).

---

## Technischer Plan

### 1. Neue Config-Datei: `src/config/domainMap.ts`

Zentrale Zuordnung von Hostnamen zu Zone-3-Sites:

```typescript
export const domainMap: Record<string, { siteKey: string; base: string }> = {
  'kaufy.immo': { siteKey: 'kaufy', base: '/website/kaufy' },
  'www.kaufy.immo': { siteKey: 'kaufy', base: '/website/kaufy' },
  'futureroom.online': { siteKey: 'futureroom', base: '/website/futureroom' },
  'www.futureroom.online': { siteKey: 'futureroom', base: '/website/futureroom' },
  'acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  'www.acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  'lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  'www.lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  'systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
  'www.systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
};
```

### 2. Neuer Hook: `src/hooks/useDomainRouter.ts`

Erkennt den aktuellen Hostnamen und gibt zuruck, welche Zone-3-Site aktiv ist (oder `null` fur die Staging-Domain / Portal).

### 3. Anpassung: `src/router/ManifestRouter.tsx`

- Wenn eine Brand-Domain erkannt wird (z.B. `kaufy.immo`):
  - Root-Route `/` zeigt die Zone-3-Homepage statt Redirect zu `/portal`
  - Zone-3-Routen werden ZUSATZLICH ohne `/website/kaufy`-Prefix gemountet (d.h. `/vermieter` statt `/website/kaufy/vermieter`)
  - `/portal`, `/admin`, `/auth` bleiben funktional (fur Login-CTAs)
- Wenn keine Brand-Domain erkannt wird (Staging/systemofatown.com):
  - Verhalten bleibt wie bisher (Root -> Portal)

### 4. Anpassung: `src/App.tsx`

- Root-Route `/` wird dynamisch: Bei Brand-Domain -> Zone-3-Home, sonst -> `/portal`

### 5. Domains in Lovable einrichten

Nach dem Publish werden alle 5 Domains + www-Varianten in den Lovable Domain-Settings eingetragen. DNS bei IONOS:

Fur jede Domain:
- A-Record `@` -> `185.158.133.1`
- A-Record `www` -> `185.158.133.1`  
- TXT-Record `_lovable` -> Verifikationswert aus Lovable

### Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/config/domainMap.ts` | NEU - Domain-zu-Site Zuordnung |
| `src/hooks/useDomainRouter.ts` | NEU - Hostname-Erkennung |
| `src/App.tsx` | ANDERN - Root-Route dynamisch |
| `src/router/ManifestRouter.tsx` | ANDERN - Zusatzliche flache Routen bei Brand-Domain |

Keine Module werden verandert, keine Freeze-Checks betroffen.

