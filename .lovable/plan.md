

## Befund: Serien-E-Mails — Zugriff eingeschraenkt

### Ursache

`SerienEmailsPage.tsx` (Zeilen 50-84) enthaelt einen **manuellen Rollen-Check**, der nur `sales_partner` und `platform_admin` durchlaesst. Der eingeloggte User hat die Rolle `super_user`, die hier nicht beruecksichtigt wird.

Gemaess der **Governance-Regel** (Memory: role-based-module-activation-standard) ist die Tile-Aktivierung die alleinige Quelle fuer Sichtbarkeit. Wer die Route erreicht, ist bereits systemisch validiert. Manuelle Rollen-Checks im UI-Code sind zu vermeiden.

### Aenderung

**`src/pages/portal/communication-pro/SerienEmailsPage.tsx`:**
- Zeilen 50-85 entfernen (gesamter `useQuery` fuer `hasSalesRole`, Loading-State und Zugriff-eingeschraenkt-Block)
- Import `ShieldAlert` entfernen
- Import `useAuth` und `supabase`-Query entfernen (sofern nicht anderweitig genutzt — `useAuth` wird nicht weiter referenziert nach Entfernung)

Ergebnis: Jeder Nutzer mit aktiviertem MOD-14 Tile kann die Serien-E-Mails nutzen — wie architektonisch vorgesehen.

### Freeze-Check

MOD-14 Pfad: `src/pages/portal/communication-pro/*` → nicht in modules_freeze.json aufgefuehrt als frozen. Kein Freeze aktiv.

