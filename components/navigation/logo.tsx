import Link from "next/link";
import { Bug, Shield } from "lucide-react";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2.5 cursor-pointer transition duration-200 hover:opacity-90 hover:scale-105 ${className}`}
      aria-label="BugHuntr Home"
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center text-[var(--accent-primary)]">
        <Shield className="h-8 w-8" strokeWidth={1.9} />
        <Bug className="absolute h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="text-lg font-semibold tracking-tight leading-none text-foreground">
        <span className="text-primary">Bug</span>
        <span className="text-[var(--accent-primary)]">Huntr</span>
      </span>
    </Link>
  );
}
