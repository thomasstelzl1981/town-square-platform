
# Umbenennung der Area-Tabs

Einfache Label-Anpassung in `src/manifests/areaConfig.ts`:

| Area Key | Vorher | Nachher |
|----------|--------|---------|
| missions | Mission | Client |
| operations | Partner | Manager |
| base | Base | Base (bleibt) |
| services | Service | Service (bleibt) |

## Technische Umsetzung

**Datei:** `src/manifests/areaConfig.ts`

- Zeile 26-27: `label` und `labelShort` von `'Mission'` auf `'Client'` aendern
- Zeile 33-34: `label` und `labelShort` von `'Partner'` auf `'Manager'` aendern

Keine weiteren Dateien betroffen — die `AreaTabs`-Komponente liest die Labels dynamisch aus `areaConfig`.
