/**
 * AcquiaryObjekt — Lead-Capture: Objekt anbieten
 */
import * as React from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function AcquiaryObjekt() {
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      source: 'acquiary_objekt',
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      object_type: formData.get('object_type'),
      location: formData.get('location'),
      message: formData.get('message'),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-lead-capture`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // silent fail for now
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <>
        <section className="aq-hero" style={{ padding: '6rem 1.5rem 7rem' }}>
          <div className="aq-hero-content">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16" style={{ color: 'hsl(207 90% 54%)' }} />
            </div>
            <h1 className="aq-hero-title">Vielen Dank.</h1>
            <p className="aq-hero-subtitle">
              Ihre Anfrage ist bei uns eingegangen. Wir melden uns 
              innerhalb von 48 Stunden vertraulich bei Ihnen.
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="aq-hero" style={{ padding: '5rem 1.5rem 4rem' }}>
        <div className="aq-hero-content">
          <span className="aq-hero-eyebrow">Lead-Capture</span>
          <h1 className="aq-hero-title">Objekt anbieten</h1>
          <p className="aq-hero-subtitle">
            Reichen Sie Ihr Objekt vertraulich ein. NDA-geschützt, 
            kostenfrei und unverbindlich.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="aq-section" style={{ paddingTop: '3rem' }}>
        <form onSubmit={handleSubmit} className="aq-form-card">
          <div className="space-y-5">
            <div className="aq-grid-2">
              <div>
                <label className="aq-label">Name *</label>
                <input name="name" required className="aq-input" placeholder="Max Mustermann" />
              </div>
              <div>
                <label className="aq-label">E-Mail *</label>
                <input name="email" type="email" required className="aq-input" placeholder="max@beispiel.de" />
              </div>
            </div>
            <div className="aq-grid-2">
              <div>
                <label className="aq-label">Telefon</label>
                <input name="phone" className="aq-input" placeholder="+49 ..." />
              </div>
              <div>
                <label className="aq-label">Unternehmen</label>
                <input name="company" className="aq-input" placeholder="Firma GmbH" />
              </div>
            </div>
            <div className="aq-grid-2">
              <div>
                <label className="aq-label">Objektart</label>
                <select name="object_type" className="aq-input">
                  <option value="">Bitte wählen</option>
                  <option value="mfh">Mehrfamilienhaus</option>
                  <option value="gewerbe">Gewerbeobjekt</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="grundstueck">Grundstück</option>
                  <option value="sonstiges">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="aq-label">Standort</label>
                <input name="location" className="aq-input" placeholder="Stadt / PLZ" />
              </div>
            </div>
            <div>
              <label className="aq-label">Nachricht</label>
              <textarea
                name="message"
                className="aq-textarea"
                placeholder="Beschreiben Sie das Objekt kurz — Größe, Zustand, Preisvorstellung ..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="aq-btn aq-btn-primary w-full"
            >
              {loading ? 'Wird gesendet...' : (
                <>
                  Vertraulich einreichen
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-center" style={{ fontSize: '0.8125rem', color: 'hsl(220 8% 58%)' }}>
              Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
            </p>
          </div>
        </form>
      </section>
    </>
  );
}
