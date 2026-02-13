# FIRECRAWL_API_KEY — Secret-Dokumentation

> **Status:** ⚠️ NOCH NICHT HINTERLEGT  
> **Benötigt von:** Edge Function `sot-research-firecrawl-extract`  
> **Modul:** MOD-14 Communication Pro → Recherche  

---

## Was ist dieser Key?

Der **Firecrawl API Key** wird benötigt, um Web-Seiten (Impressum, Team-Seiten, etc.) zu crawlen und daraus Kontaktdaten zu extrahieren. Firecrawl ist der primäre Provider für die Web-Recherche-Funktion.

## Wo bekomme ich den Key?

1. Gehe zu [https://firecrawl.dev](https://firecrawl.dev)
2. Erstelle einen Account oder logge dich ein
3. Navigiere zu **Dashboard → API Keys**
4. Erstelle einen neuen API Key
5. Kopiere den Key (Format: `fc-...`)

## Wie hinterlegen?

Der Key muss als **Secret** im Lovable Cloud Backend hinterlegt werden:

- **Secret Name:** `FIRECRAWL_API_KEY`
- **Verwendung:** Wird in der Edge Function `sot-research-firecrawl-extract` über `Deno.env.get('FIRECRAWL_API_KEY')` gelesen

## Auswirkung wenn nicht gesetzt

- Die Firecrawl-Provider-Option in der Recherche-UI ist **sichtbar aber deaktiviert**
- Beim Versuch einen Auftrag mit Firecrawl zu starten, erscheint eine Fehlermeldung
- Andere Provider (Apollo, Epify) sind davon nicht betroffen

## Kosten

- Firecrawl berechnet pro gecrawlter Seite (siehe [firecrawl.dev/pricing](https://firecrawl.dev/pricing))
- Die Kosten werden in `research_billing_log` protokolliert
- Ein `cost_cap` pro Auftrag verhindert unkontrollierte Kosten
