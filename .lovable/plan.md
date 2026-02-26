

## Plan: E-Mail-Assistent — ABGESCHLOSSEN ✅

### Implementierte Teile

**Teil 1: Advisor COMPOSE_EMAIL + SEND_COMPOSED_EMAIL** ✅
- `executeAction` Switch: COMPOSE_EMAIL generiert AI-Draft (To, Subject, HTML Body) via Lovable AI Gateway
- SEND_COMPOSED_EMAIL sendet bestätigten Entwurf via sot-system-mail-send (service-role)
- Kontakt-Lookup per Name im Instruction-Text
- Spezielle DRAFT-Response für COMPOSE_EMAIL (statt RESULT)

**Teil 2: Frontend Verdrahtung** ✅
- `useArmstrongAdvisor.ts`: `sendEmail(draft)` Funktion hinzugefügt
- `ChatPanel.tsx`: `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben
- `ArmstrongContainer.tsx`: `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben
- `MobileHomeChatView.tsx`: `onSendEmail={advisor.sendEmail}` an MessageRenderer übergeben

**Teil 3: Armstrong-Adresse + Inbound** ✅ (vorherige Session)
- DB: `profiles.armstrong_email` + `generate_armstrong_email()` + Trigger
- Inbound: `sot-inbound-receive` erkennt `@neilarmstrong.space` → `armstrong_inbound_tasks`
- UI: Profil zeigt Armstrong-Adresse an

**Teil 4: Task-Processor** ✅
- Neue Edge Function `sot-armstrong-task-processor`
- Liest pending Tasks → ruft Advisor auf → speichert Ergebnis → sendet Antwort-E-Mail
- Deployed mit `verify_jwt = false` (Cron/Webhook-Aufruf)

### Verbleibend
- DNS-Verifizierung für `neilarmstrong.space` bei Resend (User-Aktion)
- Optional: Cron-Job einrichten für automatische Task-Verarbeitung
