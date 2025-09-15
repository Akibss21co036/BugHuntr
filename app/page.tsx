"use client"
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Award, Users, TrendingUp, Lock } from "lucide-react";
import { BugCard } from "@/components/bug-feed/bug-card";
import { mockBugs } from "@/data/mock-bugs";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen relative overflow-hidden font-montserrat" style={{ fontFamily: 'Montserrat, sans-serif', backgroundColor: '#10151c' }}>
      {/* Globe background */}
      <img
        src="/abstract-globe.jpg"
        alt="Globe background"
        className="fixed top-0 left-0 w-screen h-screen object-cover object-center opacity-80 z-0 pointer-events-none select-none"
        style={{ maxWidth: '100vw', maxHeight: '100vh', minWidth: '100vw', minHeight: '100vh' }}
      />

      {/* HERO SECTION */}
  <section className="relative py-24 flex flex-col items-center justify-center z-10">
        <div className="mb-4 flex justify-center">
          <span className="px-4 py-1 rounded-full bg-[#18202b] text-blue-400 text-sm font-semibold shadow border border-blue-700/30">★ Trusted by Elite Security Researchers</span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-center text-white mb-4">
          Secure the <span className="text-blue-400">Digital World</span>
        </h1>
        <p className="text-lg md:text-xl text-center text-gray-300 max-w-2xl mb-8">
          Join the world's most advanced bug bounty platform. Discover vulnerabilities, earn substantial rewards, and connect with elite cybersecurity professionals worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow"
            onClick={() => router.push("/signup")}
          >
            Start Hunting Bugs
          </Button>
          <Button
            size="lg"
            className="bg-[#23272f] hover:bg-[#23272f]/80 text-white px-8 py-3 text-lg font-semibold shadow"
            onClick={() => router.push("/login")}
          >
            Explore Bounties
          </Button>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
  <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Why Choose Bughuntr?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Everything you need to excel in cybersecurity research and bug bounty hunting, all in one comprehensive platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <Shield className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Advanced Security Research</h3>
              <p className="text-gray-400">Access cutting-edge vulnerability research and proof-of-concepts from top security researchers worldwide.</p>
            </div>
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <FileText className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Premium Bug Reports</h3>
              <p className="text-gray-400">Detailed vulnerability reports with step-by-step exploitation guides and remediation strategies.</p>
            </div>
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <Award className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Verified Certificates</h3>
              <p className="text-gray-400">Earn industry-recognized certificates for your security research contributions and achievements.</p>
            </div>
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <Users className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Elite Community</h3>
              <p className="text-gray-400">Connect with elite security researchers, bug bounty hunters, and cybersecurity professionals.</p>
            </div>
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <TrendingUp className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Skill Development</h3>
              <p className="text-gray-400">Level up your security skills with hands-on learning and real-world vulnerability analysis.</p>
            </div>
            <div className="bg-[#181e26] rounded-xl p-6 border border-[#23272f] flex flex-col items-start">
              <Lock className="w-7 h-7 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Exclusive Content</h3>
              <p className="text-gray-400">Access premium content, private disclosures, and advanced exploitation techniques.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST VULNERABILITIES SECTION */}
  <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Latest Vulnerability Discoveries</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Stay updated with the most recent security vulnerabilities discovered by our community of elite researchers.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockBugs.slice(0, 4).map((bug, index) => (
              <BugCard key={bug.id} bug={bug} index={index} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
