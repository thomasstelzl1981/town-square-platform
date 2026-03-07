

# Plan: Armstrong Workspace — Schrift vergrößern + Kontrast verbessern

## Freeze-Status
MOD-00 wurde im aktuellen Gespräch bereits unfreezed.

## Analyse: Aktuell vs. Benchmark

| Eigenschaft | Armstrong (aktuell) | ChatGPT Dark | Gemini Dark |
|-------------|-------------------|--------------|-------------|
| Nachrichtentext | `text-sm` (~15.5px via Tailwind-Override) + `prose-sm` | ~16px (1rem) | ~16px (1rem) |
| Textfarbe Assistant | `text-foreground/90` (90% Opacity) | Weiß ~95% | Weiß ~90% |
| Textfarbe User | inherit (voll weiß) | Weiß 100% | Weiß ~95% |
| Zeilenabstand | prose-sm default (~1.4) | ~1.7 | ~1.65 |
| Bubble-Padding | `px-3 py-2` (12px/8px) | ~16px/12px | ~16px/12px |
| Max-Breite | `max-w-[85%]` | ~680px | ~680px |

**Problem**: Der Text ist ~1px zu klein, der Zeilenabstand zu eng, und das Bubble-Padding zu knapp. In langen Sessions entsteht dadurch Augenermüdung.

## Geplante Änderungen

### 1. MessageRenderer.tsx — Schriftgröße + Spacing anheben

**User-Message (Zeile 83)**:
- `text-sm` → `text-base` (~17.5px)
- `px-3 py-2` → `px-4 py-2.5`

**Assistant-Message (Zeile 119)**:
- `text-sm` → `text-base`
- `px-3 py-2` → `px-4 py-2.5`
- `prose prose-sm` → `prose prose-base` (größere Paragraphen, Headers, Listen)
- `text-foreground/90` → `text-foreground/95` (leicht mehr Kontrast)

**DraftBox / EmailDraftBox** (Zeile 207, 276, 280):
- Ebenfalls `prose-sm` → `prose-base`

### 2. WorkspaceChatMessages.tsx — Empty State + Loading

- Zeile 61: `text-lg` → `text-xl` für Headline
- Zeile 62: `text-sm` → `text-base` für Subline

### 3. index.css — Prose-Overrides (optional)

Kein CSS-Override nötig — die Tailwind `prose-base` Klasse liefert bereits:
- Font-size: 1rem (16px Basis, mit unserem Override ~17.5px)
- Line-height: 1.75 (deutlich mehr Luft als prose-sm's 1.4)
- Paragraph-Spacing: 1.25em

### 4. Nicht im Scope
- Header-Styling (bereits angepasst)
- Composer/Input-Feld (separates Thema)
- Chip-Bar Schriftgröße

| Datei | Aktion |
|-------|--------|
| `src/components/chat/MessageRenderer.tsx` | text-sm → text-base, prose-sm → prose-base, Padding erhöhen, Kontrast auf /95 |
| `src/components/dashboard/workspace/WorkspaceChatMessages.tsx` | Empty-State Schrift vergrößern |

