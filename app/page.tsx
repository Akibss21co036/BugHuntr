"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileText,
  Award,
  Users,
  TrendingUp,
  Lock,
  Bug,
  Terminal,
  Code2,
} from "lucide-react";
import { BugCard } from "@/components/bug-feed/bug-card";
import { mockBugs } from "@/data/mock-bugs";

const features = [
  {
    icon: Shield,
    title: "ADVANCED_SECURITY",
    description:
      "Access cutting-edge vulnerability research and proof-of-concepts from top security researchers worldwide.",
  },
  {
    icon: FileText,
    title: "PREMIUM_REPORTS",
    description:
      "Detailed vulnerability reports with step-by-step exploitation guides and remediation strategies.",
  },
  {
    icon: Award,
    title: "VERIFIED_CERTS",
    description:
      "Earn industry-recognized certificates for your security research contributions and achievements.",
  },
  {
    icon: Users,
    title: "ELITE_COMMUNITY",
    description:
      "Connect with elite security researchers, bug bounty hunters, and cybersecurity professionals.",
  },
  {
    icon: TrendingUp,
    title: "SKILL_DEVELOPMENT",
    description:
      "Level up your security skills with hands-on learning and real-world vulnerability analysis.",
  },
  {
    icon: Lock,
    title: "EXCLUSIVE_ACCESS",
    description:
      "Access premium content, private disclosures, and advanced exploitation techniques.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_10%_10%,var(--accent-soft),transparent_70%),radial-gradient(55%_45%_at_95%_90%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_35%,transparent)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />
      </div>

      <section className="relative z-10 pt-16 pb-24 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border bg-secondary/70 px-5 py-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary tracking-wide">
              SYSTEM ONLINE // 15,000+ ACTIVE HUNTERS
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight max-w-4xl">
            Hunt vulnerabilities.
            <span className="block text-primary">Earn trust.</span>
            Secure products.
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-3xl leading-relaxed">
            BugHuntr is a professional bug bounty platform for researchers and organizations that need clear reporting,
            consistent triage, and reliable payouts.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/signup")}
            >
              <Terminal className="mr-2 h-4 w-4" />
              Start Hunting
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-border bg-secondary/50 text-foreground hover:bg-secondary"
              onClick={() => router.push("/login")}
            >
              <Code2 className="mr-2 h-4 w-4" />
              View Bounties
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: "Security Researchers", value: "15K+", icon: Users },
              { label: "Vulnerabilities Found", value: "75K+", icon: Bug },
              { label: "Rewards Distributed", value: "$5M+", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card/90 p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-lg border border-border bg-secondary p-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Why <span className="text-primary">BugHuntr</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              A readable, scalable workflow for reporting, triage, and recognition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div key={index} className="rounded-xl border border-border bg-card/90 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex rounded-lg border border-border bg-secondary p-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold tracking-wide text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Latest <span className="text-primary">Discoveries</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Stay updated with recently submitted vulnerabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mockBugs.slice(0, 4).map((bug, index) => (
              <div key={bug.id} className="transition-transform duration-300 hover:-translate-y-1">
                <BugCard bug={bug} index={index} />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              variant="outline"
              className="px-8 border-border bg-secondary/40 hover:bg-secondary"
              onClick={() => router.push("/feed")}
            >
              View All Vulnerabilities
              <Terminal className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-10 border-t border-border/80 px-4">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span>© 2025 BugHuntr. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold">SYSTEM STATUS: OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
