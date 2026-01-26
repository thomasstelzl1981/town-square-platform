import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check } from 'lucide-react';

interface PaywallBannerProps {
  title: string;
  description: string;
  features: string[];
  onUpgrade?: () => void;
}

export const PaywallBanner = ({ title, description, features, onUpgrade }: PaywallBannerProps) => {
  return (
    <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" />
              <h3 className="font-semibold">{title}</h3>
              <Badge variant="outline" className="text-accent border-accent">
                Premium
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-status-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={onUpgrade} className="shrink-0">
            <Star className="h-4 w-4 mr-2" />
            Premium aktivieren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
