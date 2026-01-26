-- =========================================================
-- System Templates für MSV (Kündigung, Mieterhöhung, etc.)
-- =========================================================

INSERT INTO msv_templates (tenant_id, template_code, title, content, placeholders, locale, version, is_active)
VALUES 
  -- Kündigung
  (NULL, 'KUENDIGUNG', 'Kündigungsschreiben', 
   E'{{mieter_name}}\n{{adresse}}\n\n\nKündigung des Mietvertrages\n\nSehr geehrte(r) {{mieter_name}},\n\nhiermit kündigen wir das Mietverhältnis über die Wohnung in {{adresse}} ordentlich zum {{kuendigungsdatum}}.\n\nBegründung:\n{{begruendung}}\n\nBitte bestätigen Sie den Erhalt dieses Schreibens und vereinbaren Sie einen Termin zur Wohnungsübergabe.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "kuendigungsdatum", "begruendung"]'::jsonb,
   'de', 1, true),

  -- Mieterhöhung
  (NULL, 'MIETERHOEHUNG', 'Mieterhöhungsschreiben',
   E'{{mieter_name}}\n{{adresse}}\n\n\nMitteilung über Mieterhöhung\n\nSehr geehrte(r) {{mieter_name}},\n\nhiermit teilen wir Ihnen mit, dass wir die Miete für die Wohnung in {{adresse}} ab dem {{erhoehungsdatum}} anpassen.\n\nAktuelle Kaltmiete: {{alte_miete}} €\nNeue Kaltmiete: {{neue_miete}} €\n\nBegründung:\n{{begruendung}}\n\nWir bitten um Ihr Verständnis für diese Anpassung.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "alte_miete", "neue_miete", "erhoehungsdatum", "begruendung"]'::jsonb,
   'de', 1, true),

  -- Datenanforderung
  (NULL, 'DATENANFORDERUNG', 'Datenanforderung',
   E'{{mieter_name}}\n{{adresse}}\n\n\nAnforderung von Unterlagen\n\nSehr geehrte(r) {{mieter_name}},\n\nfür unsere Unterlagen benötigen wir folgende Dokumente von Ihnen:\n\n{{dokumente_liste}}\n\nBitte senden Sie uns die genannten Unterlagen bis zum {{frist}} zu.\n\nVielen Dank für Ihre Mithilfe.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "dokumente_liste", "frist"]'::jsonb,
   'de', 1, true),

  -- Zahlungserinnerung (Mahnung Stufe 1)
  (NULL, 'MAHNUNG', 'Zahlungserinnerung',
   E'{{mieter_name}}\n{{adresse}}\n\n\nZahlungserinnerung\n\nSehr geehrte(r) {{mieter_name}},\n\nleider konnten wir bis heute keinen Eingang Ihrer Mietzahlung für den Monat {{monat}} feststellen.\n\nOffener Betrag: {{offener_betrag}} €\nFällig seit: {{faellig_seit}}\n\nWir bitten Sie, den offenen Betrag innerhalb der nächsten 7 Tage zu überweisen.\n\nSollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, bitten wir Sie, dieses zu ignorieren.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "monat", "offener_betrag", "faellig_seit"]'::jsonb,
   'de', 1, true),

  -- Erste Mahnung (Stufe 2)
  (NULL, 'MAHNUNG_2', 'Erste Mahnung',
   E'{{mieter_name}}\n{{adresse}}\n\n\n1. Mahnung\n\nSehr geehrte(r) {{mieter_name}},\n\ntrotz unserer Zahlungserinnerung vom {{letzte_mahnung_datum}} ist die Miete für {{monat}} weiterhin offen.\n\nOffener Betrag: {{offener_betrag}} €\n\nWir fordern Sie hiermit auf, den Betrag unverzüglich, spätestens jedoch innerhalb von 7 Tagen zu begleichen.\n\nBitte beachten Sie, dass bei weiterem Zahlungsverzug weitere Maßnahmen eingeleitet werden.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "monat", "offener_betrag", "letzte_mahnung_datum"]'::jsonb,
   'de', 1, true),

  -- Letzte Mahnung (Stufe 3)
  (NULL, 'MAHNUNG_3', 'Letzte Mahnung',
   E'{{mieter_name}}\n{{adresse}}\n\n\nLetzte Mahnung vor gerichtlichen Schritten\n\nSehr geehrte(r) {{mieter_name}},\n\ntrotz mehrfacher Aufforderungen ist Ihre Miete weiterhin unbezahlt.\n\nGesamtforderung: {{offener_betrag}} €\nVerzugszinsen: {{verzugszinsen}} €\n\nDies ist unsere letzte Mahnung. Sollte der Gesamtbetrag nicht innerhalb von 5 Werktagen auf unserem Konto eingegangen sein, werden wir ohne weitere Ankündigung rechtliche Schritte einleiten.\n\nMit freundlichen Grüßen',
   '["mieter_name", "adresse", "offener_betrag", "verzugszinsen"]'::jsonb,
   'de', 1, true)

ON CONFLICT DO NOTHING;