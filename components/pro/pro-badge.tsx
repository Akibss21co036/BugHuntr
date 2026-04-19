import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProBadge({ className, size = "md" }: ProBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold",
        "bg-gradient-to-r from-primary to-secondary",
        "text-primary-foreground shadow-sm",
        "border border-[var(--border-light)]",
        sizeClasses[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      PRO
    </span>
  );
}
