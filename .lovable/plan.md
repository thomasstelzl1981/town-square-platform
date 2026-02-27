

## Analyse: Fremde E-Mail-Konten nach User-Wechsel sichtbar

### Root Cause

**React Query Cache wird beim Logout/User-Wechsel nicht geleert.**

Die RLS-Policies auf `mail_accounts` sind korrekt — sie beschränken per `user_id = auth.uid()`. Das Problem ist rein clientseitig:

```text
1. Thomas Stelzl loggt sich ein → mail_accounts Query lädt sein Konto
2. Query wird unter Key ['email-accounts'] gecacht (KEIN user_id im Key!)
3. Thomas loggt aus → QueryClient wird NICHT geleert
4. Bernhard Marchner loggt sich ein
5. React Query liefert den Cache-Hit für ['email-accounts']
6. Bernhard sieht Thomas' E-Mail-Konto aus dem Stale Cache
```

**Zwei Fehler:**
- `queryKey: ['email-accounts']` enthält keine User-ID → Cache wird User-übergreifend geteilt
- `signOut()` in AuthContext ruft kein `queryClient.clear()` auf

### Fix (2 Teile)

**1. QueryClient beim Logout leeren** — `src/contexts/AuthContext.tsx`:
- `useQueryClient()` importieren
- In `signOut()`: `queryClient.clear()` aufrufen bevor `supabase.auth.signOut()` ausgeführt wird

**2. User-spezifische Query Keys** — in `EmailTab.tsx` und `AccountIntegrationDialog.tsx`:
- `queryKey: ['email-accounts']` → `queryKey: ['email-accounts', user?.id]`
- Sicherstellt, dass selbst ohne Cache-Clear keine Verwechslung möglich ist

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/contexts/AuthContext.tsx` | `queryClient.clear()` bei signOut |
| `src/pages/portal/office/EmailTab.tsx` | User-ID in queryKey |
| `src/components/portal/office/AccountIntegrationDialog.tsx` | User-ID in queryKey |

