-- MOD-05 Migration: KI-Telefon-Assistent → Website Builder
UPDATE tile_catalog SET
  title = 'Website Builder',
  description = 'KI-gestützter Website-Baukasten — erstellen, gestalten und veröffentlichen Sie Ihre Unternehmenswebsite.',
  icon_key = 'globe',
  main_tile_route = '/portal/website-builder',
  sub_tiles = '[{"title":"Dashboard","route":"/portal/website-builder"}]'::jsonb,
  internal_apis = ARRAY['sot-website-ai-generate','sot-website-publish','sot-website-update-section'],
  external_api_refs = ARRAY[]::text[],
  flowchart_mermaid = 'graph TD
    A[Neue Website erstellen] --> B[Design-Template wählen]
    B --> C[KI generiert Sections]
    C --> D[Editor: Inhalte anpassen]
    D --> E[SEO konfigurieren]
    E --> F[Hosting-Vertrag abschließen]
    F --> G[Website veröffentlichen]'
WHERE tile_code = 'MOD-05';
