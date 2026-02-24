

# Aufräumen: Alte KaufyPinGate-Datei löschen

## Befund

Es gibt zwei PIN-Gate-Komponenten:

- `src/components/zone3/kaufy2026/KaufyPinGate.tsx` — ALTER Code mit PIN `4409`, wird **nirgends importiert**
- `src/components/zone3/WebsitePinGate.tsx` — AKTUELLER Code mit PIN `2710`, wird von allen 5 Brands verwendet (inkl. Kaufy)

Kaufy nutzt bereits die richtige Komponente (`WebsitePinGate` mit 2710). Die alte Datei ist toter Code.

## Aenderung

| Datei | Aktion |
|-------|--------|
| `src/components/zone3/kaufy2026/KaufyPinGate.tsx` | LOESCHEN (toter Code, wird nicht importiert) |

Keine weiteren Aenderungen noetig. Alle 5 Websites nutzen korrekt `WebsitePinGate` mit Code `2710`.

