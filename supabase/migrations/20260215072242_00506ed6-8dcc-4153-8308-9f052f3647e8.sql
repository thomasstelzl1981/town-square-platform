
INSERT INTO armstrong_knowledge_items (item_code, title_de, summary_de, content, category, subcategory, content_type, scope, status, confidence, version) VALUES

('ARM_COACH_GUARDRAILS', 'ARM Coach: Globale Guardrails', 'Style-Regeln für den Investment Coach Modus',
 E'ARMSTRONG COACH-MODUS REGELN:\n- Max 1-2 Sätze pro Output (<= 220 Zeichen, ideal <= 140)\n- simulate_typing = true, typing_speed = slow\n- Keine Prozent-/Renditeversprechen, keine konkreten Zahlen, keine Steuerberatung\n- Keine Objekt-/Lageempfehlungen. Fokus: Prinzip + Struktur + Simulation\n- Ton: ruhig, empathisch, souverän, emotional (nicht aggressiv)\n- Bei User-Frage: Slide-Coach pausiert, beantwortet kurz, dann weiter\n- Wiederholte Slides: statt Wiederholung nur "Kurz-Reminder …"\n- Leitmotiv: "Prinzip erklären, nicht drücken."\n- Conversion-Ziel: "Simulation starten" (low friction)',
 'system', 'coach', 'playbook', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_ENGINE_INTRO', 'ARM Coach: Investment Engine Einführung', 'Rahmen-Erklärung für die Investment Engine',
 E'Die Investment Engine berechnet den persönlichen Investitionsrahmen basierend auf zVE, EK, Güterstand und Kirchensteuer.\nZwei Wege: 1. Marktplatz — direkt suchen. 2. Suchmandat — AkquiseManager sucht.\nCoach-Flow: Rahmen → Simulation → Weg wählen → Begleitung.',
 'system', 'coach', 'playbook', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_VERKAUF', 'ARM Coach: Verkaufspräsentation S1-S8', 'Coaching-Texte für 8 Slides Verkaufspräsentation',
 E'S1: "Heute geht''s ums Prinzip: Sachwert hat Substanz – Geldwert verliert Kaufkraft. Wir bauen Vermögen mit Struktur, nicht mit Hoffnung."\nS2: "Sparpläne hängen am freien Netto. Der Engpass ist selten Rendite – sondern die Sparfähigkeit."\nS3: "Bei Immobilien wirken drei Motoren: Miete, steuerliche Effekte und Fremdkapital. Du investierst nicht allein."\nS4: "Wir starten immer mit dem Rahmen: EK + Einkommen + Puffer. Die Investment Engine macht daraus eine klare Entscheidungsbasis."\nS5: "Dann wählst du den Weg: direkt im Marktplatz suchen oder ein Akquisemandat geben."\nS6: "Finanzierungsmanager begleiten den Ablauf: Unterlagen, Status, Kommunikation."\nS7: "Sicherheit entsteht durch Ordnung: Dokumente im DMS, klare Schritte, klare Zustände."\nS8: "Wenn du willst: Starte jetzt die Simulation. Danach weißt du deinen Investitionsrahmen – ohne Druck, nur Klarheit."',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_RENDITE', 'ARM Coach: Rendite S1-S7', 'Coaching-Texte für 7 Slides Rendite',
 E'S1: "Rendite ist hier kein Prozent-Spiel. Entscheidend ist die Vermögenswirkung über Zeit."\nS2: "Beim Sparplan wächst nur, was du selbst einzahlst. Bei Immobilien wirkt zusätzlich ein Zahlungsstrom von außen."\nS3: "Hebel heißt: Mit wenig EK kontrollierst du einen größeren Sachwert."\nS4: "Zeit ist der Verstärker: Struktur wirkt über Jahre."\nS5: "Unsere Engine zeigt dir Varianten: Belastung, Puffer, Szenarien."\nS6: "Der wichtigste Renditefaktor ist Stabilität. Puffer und saubere Unterlagen verhindern Probleme."\nS7: "Wenn du willst, berechnen wir deinen Rahmen jetzt direkt in der Simulation."',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_STEUER', 'ARM Coach: Steuervorteil S1-S6', 'Coaching-Texte für 6 Slides Steuervorteil',
 E'S1: "Steuern sind hier kein Trick. Es ist Systemlogik: bestimmte Kosten und Abschreibungen können die Liquidität beeinflussen."\nS2: "Typisch relevant: AfA, Zinsen und Bewirtschaftung."\nS3: "Denk in Liquidität: Mehr Spielraum bedeutet mehr Stabilität."\nS4: "In der Engine kannst du dein Einkommen und Szenarien einbeziehen."\nS5: "Ordnung ist hier Gold: Dokumente sauber im DMS."\nS6: "Wenn du willst: Starte die Simulation. Danach hast du Klarheit."',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_VERWALTUNG', 'ARM Coach: Verwaltung S1-S7', 'Coaching-Texte für 7 Slides Verwaltung/Software',
 E'S1: "Der Kauf ist der Anfang. Ob Vermögen wächst, entscheidet die Verwaltung."\nS2: "Portfolio heißt: Überblick über Objekte, Zahlen, Dokumente."\nS3: "Für Vermietung zählt Alltag: Mieteingänge, Kommunikation, Vorgänge."\nS4: "Dokumente sind das Rückgrat: Im DMS sauber abgelegt und auffindbar."\nS5: "Finanzierung bleibt sichtbar: Rate, Restschuld, Status."\nS6: "KI hilft beim Sortieren und Erinnern: Status, Aufgaben, nächste Schritte."\nS7: "Wenn du willst, starten wir professionell: kostenlos testen oder direkt Simulation."',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_OBJECTION_DEBT', 'ARM Coach: Einwandbehandlung Schulden', 'Coaching-Antwort bei Schulden-Bedenken',
 E'Verständlich. Wichtig: Es geht nicht um "Schulden", sondern um kontrollierten Vermögensaufbau mit Puffer und klarer Belastungsgrenze.',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_OBJECTION_RISK', 'ARM Coach: Einwandbehandlung Risiko', 'Coaching-Antwort bei Risiko-Bedenken',
 E'Risiko ist meist fehlende Struktur. Darum rechnen wir zuerst Rahmen und Puffer – und entscheiden erst dann ruhig.',
 'sales', 'coach', 'script', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_MSV', 'ARM Coach: MSV Erklärung', 'Mietsonderverwaltung kurz erklärt',
 E'MSV ist der Alltag: Mieteingänge, Kommunikation, Vorgänge und Dokumente. Ziel: keine Zettelwirtschaft, klare Status, weniger Fehler.',
 'system', 'coach', 'faq', 'global', 'published', 'high', '1.0.0'),

('ARM_COACH_PLATTFORM', 'ARM Coach: Plattform-Features Überblick', 'Portfolio, DMS, Finanzierung, KI — was die Software kann',
 E'Portfolio: Überblick über Objekte, Zahlen, Dokumente. DMS: sauber abgelegt und auffindbar. Finanzierung: Rate, Restschuld, Status sichtbar. Investment Engine: Simulation, Marktplatz, Suchmandat. KI (Armstrong): Sortieren, Erinnern, Begleiten. MSV: Mietsonderverwaltung. Alles in einem System.',
 'system', 'coach', 'faq', 'global', 'published', 'high', '1.0.0');
