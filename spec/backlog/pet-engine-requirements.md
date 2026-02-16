# Pet Engine — Backlog & Anforderungen

> **Status**: Backlog (nicht implementiert)  
> **Datum**: 2026-02-16  
> **Zuständig**: Zone 1 Governance

---

## 1. Zone-1-Orchestrierung für Buchungen

- Buchungen dürfen **NICHT** direkt zwischen Zone-2-Tenants geschrieben werden
- Jede Buchungsanfrage muss über Zone 1 (Pet Governance Desk) laufen
- Zone 1 validiert: Provider aktiv, Service aktiv, Slot verfügbar, Tier existiert
- Workflow: `requested → confirmed → in_progress → completed | cancelled | no_show`

## 2. PLZ-basierte Provider-Zuordnung

- Provider registrieren sich mit `service_area_postal_codes` (Array)
- Zone 1 steuert die Sichtbarkeit: nur verifizierte Provider erscheinen in der Suche
- Suchlogik: PLZ-Prefix-Match (z.B. "10" → alle PLZ die mit 10 beginnen)
- Später: Radius-basierte Suche über Geocoding

## 3. Verfügbarkeits-Abgleich

- `pet_provider_availability` definiert wöchentliche Zeitfenster (day_of_week, start/end, max_bookings)
- `pet_provider_blocked_dates` blockt einzelne Tage
- Vor Bestätigung: Prüfung ob `max_bookings` für den Slot nicht überschritten
- Aktuell: Nur visuelle Darstellung, keine Buchungszählung

## 4. Cross-Tenant-Isolation

- Anbieter = eigener Tenant (org_type: client)
- Kunde = eigener Tenant (org_type: client)
- Kein direkter Datenzugriff zwischen Tenants
- Zone 1 erstellt die Verbindung via `pet_bookings` mit beiden tenant_ids
- RLS-Policies müssen Cross-Tenant-Leserechte für Buchungen ermöglichen

## 5. Provider-Verifizierung

- Neue Provider starten mit `status: pending`
- Zone 1 prüft und setzt auf `active` (+ `verified_at`)
- Nur `active` Provider erscheinen in der Kundensuche
- Suspension/Deaktivierung jederzeit durch Zone 1

## 6. Cover-Bild-Upload

- `pet_providers.cover_image_url` ist vorbereitet
- Upload über Supabase Storage (Bucket: `pet-provider-images`)
- Provider können ihr Titelbild im MOD-22 (Pet Manager) hochladen

## 7. Welpenspielstunde

- Neuer `pet_service_category`-Enum-Wert: `puppy_class` ✅ (bereits migriert)
- Altersbeschränkung: nur Tiere unter 12 Monaten (Engine-Validierung)
- Gruppen-Buchungen möglich (max_bookings pro Slot)

## 8. Bewertungssystem

- Nach `completed`-Buchung: Kunde kann Provider bewerten (1-5 Sterne + Text)
- `rating_avg` wird automatisch aktualisiert (Trigger oder Aggregation)
- Bewertungen sind öffentlich sichtbar in der Suche

## 9. Benachrichtigungen

- Zone 1 sendet Benachrichtigungen bei Statusänderungen
- Provider: neue Anfrage, Stornierung
- Kunde: Bestätigung, Ablehnung, Erinnerung (24h vorher)

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-02-16 | Initial Backlog erstellt |
