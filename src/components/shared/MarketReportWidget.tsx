/**
 * MarketReportWidget — Closed-state card that opens MarketReportSheet on click
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { MarketReportSheet } from './MarketReportSheet';
import type { LucideIcon } from 'lucide-react';

interface MarketReportWidgetProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  buttonLabel: string;
  gradientFrom: string;
  gradientTo: string;
  sheetTitle: string;
  sheetDescription: string;
  functionName: string;
  requestBody?: Record<string, unknown>;
}

export function MarketReportWidget({
  icon: Icon,
  title,
  subtitle,
  buttonLabel,
  gradientFrom,
  gradientTo,
  sheetTitle,
  sheetDescription,
  functionName,
  requestBody,
}: MarketReportWidgetProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Card className={cn("overflow-hidden border-0 shadow-card", DESIGN.DASHBOARD_HEADER.CARD_HEIGHT)}>
        <div
          className="h-2"
          style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
        />
        <CardContent className="p-4 flex flex-col h-full justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` }}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="text-[10px] text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Klicken Sie auf den Button, um einen KI-gestützten Bericht in Echtzeit zu generieren.
              Die Analyse wird live gestreamt und als strukturierter Report dargestellt.
            </p>
          </div>
          <Button
            onClick={() => setSheetOpen(true)}
            className="w-full mt-4 gap-2"
            style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
          >
            <Icon className="h-4 w-4" />
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>

      <MarketReportSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={sheetTitle}
        description={sheetDescription}
        functionName={functionName}
        requestBody={requestBody}
      />
    </>
  );
}
