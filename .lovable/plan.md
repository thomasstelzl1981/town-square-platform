

## Visitenkarte: Provider-Seed-Daten anzeigen

### Problem

Die `ManagerVisitenkarte` zeigt Name, E-Mail, Telefon und Adresse ausschliesslich aus dem Auth-Profil (`useAuth().profile`). Die in der Datenbank hinterlegten Provider-Daten (Lennox & Friends Dog Resorts, Rathausstr. 12, Ottobrunn, etc.) erscheinen nur als kleines Badge unten — nicht in den Kontaktzeilen der Karte.

### Loesung

Die `ManagerVisitenkarte` bekommt optionale Override-Props fuer die Kontaktfelder. Wenn gesetzt, haben diese Vorrang vor den Auth-Profil-Daten. So kann der Pet Manager die Provider-Daten durchreichen, waehrend andere Module weiterhin das Auth-Profil verwenden.

### Technische Umsetzung

**1. `src/components/shared/ManagerVisitenkarte.tsx`**

Neue optionale Props im Interface:

```typescript
interface ManagerVisitenkarteProps {
  // ... bestehende Props
  overrideName?: string;
  overrideEmail?: string;
  overridePhone?: string;
  overrideAddress?: string;
}
```

In der Render-Logik ersetzen die Overrides die Auth-Profil-Werte:

```typescript
const displayName = overrideName || fullName;
const displayEmail = overrideEmail || profile?.email;
const displayPhone = overridePhone || profile?.phone_mobile;
const displayAddress = overrideAddress || fullAddress;
```

**2. `src/pages/portal/petmanager/PMDashboard.tsx`**

Die Provider-Daten werden als Overrides an die Visitenkarte durchgereicht:

```tsx
<ManagerVisitenkarte
  role="Inhaberin"
  gradientFrom="hsl(170,60%,40%)"
  gradientTo="hsl(180,55%,35%)"
  badgeText={provider.company_name || 'Lennox & Friends Dog Resorts'}
  extraBadge={FACILITY_LABELS[(provider as any).facility_type] || 'Tierpension'}
  overrideName={provider.company_name}
  overrideEmail={provider.email}
  overridePhone={provider.phone}
  overrideAddress={provider.address}
/>
```

### Dateien

| Datei | Aktion |
|-------|--------|
| `src/components/shared/ManagerVisitenkarte.tsx` | EDIT — 4 optionale Override-Props hinzufuegen |
| `src/pages/portal/petmanager/PMDashboard.tsx` | EDIT — Provider-Daten als Overrides durchreichen |

### Ergebnis

Die Visitenkarte zeigt:
- **Name**: Lennox & Friends Dog Resorts
- **Rolle**: Inhaberin
- **E-Mail**: info@lennoxandfriends.com
- **Telefon**: +49 176 64 12 68 69
- **Adresse**: Rathausstr. 12, 85521 Ottobrunn
- **Badges**: Lennox & Friends Dog Resorts + Tierpension
