/**
 * FinanceObjectCard — Reusable property data card with localStorage persistence.
 * Used identically in MOD-07 (Anfrage) and MOD-11 (Finanzierungsakte).
 */
import * as React from 'react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Building2, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';

export interface ObjectFormData {
  street: string;
  houseNo: string;
  postalCode: string;
  city: string;
  objectType: string;
  yearBuilt: string;
  livingArea: string;
  plotArea: string;
  equipment: string;
  location: string;
  rooms: string;
  parking: string;
  usage: string;
  rentalIncome: string;
}

export const emptyObjectData: ObjectFormData = {
  street: '', houseNo: '', postalCode: '', city: '',
  objectType: '', yearBuilt: '', livingArea: '', plotArea: '',
  equipment: '', location: '', rooms: '', parking: '',
  usage: '', rentalIncome: '',
};

export interface FinanceObjectCardHandle {
  save: () => void;
}

interface Props {
  storageKey: string;
  initialData?: Partial<ObjectFormData>;
  externalData?: Partial<ObjectFormData>;
  readOnly?: boolean;
  hideFooter?: boolean;
}

function TR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{children}</TableCell>
    </TableRow>
  );
}

const inputCls = "h-7 text-xs border-0 bg-transparent shadow-none";

const FinanceObjectCard = forwardRef<FinanceObjectCardHandle, Props>(
  function FinanceObjectCard({ storageKey, initialData, externalData, readOnly = false, hideFooter = false }, ref) {
    const key = `${storageKey}-object`;

    const [data, setData] = useState<ObjectFormData>(() => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) return { ...emptyObjectData, ...JSON.parse(stored) };
      } catch {}
      return { ...emptyObjectData, ...initialData };
    });

    useEffect(() => {
      if (externalData) {
        setData(prev => ({ ...prev, ...externalData }));
      }
    }, [externalData]);

    const set = (field: keyof ObjectFormData, value: string) =>
      setData(prev => ({ ...prev, [field]: value }));

    const handleSave = () => {
      localStorage.setItem(key, JSON.stringify(data));
      toast.success('Objektdaten zwischengespeichert');
    };

    useImperativeHandle(ref, () => ({ save: handleSave }));

    return (
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2.5 border-b bg-muted/20">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Finanzierungsobjekt
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Objektdaten des zu finanzierenden Objekts
            </p>
          </div>

          <div className="px-4 py-2 border-b">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Objektdaten
            </h4>
          </div>

          <Table>
            <TableBody>
              <TR label="Nutzungsart">
                <Select value={data.usage} onValueChange={v => set('usage', v)} disabled={readOnly}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eigengenutzt">Eigengenutzt</SelectItem>
                    <SelectItem value="vermietet">Vermietet</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Mieteinnahmen mtl. (EUR)">
                <Input value={data.rentalIncome} onChange={e => set('rentalIncome', e.target.value)}
                  type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Straße">
                <Input value={data.street} onChange={e => set('street', e.target.value)}
                  placeholder="Musterstraße" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Hausnummer">
                <Input value={data.houseNo} onChange={e => set('houseNo', e.target.value)}
                  placeholder="12a" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="PLZ">
                <Input value={data.postalCode} onChange={e => set('postalCode', e.target.value)}
                  placeholder="10115" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Ort">
                <Input value={data.city} onChange={e => set('city', e.target.value)}
                  placeholder="Berlin" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Objektart">
                <Select value={data.objectType} onValueChange={v => set('objectType', v)} disabled={readOnly}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eigentumswohnung">Eigentumswohnung</SelectItem>
                    <SelectItem value="einfamilienhaus">Einfamilienhaus (EFH)</SelectItem>
                    <SelectItem value="zweifamilienhaus">Zweifamilienhaus (ZFH)</SelectItem>
                    <SelectItem value="mehrfamilienhaus">Mehrfamilienhaus (MFH)</SelectItem>
                    <SelectItem value="grundstueck">Grundstück</SelectItem>
                    <SelectItem value="gewerbe">Gewerbeimmobilie</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Baujahr">
                <Input value={data.yearBuilt} onChange={e => set('yearBuilt', e.target.value)}
                  type="number" placeholder="1990" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Wohnfläche (m²)">
                <Input value={data.livingArea} onChange={e => set('livingArea', e.target.value)}
                  type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Grundstücksfläche (m²)">
                <Input value={data.plotArea} onChange={e => set('plotArea', e.target.value)}
                  type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Ausstattungsniveau">
                <Select value={data.equipment} onValueChange={v => set('equipment', v)} disabled={readOnly}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einfach">Einfach</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="gehoben">Gehoben</SelectItem>
                    <SelectItem value="luxus">Luxus</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Wohnlage">
                <Select value={data.location} onValueChange={v => set('location', v)} disabled={readOnly}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="einfach">Einfach</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="gut">Gut</SelectItem>
                    <SelectItem value="sehr_gut">Sehr gut</SelectItem>
                  </SelectContent>
                </Select>
              </TR>
              <TR label="Anzahl Zimmer">
                <Input value={data.rooms} onChange={e => set('rooms', e.target.value)}
                  type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
              </TR>
              <TR label="Stellplätze / Garagen">
                <Input value={data.parking} onChange={e => set('parking', e.target.value)}
                  type="number" placeholder="0" className={inputCls} readOnly={readOnly} />
              </TR>
            </TableBody>
          </Table>

          {!readOnly && !hideFooter && (
            <div className="px-4 py-3 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
                <Save className="h-3.5 w-3.5" /> Zwischenspeichern
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

export default FinanceObjectCard;
