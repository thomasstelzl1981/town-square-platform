/**
 * PV Create Wizard — 2-step plant creation
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePvPlants } from '@/hooks/usePvPlants';
import { usePvDMS } from '@/hooks/usePvDMS';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Check, Sun } from 'lucide-react';

export default function PVCreateWizard() {
  const navigate = useNavigate();
  const { createPlant } = usePvPlants();
  const { createDMSTree } = usePvDMS();
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [kwp, setKwp] = useState('');
  const [commDate, setCommDate] = useState('');

  // Step 2
  const [provider, setProvider] = useState('demo');
  const [wrManufacturer, setWrManufacturer] = useState('');
  const [wrModel, setWrModel] = useState('');

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const plant = await createPlant.mutateAsync({
        name,
        street: street || undefined,
        postal_code: postalCode || undefined,
        city: city || undefined,
        kwp: kwp ? parseFloat(kwp) : undefined,
        commissioning_date: commDate || undefined,
        provider,
        wr_manufacturer: wrManufacturer || undefined,
        wr_model: wrModel || undefined,
      });
      await createDMSTree.mutateAsync({ plantId: plant.id, plantName: plant.name });
      navigate(`/portal/photovoltaik/${plant.id}`);
    } catch {
      // handled in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/portal/photovoltaik/anlagen')} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Button>

      {/* Progress */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
        <div className="h-px flex-1 bg-border" />
        <div className={`rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Neue PV-Anlage — Stammdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Anlagenname *</Label>
              <Input id="name" placeholder="z.B. EFH Berlin 9,8 kWp" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Straße</Label>
                <Input id="street" placeholder="Musterstr. 1" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="city">Ort</Label>
                <Input id="city" placeholder="Berlin" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal">PLZ</Label>
                <Input id="postal" placeholder="10115" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="kwp">Leistung (kWp)</Label>
                <Input id="kwp" type="number" step="0.1" placeholder="9.8" value={kwp} onChange={(e) => setKwp(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="comm">Inbetriebnahme (optional)</Label>
              <Input id="comm" type="date" value={commDate} onChange={(e) => setCommDate(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setStep(2)} disabled={!name.trim()}>
              Weiter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Monitoring & Technik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Monitoring Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Demo (synthetische Daten)</SelectItem>
                  <SelectItem value="sma">SMA (coming soon)</SelectItem>
                  <SelectItem value="solarlog">Solar-Log (coming soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wr-mfg">WR-Hersteller</Label>
                <Input id="wr-mfg" placeholder="z.B. SMA" value={wrManufacturer} onChange={(e) => setWrManufacturer(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="wr-model">WR-Modell</Label>
                <Input id="wr-model" placeholder="z.B. Tripower 10.0" value={wrModel} onChange={(e) => setWrModel(e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Check className="h-4 w-4 mr-1" /> {saving ? 'Speichern...' : 'Anlage erstellen'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
