"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Premium gradient track
        "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full border outline-none transition-all",
        // Unchecked: glass
        "data-[state=unchecked]:bg-white/10 data-[state=unchecked]:backdrop-blur-sm border-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        // Checked: gradient + glow
        "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500 data-[state=checked]:shadow-[0_8px_22px_rgba(236,72,153,0.35)] border-transparent",
        // Focus ring
        "focus-visible:ring-[3px] focus-visible:ring-purple-400/35",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // White thumb with soft shadow; travel keeps 2px inset
          "pointer-events-none block size-5 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] ring-0 transition-transform will-change-transform",
          // Track is w-12 (48px); thumb is 20px => checked offset = 48 - 20 - 2 = 26px
          "translate-x-[2px] data-[state=checked]:translate-x-[26px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
