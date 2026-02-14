

# Sortierkacheln fuer alle Demo-Akten — UMGESETZT

## Was wurde gemacht

### 1. SPEC-Datei aktualisiert
- `CONTRACT_EMAIL_INBOUND.md`: Eine einzige Inbound-Adresse pro Account, keine aktenspezifischen E-Mail-Adressen, Zuordnung über Sortierregeln

### 2. SQL-Migration: 5 Demo-Sortierkacheln angelegt
| Kachel | Entity | Keywords |
|--------|--------|----------|
| Schadowstr., Berlin | property | Schadowstr, Berlin, BER-01 |
| Leopoldstr., München | property | Leopoldstr, München, MUC-01 |
| Osterstr., Hamburg | property | Osterstr, Hamburg, HH-01 |
| Porsche 911 (B-P911) | vehicle | Porsche, 911, B-P911 |
| BMW M5 (M-M5005) | vehicle | BMW, M5, M-M5005 |

### 3. Sortierkachel-Klick-Flow (SortierenTab.tsx)
- Klick auf Kachel-Body öffnet Detail-Sheet (rechts)
- Zeigt: Status, Sortierregeln als Badges, Dokument-Platzhalter
- Button "Im Datenraum öffnen" navigiert zum DMS Storage
- Button "Regeln bearbeiten" öffnet den bestehenden Edit-Dialog
- Action-Buttons (Bearbeiten/Kopieren/Löschen) per stopPropagation isoliert
