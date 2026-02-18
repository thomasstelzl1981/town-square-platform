

# FinAPI Integration: Secrets hinterlegen und Edge Function bauen

## Schritt 1: Secrets abfragen

Zwei Secrets werden sicher im Backend hinterlegt:

| Secret | Beschreibung |
|--------|-------------|
| `FINAPI_CLIENT_ID` | Default Client-ID aus dem FinAPI Sandbox-Dashboard |
| `FINAPI_CLIENT_SECRET` | Default Client-Secret aus dem FinAPI Sandbox-Dashboard |

Nach Genehmigung dieses Plans wirst du aufgefordert, beide Werte einzugeben.

## Schritt 2: Edge Function `sot-finapi-sync` umbauen

Die bestehende Scaffold-Funktion wird mit echten FinAPI-API-Calls ersetzt:

- **Action `connect`**: OAuth2-Token holen, FinAPI-User pro Tenant anlegen, Bank-Import starten (Sandbox Test Bank 280001)
- **Action `sync`**: Transaktionen abrufen und in die Datenbank schreiben
- **Action `status`**: Verbindungsstatus aus DB lesen (bereits vorhanden)

## Schritt 3: Frontend — KontenTab erweitern

- "Bank verbinden"-Button im KontenTab
- Transaktions-Liste nach erfolgreichem Sync
- "Sync"-Button pro Verbindung

## Reihenfolge

1. Secrets eingeben (direkt nach Plan-Genehmigung)
2. Edge Function implementieren
3. Connectivity-Test gegen FinAPI Sandbox
4. Frontend-Anbindung

