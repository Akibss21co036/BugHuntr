"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Target, Award, Users, TrendingUp, Lock, ArrowRight } from "lucide-react"
import { FadeIn } from "@/components/animations/fade-in"
import { StaggerContainer } from "@/components/animations/stagger-container"
import { BugCard } from "@/components/bug-feed/bug-card"
import { mockBugs } from "@/data/mock-bugs"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const floatingY1 = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const floatingY2 = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"])
  const floatingY3 = useTransform(scrollYProgress, [0, 1], ["0%", "75%"])
  const imageLayer1Y = useTransform(scrollYProgress, [0, 1], ["0%", "60%"])
  const imageLayer2Y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])
  const imageLayer3Y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"])

  const floatingText1Y = useTransform(scrollYProgress, [0, 1], ["100%", "-100%"])
  const floatingText1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const floatingText2Y = useTransform(scrollYProgress, [0, 1], ["-50%", "150%"])
  const floatingText2Opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.7, 0.9], [0, 1, 1, 0])
  const floatingText3Y = useTransform(scrollYProgress, [0, 1], ["50%", "-80%"])
  const floatingText3Opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0])
  const floatingText4Y = useTransform(scrollYProgress, [0, 1], ["200%", "-50%"])
  const floatingText4Opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [0, 1, 1, 0])
  const floatingText5Y = useTransform(scrollYProgress, [0, 1], ["-100%", "200%"])
  const floatingText5Opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.8, 1], [0, 1, 1, 0])

  const handleGetStarted = () => {
    setIsLoading(true)
    router.push("/signup")
  }

  const features = [
    {
      icon: Shield,
      title: "Advanced Security Research",
      description:
        "Access cutting-edge vulnerability research and proof-of-concepts from top security researchers worldwide.",
    },
    {
      icon: Target,
      title: "Premium Bug Reports",
      description: "Detailed vulnerability reports with step-by-step exploitation guides and remediation strategies.",
    },
    {
      icon: Award,
      title: "Verified Certificates",
      description: "Earn industry-recognized certificates for your security research contributions and achievements.",
    },
    {
      icon: Users,
      title: "Elite Community",
      description: "Connect with elite security researchers, bug bounty hunters, and cybersecurity professionals.",
    },
    {
      icon: TrendingUp,
      title: "Skill Development",
      description: "Level up your security skills with hands-on learning and real-world vulnerability analysis.",
    },
    {
      icon: Lock,
      title: "Exclusive Content",
      description: "Access premium content, private disclosures, and advanced exploitation techniques.",
    },
  ]

  const stats = [
    { label: "Security Researchers", value: "10,000+" },
    { label: "Vulnerabilities Disclosed", value: "50,000+" },
    { label: "Bug Bounty Rewards", value: "$2.5M+" },
    { label: "Companies Protected", value: "500+" },
  ]

  const showcaseBugs = mockBugs.slice(0, 3)

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-background via-background to-cyber-blue/5 relative overflow-hidden"
    >
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 bg-grid-pattern opacity-5" />

      <motion.div style={{ y: imageLayer1Y, scale: heroImageScale }} className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat blur-sm"
          style={{
            backgroundImage: "url('/images/cybersecurity-hero.jpg')",
            backgroundPosition: "center 20%",
            transform: "scale(1.2)",
          }}
        />
      </motion.div>

      <motion.div style={{ y: imageLayer2Y }} className="absolute inset-0 opacity-15">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/cybersecurity-hero.jpg')",
            backgroundPosition: "right center",
            maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)",
          }}
        />
      </motion.div>

      <motion.div style={{ y: imageLayer3Y }} className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/cybersecurity-hero.jpg')",
            backgroundPosition: "left center",
            maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0) 100%)",
          }}
        />
      </motion.div>

      <motion.div
        style={{ y: floatingText1Y, opacity: floatingText1Opacity }}
        className="absolute top-1/4 left-10 pointer-events-none select-none z-5"
      >
        <div className="text-6xl lg:text-8xl font-bold text-cyber-blue/20 transform -rotate-12">VULNERABILITY</div>
      </motion.div>

      <motion.div
        style={{ y: floatingText2Y, opacity: floatingText2Opacity }}
        className="absolute top-1/3 right-20 pointer-events-none select-none z-5"
      >
        <div className="text-4xl lg:text-6xl font-bold text-cyber-cyan/25 transform rotate-6">EXPLOIT</div>
      </motion.div>

      <motion.div
        style={{ y: floatingText3Y, opacity: floatingText3Opacity }}
        className="absolute top-1/2 left-1/4 pointer-events-none select-none z-5"
      >
        <div className="text-5xl lg:text-7xl font-bold text-cyber-purple/20 transform rotate-12">SECURE</div>
      </motion.div>

      <motion.div
        style={{ y: floatingText4Y, opacity: floatingText4Opacity }}
        className="absolute bottom-1/3 right-1/4 pointer-events-none select-none z-5"
      >
        <div className="text-3xl lg:text-5xl font-bold text-cyber-blue/30 transform -rotate-6">RESEARCH</div>
      </motion.div>

      <motion.div
        style={{ y: floatingText5Y, opacity: floatingText5Opacity }}
        className="absolute bottom-1/4 left-1/3 pointer-events-none select-none z-5"
      >
        <div className="text-4xl lg:text-6xl font-bold text-cyber-cyan/20 transform rotate-3">BOUNTY</div>
      </motion.div>

      <motion.div
        style={{ y: floatingY1 }}
        className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyber-blue/20 to-cyber-cyan/20 rounded-full blur-xl animate-pulse"
      />
      <motion.div
        style={{ y: floatingY2 }}
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/20 rounded-lg rotate-45 blur-lg"
      />
      <motion.div
        style={{ y: floatingY3 }}
        className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-cyber-cyan/10 to-cyber-purple/10 rounded-full blur-2xl"
      />

      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div style={{ y: textY }}>
            <FadeIn>
              <div className="text-center max-w-4xl mx-auto">
                <Badge
                  variant="outline"
                  className="mb-6 border-cyber-blue/30 text-cyber-blue bg-background/80 backdrop-blur-sm"
                >
                  🔒 Elite Security Research Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-cyber-blue via-cyber-cyan to-cyber-purple bg-clip-text text-transparent leading-tight drop-shadow-lg">
                  Discover. Analyze. Secure.
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed backdrop-blur-sm bg-background/60 rounded-lg p-4">
                  Join the world's most advanced bug bounty platform where elite security researchers share cutting-edge
                  vulnerabilities and exploitation techniques.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white px-8 py-3 text-lg shadow-lg hover:shadow-cyber-blue/25 transition-all duration-300"
                    onClick={handleGetStarted}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Get Started"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 px-8 py-3 text-lg bg-background/80 backdrop-blur-sm"
                    onClick={() => router.push("/login")}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </FadeIn>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 relative backdrop-blur-sm">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0.2, 0.8], ["0%", "30%"]) }}
          className="absolute inset-0 bg-gradient-to-r from-cyber-blue/5 via-transparent to-cyber-cyan/5"
        />
        <div className="container mx-auto px-4 relative z-10">
          <StaggerContainer>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center bg-background/60 backdrop-blur-sm rounded-lg p-4"
                >
                  <div className="text-3xl lg:text-4xl font-bold text-cyber-blue mb-2">{stat.value}</div>
                  <div className="text-muted-foreground text-sm lg:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      <section className="py-20 relative">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0.3, 1], ["0%", "-20%"]) }}
          className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-cyber-blue/20 to-transparent rounded-full blur-md"
        />
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0.4, 1], ["0%", "40%"]) }}
          className="absolute bottom-20 left-20 w-16 h-16 bg-gradient-to-br from-cyber-cyan/15 to-transparent rounded-lg rotate-12 blur-sm"
        />

        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
                Why Choose BugHuntr?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Access premium security research, connect with elite researchers, and advance your cybersecurity career.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-cyber-blue/30 group bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-lg bg-cyber-blue/10 group-hover:bg-cyber-blue/20 transition-colors">
                          <feature.icon className="h-6 w-6 text-cyber-blue" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-cyber-blue transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      <section className="py-20 bg-muted/20 relative backdrop-blur-sm">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0.5, 1], ["0%", "20%"]) }}
          className="absolute inset-0 bg-gradient-to-r from-cyber-blue/5 via-transparent to-cyber-cyan/5"
        />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
                Latest Vulnerability Discoveries
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get a preview of the high-quality security research shared by our community. Join to access full details
                and contribute your own findings.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
              {showcaseBugs.map((bug, index) => (
                <BugCard key={bug.id} bug={bug} index={index} />
              ))}
            </div>
          </StaggerContainer>

          <FadeIn>
            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                This is just a small sample. Join our platform to access thousands of detailed vulnerability reports.
              </p>
              <Button
                size="lg"
                variant="outline"
                className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 px-8 py-3 text-lg bg-background/80 backdrop-blur-sm group"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Explore All Vulnerabilities"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-cyber-blue/10 via-cyber-cyan/10 to-cyber-purple/10 relative backdrop-blur-sm">
        <motion.div
          style={{ y: useTransform(scrollYProgress, [0.7, 1], ["0%", "-30%"]) }}
          className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 via-transparent to-cyber-purple/5"
        />
        <div className="container mx-auto px-4 relative z-10">
          <FadeIn>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
                Ready to Join the Elite?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start your journey in advanced cybersecurity research today. Access premium content, connect with
                experts, and earn recognized certifications.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white px-12 py-4 text-lg shadow-lg hover:shadow-cyber-blue/25 transition-all duration-300"
                onClick={handleGetStarted}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Start Your Journey"}
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
