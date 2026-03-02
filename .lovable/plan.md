

## P0 Security Fixes — Direkt-Implementation

### 1. `sanitizeHtml.ts` erstellen (XSS-Schutz)
- Neue Datei `src/lib/sanitizeHtml.ts` — DOMPurify-Wrapper mit strikter Tag/Attr-Allowlist
- Bereits als Dependency installiert (`dompurify` + `@types/dompurify`)

### 2. XSS: `dangerouslySetInnerHTML` absichern (7 Stellen)
Alle Stellen mit `dangerouslySetInnerHTML` durch `sanitizeHtml()` wrappen:
- `MessageRenderer.tsx`
- `ConversationView.tsx`
- `SourceEmailViewer.tsx`
- `InboundTab.tsx`
- `OutreachTab.tsx`
- `FutureRoomTemplates.tsx` (2×)
- `AdminKiOfficeTemplates.tsx`

### 3. Bearer Token Fix (6 Dateien)
Ersetze `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}` durch `session.access_token`:
- `ScopeDefinitionPanel.tsx` (3 Aufrufe)
- `MarketReportSheet.tsx`
- `useArmstrongVoice.ts`
- `ArmstrongWidget.tsx`
- `KaufyArmstrongWidget.tsx`
- `AcquiaryObjekt.tsx`

Pattern (Zone 2 — immer authentifiziert):
```ts
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) throw new Error('Not authenticated');
headers: {
  Authorization: `Bearer ${session.access_token}`,
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
}
```

### 4. Kein Risiko durch späteren Sync
Die Änderungen sind identisch zu dem, was der GitHub-Agent committed hat. Falls der Sync doch noch durchkommt, gibt es keinen Konflikt.

### Umfang
~15 Dateien, reine Security-Fixes, keine funktionalen Änderungen.

