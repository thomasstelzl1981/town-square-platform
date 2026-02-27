

## Zone 2 & Zone 3 — KI-Ausbau-Audit: Wo können wir mehr bieten?

### Analyse-Ergebnis

Ich habe alle Module in Zone 2 (Portal) und alle 5 Websites in Zone 3 systematisch geprüft. Hier sind die konkreten Stellen, wo wir mehr KI, mehr Unterstützung und mehr "Wow" liefern können:

---

### ZONE 3 — Öffentliche Websites

**1. Acquiary & Lennox: Kein Armstrong-Widget (kritisch)**

| Website | Armstrong | Status |
|---------|-----------|--------|
| SoT | ✅ ArmstrongWidget | Live |
| Kaufy | ✅ KaufyArmstrongWidget | Live |
| FutureRoom | ✅ ArmstrongWidget | Live |
| **Acquiary** | ❌ Fehlt komplett | Kein Lead-Capture-Assistent |
| **Lennox** | ❌ Fehlt komplett | Kein Buchungs-Assistent |

→ **Fix**: `ArmstrongWidget` in `AcquiaryLayout.tsx` und `LennoxLayout.tsx` einbauen mit spezialisierten Kontexten (`website="acquiary"` für Investment-Qualifizierung, `website="lennox"` für Tier-Buchungsassistenz).

**2. Kaufy Home: Keine KI-Kommunikation**
Die Kaufy-Seite zeigt Investmentobjekte mit Renditeberechnung, erwähnt aber nirgends die KI-Power dahinter. Kein Hinweis auf automatische Renditeberechnung, KI-gestützte Standortanalyse, oder Gemini 2.5 Pro.

→ **Fix**: KI-Badge-Sektion unter dem Hero ("Powered by Gemini 2.5 Pro — Rendite in Sekunden berechnet") + Sektion "Unsere KI analysiert für Sie" mit konkreten Capabilities.

**3. FutureRoom Home: KI oberflächlich erwähnt**
FutureRoom nennt "KI-gestützte Aufbereitung" als Feature, aber keine konkreten Modelle, keine Zahlen, kein "Wow". Die Seite wirkt generisch.

→ **Fix**: Konkrete Modell-Badges (Gemini 2.5 Pro für Dokumentanalyse), KI-Leistungssektion mit Zahlen (z.B. "Selbstauskunft in 2 Minuten automatisch befüllt", "400+ Bankpartner KI-vorselektiert").

**4. Acquiary Methodik: KI-Engine zu allgemein**
Die Seite nennt eine "KI-Analyse-Engine" und "Automatisierte Datenextraktion", aber keine konkreten Modelle, keine Token-Zahlen, kein Differenzierungsmerkmal.

→ **Fix**: Modell-Badges + konkrete Zahlen ("32.000 Token Context — liest komplette Datenräume", "Gemini 2.5 Pro für Multi-Dokument-Analyse").

**5. Lennox: Kein KI-Feature sichtbar**
Die Tierservice-Plattform hat null KI-Features auf der Website. Keine intelligente Suche, keine Empfehlungen, keine smarte Buchung.

→ **Fix**: "Smarte Partnersuche" Sektion mit KI-gestütztem Matching (Standort + Services + Bewertungen), intelligente Empfehlungen basierend auf Tierart/Rasse.

---

### ZONE 2 — Portal-Module

**6. Dashboard: Armstrong könnte proaktiver sein**
Armstrong grüßt auf dem Dashboard, aber bietet keine proaktiven Insights. Kein "Heute fällig", kein "3 Dokumente warten auf Analyse", kein KI-Briefing.

→ **Fix**: `ArmstrongGreetingCard` um ein "KI-Tagesbriefing" erweitern: offene Tasks, Dokumente zur Analyse, Marktveränderungen, anstehende Termine — automatisch generiert.

**7. MOD-17 (Cars/Fuhrpark): Null KI-Integration**
Reines CRUD für Fahrzeuge, Boote, Privatjets. Keine Wertberechnung, keine TCO-Analyse, keine KI-gestützte Fahrzeugbewertung.

→ **Fix**: "KI-Fahrzeugbewertung" Button pro Fahrzeug (Schwacke-Style Schätzung via Armstrong), TCO-Prognose mit Wartungskosten, Versicherungsvergleich-Assist.

**8. MOD-15 (Fortbildung): Keine personalisierte KI-Empfehlung**
Reiner Such-Hub für Bücher/Kurse. Keine KI-basierte "Für Sie empfohlen" Funktion.

→ **Fix**: Armstrong-gestützte Empfehlungen basierend auf Benutzerrolle und aktuellen Projekten ("Als Immobilienverwalter empfehle ich: WEG-Recht Update 2026").

