

# Analyse: Zone 2 zeigt Brand-Assistent statt persoenlichen Assistenten

## Kernproblem

Die Abfrage in `usePhoneAssistant.ts` (Zeile 88-91) filtert nur nach `user_id`:

```
.eq('user_id', user.id)
.maybeSingle()
```

Thomas Stelzl (`d028bc99-...`) ist als `user_id` sowohl auf dem **Acquiary Brand-Assistenten** (Zeile 1 in der DB, `brand_key: 'acquiary'`, Nummer `+498941432188`) als auch auf keinem persoenlichen Assistenten eingetragen. Da `maybeSingle()` den ersten Treffer liefert, zeigt Zone 2 den Brand-Assistenten mit Nummer an — obwohl dieser zu Zone 1 gehoert.

## Datenbank-Beweis

| Assistant | brand_key | user_id | tenant_id | Nummer | Zweck |
|-----------|-----------|---------|-----------|--------|-------|
| Acquiary | `acquiary` | `d028bc99` | `a000...001` | +498941432188 | Zone 1 Brand |
| Bernies | NULL | `6c108ec9` | `80746f1a` | NULL | Zone 2 User |

## Fix

In `usePhoneAssistant.ts` muss die Query um `.is('brand_key', null)` ergaenzt werden, damit nur persoenliche Assistenten (ohne Brand) geladen werden:

```typescript
// Zeile 88-91: Filter auf persoenliche Assistenten
.eq('user_id', user.id)
.is('brand_key', null)    // <-- NEU: nur User-Assistenten
.maybeSingle();
```

Gleiches gilt fuer den Auto-Create-Fall: Das Insert braucht keine Aenderung, da `brand_key` bereits NULL ist per Default.

## Auswirkung

- Thomas sieht dann keinen Assistenten mit Nummer mehr (korrekt — er hat keinen persoenlichen)
- Auto-Create legt ihm einen neuen persoenlichen an
- Brand-Assistenten bleiben ueber Zone 1 verwaltbar
- Bernies Golden Tenant bleibt unberuehrt (war schon korrekt)

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/usePhoneAssistant.ts` | Zeile 90: `.is('brand_key', null)` einfuegen |

