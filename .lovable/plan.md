

## KB-Abfrage in Armstrong auf Volltext-Relevanzsuche umstellen

### Was wird geaendert

Eine einzige Stelle in `supabase/functions/sot-armstrong-advisor/index.ts`, Zeilen 2846-2855 — die KB-Abfrage in der Funktion `generateExplainResponse`.

Die anderen KB-Abfragen (Explain-Action ~3044, Legacy-Persona ~3124) bleiben unberuehrt.

### Ist-Zustand (Zeilen 2846-2855)

```text
if (needsKB) {
  const { data: kbItems } = await supabase
    .from("armstrong_knowledge_items")
    .select("title_de, summary_de")
    .eq("status", "published")
    .limit(4);
  if (kbItems?.length) {
    kbContext = kbItems.map(k => `- ${k.title_de}: ${k.summary_de || ''}`).join('\n');
  }
}
```

**Probleme:**
- Laedt immer die gleichen 4 Artikel (keine Relevanz zur Frage)
- Nur `title_de` und `summary_de` — kein Volltext (`content`)
- Kein Modul-Bezug

### Soll-Zustand

1. **Search-Term extrahieren** aus der User-Message (erste 3-4 Woerter, Sonderzeichen entfernt, Stoppwoerter gefiltert)
2. **Relevanzbasierte Suche** via `ilike` auf `title_de`, `summary_de`, `content` mit LIMIT 3
3. **Fallback** nach Modul-Kategorie wenn keine Treffer
4. **Volltext** (`content`) statt nur Summary in den Prompt einbinden

### Modul-zu-Kategorie-Mapping

| Modul | Kategorie |
|-------|-----------|
| MOD-04, MOD-08 | `real_estate` |
| MOD-07, MOD-11, MOD-18 | `finance` |
| MOD-12 | `sales` |
| Default | `system` |

### Technische Umsetzung

**Datei:** `supabase/functions/sot-armstrong-advisor/index.ts`

**Aenderung 1:** Neue Hilfsfunktion `extractSearchTerms` (vor `generateExplainResponse`, ca. Zeile 2825):

```typescript
function extractSearchTerms(message: string): string {
  const stopWords = new Set([
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'was', 'wie', 'wo',
    'wann', 'warum', 'ist', 'sind', 'hat', 'haben', 'kann', 'mir',
    'mich', 'ein', 'eine', 'der', 'die', 'das', 'den', 'dem', 'und',
    'oder', 'aber', 'nicht', 'auch', 'noch', 'schon', 'bitte', 'mal',
    'the', 'a', 'an', 'is', 'are', 'can', 'you', 'me', 'my', 'this'
  ]);
  return message
    .replace(/[^a-zA-ZäöüÄÖÜß\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    .slice(0, 4)
    .join(' ');
}
```

**Aenderung 2:** Neue Hilfsfunktion `getModuleCategory` (direkt danach):

```typescript
function getModuleCategory(module: string): string {
  const map: Record<string, string> = {
    'MOD-04': 'real_estate', 'MOD-08': 'real_estate',
    'MOD-07': 'finance', 'MOD-11': 'finance', 'MOD-18': 'finance',
    'MOD-12': 'sales',
  };
  return map[module] || 'system';
}
```

**Aenderung 3:** KB-Abfrage ersetzen (Zeilen 2846-2855):

```typescript
if (needsKB) {
  const searchTerm = extractSearchTerms(message);
  let kbItems: Array<{ title_de: string; summary_de: string | null; content: string | null; category: string | null; item_code: string | null }> = [];

  if (searchTerm.length > 0) {
    const searchPatterns = searchTerm.split(' ').filter(Boolean);
    const orFilter = searchPatterns.map(term =>
      `title_de.ilike.%${term}%,summary_de.ilike.%${term}%,content.ilike.%${term}%`
    ).join(',');

    const { data } = await supabase
      .from("armstrong_knowledge_items")
      .select("title_de, summary_de, content, category, item_code")
      .eq("status", "published")
      .or(orFilter)
      .limit(3);
    kbItems = data || [];
  }

  // Fallback: Top-Artikel der Modul-Kategorie
  if (kbItems.length === 0) {
    const category = getModuleCategory(body?.module || '');
    const { data } = await supabase
      .from("armstrong_knowledge_items")
      .select("title_de, summary_de, content, category, item_code")
      .eq("status", "published")
      .eq("category", category)
      .limit(3);
    kbItems = data || [];
  }

  if (kbItems.length > 0) {
    kbContext = kbItems.map(k =>
      `## ${k.title_de}${k.item_code ? ` [${k.item_code}]` : ''}\n${k.content || k.summary_de || ''}`
    ).join('\n\n---\n\n');
  }
}
```

### Risikobewertung

- **Niedrig**: Nur eine Abfragestelle wird geaendert, kein Schema-Change
- **Token-Verbrauch**: `content`-Felder koennen laenger sein als Summaries. Durch LIMIT 3 (statt 4) und die Relevanzsuche wird aber nur passender Content geladen
- **Fallback**: Wenn keine Treffer gefunden werden, greift die Kategorie-basierte Suche — Armstrong ist nie ohne Kontext
- **`body?.module`**: Im Fallback-Pfad wird `body` genutzt, das als optionaler Parameter verfuegbar ist — Null-Safe durch `|| ''` und Default-Kategorie `system`

### Keine weiteren Aenderungen

- Explain-Action (Zeile ~3044): bleibt unveraendert
- Legacy-Persona (Zeile ~3124): bleibt unveraendert
- Keine Datenbank-Aenderungen noetig
- Keine Frontend-Aenderungen noetig