**9. MOD-16 (Services/Shops): Keine smarte Bestellung**
Amazon Business, Büroshop24 — reine iFrame/Link-Integration. Keine KI-gestützte Bedarfsermittlung.

→ **Fix**: "Armstrong Bestellvorschlag" — basierend auf Bürogröße, Teamgröße und letzten Bestellungen automatisch eine Nachbestellliste generieren.

**10. MOD-19 (Photovoltaik): Keine KI-Ertragsoptimierung**
Anlagen werden verwaltet, aber keine KI-gestützte Ertragsprognose, kein Anomalie-Detection, kein "Ihre Anlage performt 12% unter Soll".

→ **Fix**: KI-Ertragsanalyse via Armstrong ("Anlage München-Süd: Ertrag letzte 30 Tage 8% unter Prognose — mögliche Ursache: Verschattung"). PV-Performance-Widget auf Dashboard.

**11. MOD-20 (Miety/Zuhause): Upload hat SmartDropZone, aber kein KI-Insight**
Der Upload funktioniert jetzt ChatGPT-Style, aber nach dem Upload passiert nichts Intelligentes mit dem Dokument.

→ **Fix**: Nach Upload automatisch Armstrong-Zusammenfassung des Dokuments ("Mietvertrag erkannt: Kaltmiete 850€, Kündigungsfrist 3 Monate, nächste Erhöhung möglich ab 01.2027").

**12. MOD-06 (Verkauf): Keine KI-Preisempfehlung**
Objekte werden zum Verkauf eingestellt, aber keine KI-gestützte Preisempfehlung basierend auf Marktdaten.

→ **Fix**: "KI-Preiseinschätzung" Button pro Objekt — Armstrong analysiert Lage, Zustand, Vergleichsobjekte und empfiehlt einen Angebotspreis.

**13. MOD-10 (Lead Manager): Kein KI-Scoring sichtbar**
Leads kommen rein, aber kein sichtbares KI-Scoring, keine Priorisierung, keine automatische Qualifizierung.

→ **Fix**: KI-Lead-Score (Hot/Warm/Cold) basierend auf Profildaten, Interaktionshistorie und Kaufwahrscheinlichkeit. Armstrong kann Antwort-Entwürfe für Top-Leads generieren.

---

### Zusammengefasste Implementierungsschritte

| # | Aktion | Zone | Aufwand |
|---|--------|------|---------|
| 1 | Armstrong-Widget in Acquiary + Lennox einbauen | Z3 | Klein |
| 2 | KI-Power-Badges auf Kaufy, FutureRoom, Acquiary | Z3 | Klein |
| 3 | Lennox: KI-Partnersuche Sektion | Z3 | Mittel |
| 4 | Dashboard: KI-Tagesbriefing in Armstrong Greeting | Z2 | Mittel |
| 5 | MOD-17: KI-Fahrzeugbewertung | Z2 | Mittel |
| 6 | MOD-15: KI-Empfehlungen | Z2 | Klein |
| 7 | MOD-19: KI-Ertragsanalyse | Z2 | Mittel |
| 8 | MOD-20: Auto-Dokumentanalyse nach Upload | Z2 | Klein |
| 9 | MOD-06: KI-Preisempfehlung | Z2 | Mittel |
| 10 | MOD-10: KI-Lead-Scoring | Z2 | Mittel |

### Betroffene Dateien (Freeze-Check nötig vor Implementierung)

| Datei | Modul |
|-------|-------|
| `src/pages/zone3/acquiary/AcquiaryLayout.tsx` | Zone3-Acquiary |
| `src/pages/zone3/lennox/LennoxLayout.tsx` | Zone3-Lennox |
| `src/pages/zone3/kaufy2026/Kaufy2026Home.tsx` | Zone3-Kaufy |
| `src/pages/zone3/futureroom/FutureRoomHome.tsx` | Zone3-FutureRoom |
| `src/pages/zone3/acquiary/AcquiaryMethodik.tsx` | Zone3-Acquiary |
| `src/components/dashboard/ArmstrongGreetingCard.tsx` | MOD-00 |
| Diverse Modul-Seiten | MOD-06/10/15/16/17/19/20 |

### Empfohlene Reihenfolge

**Sofort (Quick Wins):** Punkte 1-2 (Armstrong auf alle Z3-Websites + KI-Badges) — maximaler Effekt, minimaler Aufwand.

**Danach:** Punkt 4 (Dashboard KI-Briefing) + Punkt 8 (Miety Auto-Analyse) — zeigt die KI-Power direkt im täglichen Workflow.

**Dann:** Die größeren Features (Fahrzeugbewertung, Ertragsanalyse, Lead-Scoring) — jeweils mit Armstrong-Integration.

