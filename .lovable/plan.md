

## E-Mail-Client Reparaturplan

### Analyse der Probleme

**Problem 1: Scrollen funktioniert nicht**
Die Hoehen-Kette ist unterbrochen. `PageShell` ist ein frei fliessender Container ohne Hoehenbegrenzung. Der `h-[calc(100vh-220px)]` Wert auf dem Grid ist eine "Magic Number", die nicht zur tatsaechlichen Hoehe der umgebenden Elemente (ChipBar, ModulePageHeader, Padding) passt. Dadurch ragt der E-Mail-Body ueber den sichtbaren Bereich hinaus, ohne dass ein Scrollbalken erscheint.

**Problem 2: HTML-E-Mails sprengen das Layout**
E-Mails mit `body_html` werden via `dangerouslySetInnerHTML` in einem `prose`-Container gerendert. HTML-Mails enthalten haeufig:
- Tabellen mit festen Breiten (z.B. 600px)
- Bilder ohne `max-width`
- Inline-Styles mit `position: absolute` oder `overflow: visible`
- Verschachtelte `<div>`-Strukturen, die aus dem ScrollArea-Container ausbrechen

**Problem 3: Zeichensatz-Fehler (Mojibake)**
Text wie "SchÃ¶nen" statt "Schoenen" deutet darauf hin, dass der E-Mail-Body als Latin-1/ISO-8859-1 kodiert ist, aber als UTF-8 interpretiert wird. Die Edge Function `sot-mail-fetch-body` dekodiert den Body vermutlich nicht charset-aware.

### Loesung

#### Teil 1: Hoehen-Kette reparieren (EmailTab.tsx)

Die `PageShell` ist fuer E-Mail ungeeignet, da sie keine Hoehenbegrenzung bietet. Der E-Mail-Client braucht einen eigenen vollhoehe-Container.

Aenderungen an `EmailTab.tsx`:
- `PageShell` durch einen eigenen Container ersetzen, der `h-[calc(100vh-var(--header-height,4rem))]` und `flex flex-col overflow-hidden` nutzt
- Die `ModulePageHeader` bleibt, wird aber `shrink-0`
- Die Card bekommt `flex-1 min-h-0 overflow-hidden` statt dem statischen `h-[calc(100vh-220px)]`
- Das Grid bekommt `h-full` statt der Magic Number

#### Teil 2: HTML-E-Mail-Rendering absichern (EmailDetailPanel)

Der `body_html`-Container braucht eine Sandbox:

```
<div className="prose prose-sm max-w-none 
  [&_table]:!table-fixed [&_table]:!w-full [&_table]:!max-w-full
  [&_img]:!max-w-full [&_img]:!h-auto
  [&_*]:!max-width-full
  overflow-x-auto">
```

Zusaetzlich wird der HTML-Body in einem `iframe` mit `sandbox`-Attribut gerendert statt via `dangerouslySetInnerHTML`. Das loest:
- Layout-Ausbrechungen (iframe ist eine eigene Rendering-Grenze)
- CSS-Konflikte zwischen E-Mail-Styles und App-Styles
- Sicherheitsprobleme (XSS)

Der iframe nutzt `srcdoc` mit einem Wrapper, der `<meta charset="utf-8">` und `<style>body { font-family: sans-serif; overflow-wrap: break-word; }</style>` einschliesst.

#### Teil 3: Charset-Handling in der Edge Function (sot-mail-fetch-body)

Die Edge Function wird erweitert, um den `charset` aus dem E-Mail-Header (`Content-Type: text/html; charset=iso-8859-1`) korrekt auszuwerten und den Body in UTF-8 umzuwandeln, bevor er in die DB geschrieben wird.

### Technische Aenderungen

| Nr | Datei | Beschreibung |
|----|-------|-------------|
| 1 | `src/pages/portal/office/EmailTab.tsx` | PageShell entfernen, eigenen Fullheight-Container. Grid-Hoehe von Magic Number auf `h-full`. EmailDetailPanel-Body in einen sandboxed iframe umstellen statt `dangerouslySetInnerHTML`. CSS-Overrides fuer `prose` entfernen (nicht mehr noetig mit iframe). |
| 2 | `supabase/functions/sot-mail-fetch-body/index.ts` | Charset-Detection aus Content-Type Header. TextDecoder mit korrektem Encoding nutzen. Fallback: Latin-1 zu UTF-8 Konvertierung wenn Mojibake-Pattern erkannt wird. |

### Detail: Neuer EmailDetailPanel Body-Bereich

```text
Vorher:
  <ScrollArea className="flex-1 p-4">
    <div className="prose" dangerouslySetInnerHTML={{ __html: body_html }} />
  </ScrollArea>

Nachher:
  <div className="flex-1 min-h-0 overflow-hidden p-4">
    <iframe
      sandbox="allow-same-origin"
      srcDoc={`<!DOCTYPE html><html><head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, sans-serif; font-size: 14px;
                 margin: 0; padding: 0; overflow-wrap: break-word;
                 word-break: break-word; }
          img { max-width: 100%; height: auto; }
          table { max-width: 100%; }
          * { max-width: 100% !important; box-sizing: border-box; }
        </style>
      </head><body>${sanitizedHtml}</body></html>`}
      className="w-full h-full border-0"
      title="E-Mail-Inhalt"
    />
  </div>
```

### Detail: Neuer Fullheight-Container

```text
Vorher:
  <PageShell>
    <ModulePageHeader ... />
    <Card className="glass-card overflow-hidden">
      <div className="grid ... h-[calc(100vh-220px)]">

Nachher:
  <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden px-2 py-3 md:px-6 md:py-4">
    <ModulePageHeader ... className="shrink-0" />
    <Card className="glass-card flex-1 min-h-0 overflow-hidden mt-4">
      <div className="grid ... h-full">
```

### Risikobewertung

- **Niedrig**: Die Aenderungen betreffen nur das Layout und Rendering der EmailTab. Keine Datenbank-Aenderungen.
- **iframe**: Sicherer als `dangerouslySetInnerHTML`, kein XSS-Risiko, keine CSS-Leaks.
- **Charset-Fix**: Nur in der Edge Function, bestehende korrekt kodierte Mails bleiben unberuehrt.

