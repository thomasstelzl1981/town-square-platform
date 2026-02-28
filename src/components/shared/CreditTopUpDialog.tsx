/**
 * Credit Top-Up Dialog — Paketauswahl + Stripe Checkout Trigger
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2, Zap, Star, Rocket } from 'lucide-react';
import { CREDIT_PACKAGES, type CreditPackage, formatEurCents } from '@/config/billingConstants';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PACKAGE_ICONS: Record<string, React.ElementType> = {
  starter: Zap,
  standard: Star,
  power: Rocket,
};

export function CreditTopUpDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(pkg.code);
    try {
      const { data, error } = await supabase.functions.invoke('sot-credit-checkout', {
        body: {
          package_code: pkg.code,
          success_url: `${window.location.origin}/portal/armstrong?checkout=success`,
          cancel_url: `${window.location.origin}/portal/armstrong?checkout=cancel`,
        },
      });

      if (error) throw error;

      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
        setOpen(false);
        toast.info('Stripe Checkout wurde geöffnet. Bitte schließen Sie die Zahlung im neuen Tab ab.');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      toast.error('Checkout konnte nicht gestartet werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Credits aufladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Credits aufladen</DialogTitle>
          <DialogDescription>
            Wählen Sie ein Paket — die Zahlung erfolgt sicher über Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          {CREDIT_PACKAGES.map((pkg) => {
            const Icon = PACKAGE_ICONS[pkg.code] ?? Zap;
            const isLoading = loading === pkg.code;

            return (
              <Card
                key={pkg.code}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  pkg.popular ? 'border-primary/30 ring-1 ring-primary/20' : ''
                }`}
                onClick={() => !loading && handlePurchase(pkg)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{pkg.label}</span>
                        {pkg.popular && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Beliebt
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{pkg.credits} Credits</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">
                      {formatEurCents(pkg.price_eur_cents)}
                    </span>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          1 Credit = 0,25 € · Sichere Zahlung über Stripe · Sofortige Gutschrift
        </p>
      </DialogContent>
    </Dialog>
  );
}
