import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full",
      "border border-white/20 dark:border-white/10",
      "bg-white/30 dark:bg-white/10",
      "backdrop-blur-md",
      "shadow-[inset_0_1px_0_hsla(0,0%,100%,0.15)]",
      "transition-all duration-200",
      "data-[state=checked]:bg-primary/90 data-[state=checked]:border-primary/30",
      "data-[state=checked]:shadow-[inset_0_1px_0_hsla(0,0%,100%,0.2),0_0_8px_hsla(var(--primary)/0.3)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full",
        "bg-white shadow-[0_1px_3px_hsla(0,0%,0%,0.15),0_1px_2px_hsla(0,0%,0%,0.1)]",
        "ring-0 transition-transform duration-200",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
