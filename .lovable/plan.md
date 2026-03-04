

## Plan: Kamera-Migration Golden Tenant → Privater Account + Formular-Check

### Analyse

**Bestehende Kamera im Golden Tenant:**
- ID: `96dcd30f-2414-458b-a3ac-97afb75781fc`
- Name: "Oberhaching"
- URL: `http://woo1vh3focn8wepf.myfritz.net:8080/cgi-bin/snapshot.cgi?channel=1`
- Auth: user=`admin`
- Tenant: `a0000000-0000-4000-a000-000000000001` (Golden Tenant)

**Dein privater Account:**
- User-ID: `b0d2bf55-887f-4678-878b-863af63c06b9`
- Tenant-ID: `66175861-db5b-4997-8a13-9994c17136b3`
- Email: thomas.stelzl@ncore.online

### Formular-Check

Der Code des `CameraInlineForm` sieht technisch korrekt aus:
- Alle Input-Felder haben `value` + `onChange` — sollten editierbar sein.
- Default-Name "Kamera 1" ist vorausgefuellt, aber ueberschreibbar.
- Snapshot-URL startet leer mit Placeholder.

**Moegliches Problem:** Das Formular zeigt nur 5 Felder (Name, URL, User, Pass, Refresh), aber `CameraFormData` hat 7 weitere Felder (`vendor`, `model`, `connection_type`, `local_ip`, `internal_port`, `external_domain`, `external_port`), die im `useCameras.addCamera` mit Defaults befuellt werden. Das ist kein Blocker, aber koennte bei bestimmten Kameras relevant sein.

**Wahrscheinlichste Ursache deines Problems:** Eventuell war die Kamera schon angelegt (im Edit-Modus) und die vorausgefuellte URL wurde nicht erkannt, oder ein Browser-Autofill hat das Feld ueberlagert.

### Schritt 1: DB-Migration (2 Queries)

**Query A — Kamera in deinen Tenant verschieben:**
```sql
UPDATE cameras
SET tenant_id = '66175861-db5b-4997-8a13-9994c17136b3',
    user_id = 'b0d2bf55-887f-4678-878b-863af63c06b9'
WHERE id = '96dcd30f-2414-458b-a3ac-97afb75781fc';
```

Das ist sauberer als Loeschen + Neu-Anlegen, weil die ID, Credentials und Config erhalten bleiben. Der Golden Tenant hat danach 0 Kameras.

### Schritt 2: Formular-Verbesserung (optional)

Falls gewuenscht, koennte ich das Formular um folgende Felder erweitern:
- Hersteller (Dropdown: Amcrest, Reolink, Sonstige)
- Lokale IP
- Externer Domain/Port

Das ist aber kein Blocker — die Kernfelder (Name, URL, Auth) reichen fuer den Betrieb.

### Zusammenfassung

- 1 SQL-Migration: Kamera vom Golden Tenant auf deinen privaten Tenant umziehen
- Kein Code-Change noetig fuer die Grundfunktion
- Formular ist technisch funktional — falls du das Problem reproduzieren kannst, kann ich gezielt debuggen

