
-- Insert FM Vorstellungs-Template for FutureRoom finance notifications
INSERT INTO public.admin_email_templates (
  name,
  subject,
  body_html,
  body_text,
  category,
  is_active,
  variables
) VALUES (
  'FM Vorstellung',
  'Ihr Finanzierungsmanager stellt sich vor — {{public_id}}',
  '<p>Guten Tag {{customer_name}},</p>
<p>mein Name ist <strong>{{manager_name}}</strong>, ich bin Ihr zugewiesener Finanzierungsmanager für Ihren Antrag <strong>{{public_id}}</strong>.</p>
<p><strong>Meine Kontaktdaten:</strong><br/>
Telefon: {{manager_phone}}<br/>
E-Mail: {{manager_email}}<br/>
{{manager_company}}</p>
<p>Ich melde mich umgehend bei Ihnen, sobald ich Ihre Anfrage prüfen konnte. Melden Sie sich gerne jederzeit bei mir!</p>
<p>Mit freundlichen Grüßen,<br/>{{manager_name}}</p>',
  'Guten Tag {{customer_name}},

mein Name ist {{manager_name}}, ich bin Ihr zugewiesener Finanzierungsmanager für Ihren Antrag {{public_id}}.

Meine Kontaktdaten:
Telefon: {{manager_phone}}
E-Mail: {{manager_email}}
{{manager_company}}

Ich melde mich umgehend bei Ihnen, sobald ich Ihre Anfrage prüfen konnte. Melden Sie sich gerne jederzeit bei mir!

Mit freundlichen Grüßen,
{{manager_name}}',
  'finance',
  true,
  '["customer_name", "manager_name", "manager_phone", "manager_email", "manager_company", "public_id"]'::jsonb
);
