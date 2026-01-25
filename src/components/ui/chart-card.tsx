import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  aspectRatio?: "square" | "video" | "wide";
}

const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  ({ className, title, description, actions, loading = false, aspectRatio = "video", children, ...props }, ref) => {
    const aspectClasses = {
      square: "aspect-square",
      video: "aspect-video",
      wide: "aspect-[21/9]",
    };

    return (
      <Card ref={ref} className={cn("shadow-card", className)} {...props}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </CardHeader>
        <CardContent>
          <div className={cn(aspectClasses[aspectRatio], "relative")}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              children
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
ChartCard.displayName = "ChartCard";

// Mock chart component for prototyping
export interface MockChartProps {
  type?: "bar" | "line" | "area" | "pie" | "heatmap";
  className?: string;
}

const MockChart = ({ type = "bar", className }: MockChartProps) => {
  return (
    <div className={cn("w-full h-full flex items-end justify-around gap-2 p-4", className)}>
      {type === "bar" && (
        <>
          {[65, 85, 45, 70, 90, 55, 75].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
              style={{ height: `${height}%` }}
            />
          ))}
        </>
      )}
      {type === "line" && (
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <path
            d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,20"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          <path
            d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,20 L100,50 L0,50 Z"
            fill="hsl(var(--primary) / 0.1)"
          />
        </svg>
      )}
      {type === "pie" && (
        <svg className="w-3/4 h-3/4" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="hsl(var(--muted))" strokeWidth="20" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth="20"
            strokeDasharray="175 251"
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
      {type === "heatmap" && (
        <div className="grid grid-cols-7 gap-1 w-full h-full p-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                backgroundColor: `hsl(var(--primary) / ${Math.random() * 0.8 + 0.2})`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export { ChartCard, MockChart };
