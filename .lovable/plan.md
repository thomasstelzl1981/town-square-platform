

# Otto² Advisory & Ncore online bringen

## Status

Beide Websites sind **code-seitig fertig** — Routing, Layout, Seiten, Domain-Mapping (`domainMap.ts`), und Lead-Edge-Functions sind implementiert. Die Seiten sind bereits über die Preview erreichbar unter `/website/otto-advisory` und `/website/ncore`.

Um sie unter ihren eigenen Domains live zu bekommen, sind **drei Schritte** nötig:

## Schritt 1: Custom Domains in Lovable verbinden

In **Project Settings → Domains** müssen folgende Domains hinzugefügt werden:

**Otto² Advisory:**
- `otto2advisory.com` (Primary)
- `www.otto2advisory.com`
- Optional: `finanzdienstleistungen.gmbh`, `zl-beratung.de`, `zl-finanzen.de` + jeweilige www-Varianten

**Ncore:**
- `ncore.online` (Primary)
- `www.ncore.online`
- Optional: `thomasstelzl.com`, `thomas-stelzl.com`, `thomasstelzl.de` + jeweilige www-Varianten

## Schritt 2: DNS bei IONOS konfigurieren

Für jede Domain bei IONOS:

```text
Typ    Name    Wert
A      @       185.158.133.1
A      www     185.158.133.1
TXT    _lovable   lovable_verify=<wird von Lovable angezeigt>
```

Die TXT-Verify-Werte werden dir angezeigt, nachdem du die Domains in Schritt 1 hinzugefügt hast.

## Schritt 3: Projekt publizieren

Nach DNS-Propagation (bis zu 72h, meist schneller) den **Publish**-Button klicken, damit die Frontend-Änderungen (Redesign) live gehen.

## Was ich hier tun kann

Da Custom Domains über die **Project Settings UI** konfiguriert werden müssen (nicht per Code), kann ich das nicht automatisch machen. Aber ich kann dir den Weg zeigen:

**Desktop:** Klick auf den Projektnamen oben links → Settings → Domains → Connect Domain

Dort trägst du nacheinander die Domains ein. Lovable zeigt dir dann die DNS-Records an, die du bei IONOS setzen musst.

## Was bereits funktioniert (kein Code-Aufwand)

- Domain-Router in `domainMap.ts` ist konfiguriert
- Routing in `routesManifest.ts` ist konfiguriert
- Alle Seiten (Home, Kontakt, Impressum, Datenschutz, etc.) sind implementiert
- Lead-Edge-Functions (`sot-ncore-lead-submit`, `sot-futureroom-public-submit`) sind deployed
- PIN-Gate ist aktiv (Code 2710) — kann bei Bedarf deaktiviert werden

