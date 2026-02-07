/**
 * PartnerExposeModal — Interaktives Exposé mit Investment-Engine
 * Zeigt MasterGraph, Haushaltsrechnung, Slider-Panel und Excel-Tabelle
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileDown, Handshake, UserPlus, MapPin, Building2, 
  TrendingUp, Calculator, X 
} from 'lucide-react';
import { toast } from 'sonner';

import { MasterGraph, Haushaltsrechnung, InvestmentSliderPanel, DetailTable40Jahre } from '@/components/investment';
import { useInvestmentEngine, type CalculationInput, defaultInput } from '@/hooks/useInvestmentEngine';
import type { ListingWithMetrics } from './PartnerPropertyGrid';

interface PartnerExposeModalProps {
  listing: ListingWithMetrics | null;
  isOpen: boolean;
  onClose: () => void;
  initialParams: {
    zve: number;
    equity: number;
    maritalStatus: 'single' | 'married';
    hasChurchTax: boolean;
  };
}

export function PartnerExposeModal({
  listing,
  isOpen,
  onClose,
  initialParams,
}: PartnerExposeModalProps) {
  const { calculate, result, isLoading } = useInvestmentEngine();
  
  const [input, setInput] = useState<CalculationInput>({
    ...defaultInput,
    purchasePrice: listing?.asking_price || 200000,
    monthlyRent: (listing?.annual_rent || 0) / 12,
    equity: initialParams.equity,
    taxableIncome: initialParams.zve,
    maritalStatus: initialParams.maritalStatus,
    hasChurchTax: initialParams.hasChurchTax,
  });

  // Recalculate when input changes
  useEffect(() => {
    if (listing && isOpen) {
      calculate(input);
    }
  }, [input, listing, isOpen, calculate]);

  // Update input when listing changes
  useEffect(() => {
    if (listing) {
      setInput(prev => ({
        ...prev,
        purchasePrice: listing.asking_price,
        monthlyRent: listing.annual_rent / 12,
        equity: initialParams.equity,
        taxableIncome: initialParams.zve,
        maritalStatus: initialParams.maritalStatus,
        hasChurchTax: initialParams.hasChurchTax,
      }));
    }
  }, [listing, initialParams]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const handleExportPdf = () => {
    toast.info('PDF wird erstellt...', {
      description: 'Der Download startet in Kürze',
    });
  };

  const handleStartDeal = () => {
    toast.success('Deal gestartet', {
      description: 'Der Vorgang wurde in der Pipeline angelegt',
    });
    onClose();
  };

  const handleAssignCustomer = () => {
    toast.info('Kunden-Zuordnung', {
      description: 'Wählen Sie einen Kunden aus Ihren Kontakten',
    });
  };

  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{listing.title}</DialogTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {listing.property_address}, {listing.property_city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{formatCurrency(listing.asking_price)}</Badge>
              {listing.commission_rate && (
                <Badge className="bg-primary">{listing.commission_rate}% Provision</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Main Content (2/3) */}
          <ScrollArea className="flex-1 lg:w-2/3">
            <div className="p-4 space-y-4">
              {/* 40-Jahre-Grafik */}
              {result && (
                <MasterGraph 
                  projection={result.projection} 
                  title="40-Jahres-Projektion"
                  variant="full"
                />
              )}

              {/* Haushaltsrechnung */}
              {result && (
                <Haushaltsrechnung result={result} variant="detailed" />
              )}

              {/* Detail-Tabelle */}
              {result && (
                <Tabs defaultValue="table">
                  <TabsList>
                    <TabsTrigger value="table">Detailtabelle</TabsTrigger>
                    <TabsTrigger value="object">Objektdaten</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table">
                    <DetailTable40Jahre projection={result.projection} />
                  </TabsContent>
                  <TabsContent value="object">
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Kaufpreis</p>
                        <p className="font-semibold">{formatCurrency(listing.asking_price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Jahresmiete</p>
                        <p className="font-semibold">{formatCurrency(listing.annual_rent)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bruttorendite</p>
                        <p className="font-semibold text-green-600">
                          {listing.grossYield?.toFixed(1) || '—'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fläche</p>
                        <p className="font-semibold">{listing.total_area_sqm || '—'} m²</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Objekttyp</p>
                        <p className="font-semibold capitalize">
                          {listing.property_type?.replace('_', ' ') || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Partner-Provision</p>
                        <p className="font-semibold text-primary">
                          {listing.commission_rate ? `${listing.commission_rate}%` : '—'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar (1/3) */}
          <div className="lg:w-1/3 border-l bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Investment-Regler */}
                <InvestmentSliderPanel
                  value={input}
                  onChange={setInput}
                  layout="vertical"
                  showAdvanced={false}
                  purchasePrice={listing.asking_price}
                />

                {/* Monatsbelastung Highlight */}
                {result && (
                  <div className={`p-4 rounded-lg ${
                    result.summary.monthlyBurden <= 0 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm text-muted-foreground">Monatliche Belastung</p>
                    <p className={`text-3xl font-bold ${
                      result.summary.monthlyBurden <= 0 ? 'text-green-600' : ''
                    }`}>
                      {result.summary.monthlyBurden <= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(result.summary.monthlyBurden))}/Mo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.summary.monthlyBurden <= 0 
                        ? '✓ Selbsttragendes Investment' 
                        : 'Monatlicher Eigenanteil'}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  <Button className="w-full" onClick={handleStartDeal}>
                    <Handshake className="w-4 h-4 mr-2" />
                    Deal starten
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleAssignCustomer}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Kunden zuordnen
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleExportPdf}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF Export
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
