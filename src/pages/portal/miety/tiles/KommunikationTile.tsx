import { useState } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DictationButton } from '@/components/shared/DictationButton';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import {
  MessageCircle, Users, Mail, Copy, Send, Languages, Phone,
} from 'lucide-react';

export default function KommunikationTile() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [translateInput, setTranslateInput] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [copied, setCopied] = useState(false);

  const handleWhatsAppSend = () => {
    if (!whatsappNumber) return;
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''}`;
    window.open(url, '_blank');
  };

  const handleEmailSend = () => {
    if (!emailAddress) return;
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translateResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    { code: 'en', label: 'Englisch' }, { code: 'tr', label: 'Türkisch' },
    { code: 'ar', label: 'Arabisch' }, { code: 'uk', label: 'Ukrainisch' },
    { code: 'ru', label: 'Russisch' }, { code: 'pl', label: 'Polnisch' },
    { code: 'fr', label: 'Französisch' },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Kommunikation" description="Kontakt zu deinem Vermieter" />
      {/* Vermieter-Kontaktdaten */}
      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Ihr Vermieter</h3>
              <p className="text-xs text-muted-foreground">Kontaktdaten Ihrer Hausverwaltung</p>
            </div>
            <Badge variant="outline" className="ml-auto text-xs text-green-600 border-green-300">Verbunden</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Name</p>
              <p className="text-sm font-medium">Müller Hausverwaltung GmbH</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">E-Mail</p>
              <p className="text-sm font-medium">info@mueller-hv.de</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Telefon</p>
              <p className="text-sm font-medium">+49 30 1234567</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kommunikationskanäle — 3 Kacheln */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        {/* WhatsApp */}
        <Card className="glass-card border-green-500/20">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-green-500/10"><Phone className="h-5 w-5 text-green-500" /></div>
              <div>
                <h3 className="font-medium text-sm">WhatsApp Business</h3>
                <p className="text-xs text-muted-foreground">Direktnachricht an Vermieter</p>
              </div>
            </div>
            <Input placeholder="Telefonnummer Vermieter" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="text-sm" />
            <div className="relative">
              <textarea placeholder="Nachricht eingeben..." value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setWhatsappMessage(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsAppSend}>
              <Send className="h-4 w-4 mr-1.5" />Nachricht senden
            </Button>
          </CardContent>
        </Card>

        {/* E-Mail */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="font-medium text-sm">E-Mail</h3>
                <p className="text-xs text-muted-foreground">E-Mail an Vermieter senden</p>
              </div>
            </div>
            <Input placeholder="E-Mail-Adresse Vermieter" type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} className="text-sm" />
            <Input placeholder="Betreff" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="text-sm" />
            <div className="relative">
              <textarea placeholder="Nachricht..." value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setEmailBody(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={handleEmailSend}>
              <Mail className="h-4 w-4 mr-1.5" />E-Mail senden
            </Button>
          </CardContent>
        </Card>

        {/* KI-Übersetzer */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-accent/30"><Languages className="h-5 w-5 text-primary" /></div>
              <div>
                <h3 className="font-medium text-sm">KI-Übersetzer</h3>
                <p className="text-xs text-muted-foreground">Text übersetzen & einfügen</p>
              </div>
            </div>
            <div className="relative">
              <textarea placeholder="Text eingeben (Deutsch)..." value={translateInput} onChange={(e) => setTranslateInput(e.target.value)}
                className="flex min-h-[120px] w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none" />
              <div className="absolute top-1 right-1">
                <DictationButton onTranscript={(text) => setTranslateInput(prev => prev + (prev ? ' ' : '') + text)} />
              </div>
            </div>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
              className="flex h-10 w-full rounded-xl border-0 bg-muted/60 dark:bg-muted/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Button size="sm" variant="outline" className="w-full" disabled>
              <Languages className="h-4 w-4 mr-1.5" />Übersetzen
            </Button>
            {translateResult && (
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <p>{translateResult}</p>
                <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={handleCopy}>
                  <Copy className="h-3 w-3 mr-1" />{copied ? 'Kopiert!' : 'Kopieren'}
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">KI-Übersetzung demnächst verfügbar</p>
          </CardContent>
        </Card>
      </div>

      {/* Vermieter verbinden — unten */}
      <Card className="glass-card border-dashed border-muted-foreground/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><Users className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Vermieter verbinden</p>
              <p className="text-xs text-muted-foreground">Einladungscode eingeben für gemeinsamen Datenraum</p>
            </div>
            <div className="flex gap-2 items-center">
              <Input placeholder="VM-ABC123" className="text-sm w-36" />
              <Button size="sm" variant="outline">Verbinden</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
