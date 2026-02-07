import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: LucideIcon;
  variant?: "default" | "compact";
}
const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({
  className,
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = "default",
  ...props
}, ref) => {
  const isCompact = variant === "compact";
  return <div ref={ref} className={cn("rounded-lg border bg-card shadow-card transition-all hover:shadow-elevated", isCompact ? "p-4" : "p-5", className)} {...props}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className={cn("font-medium text-muted-foreground truncate", isCompact ? "text-xs" : "text-sm")}>
              {title}
            </p>
            
            {/* Value */}
            <p className={cn("font-semibold tabular-nums text-foreground mt-1", isCompact ? "text-xl" : "text-kpi")}>
              {value}
            </p>
            
            {/* Subtitle & Trend */}
            <div className="flex items-center gap-2 mt-1">
              {trend && <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trend.direction === "up" ? "text-status-success" : "text-status-error")}>
                  {trend.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>}
              {subtitle && <span className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </span>}
            </div>
          </div>
          
          {/* Icon */}
          {Icon && <div className={cn("flex items-center justify-center rounded-lg bg-primary/10", isCompact ? "h-8 w-8" : "h-10 w-10")}>
              
            </div>}
        </div>
      </div>;
});
StatCard.displayName = "StatCard";
export { StatCard };