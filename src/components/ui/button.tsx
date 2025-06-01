import * as React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full",
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";
