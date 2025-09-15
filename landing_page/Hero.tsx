"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star, Users, Shield, Target } from "lucide-react"

interface HeroProps {
  isAuthenticated: boolean
}

export const Hero = ({ isAuthenticated }: HeroProps) => {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Globe Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/images/cybersecurity-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(2px)",
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-cyber-blue/20 z-10" />
      
      {/* Animated Background Elements */}
      <motion.div 
        className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-cyber-blue/20 to-cyber-cyan/20 rounded-full blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div 
        className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/20 rounded-lg rotate-45 blur-lg"
        animate={{
          rotate: [45, 225, 45],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 relative z-20">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge
            variant="outline"
            className="mb-6 border-cyber-blue/30 text-cyber-blue bg-background/80 backdrop-blur-sm text-lg font-semibold tracking-wide"
          >
            🛡️ BugHuntr: Elite Security Research Platform
          </Badge>
          
          <motion.h1 
            className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-r from-cyber-blue via-cyber-cyan to-cyber-purple bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover. Analyze. Secure.
          </motion.h1>
          
          <motion.p 
            className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed backdrop-blur-sm bg-background/60 rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Join the world's most advanced bug bounty platform where elite security researchers share cutting-edge
            vulnerabilities and exploitation techniques.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {!isAuthenticated ? (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white px-8 py-3 text-lg shadow-lg hover:shadow-cyber-blue/25 transition-all duration-300 group"
                  onClick={() => router.push("/signup")}
                >
                  Start Hunting Bugs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 px-8 py-3 text-lg bg-background/80 backdrop-blur-sm"
                  onClick={() => router.push("/feed")}
                >
                  Explore Bounties
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyber-blue to-cyber-cyan hover:from-cyber-blue/90 hover:to-cyber-cyan/90 text-white px-8 py-3 text-lg shadow-lg hover:shadow-cyber-blue/25 transition-all duration-300 group"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {[
              { icon: Users, label: "Security Researchers", value: "10,000+" },
              { icon: Shield, label: "Vulnerabilities Found", value: "50,000+" },
              { icon: Target, label: "Bug Bounty Rewards", value: "$2.5M+" },
              { icon: Star, label: "Companies Protected", value: "500+" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border/50"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <stat.icon className="h-8 w-8 text-cyber-blue mx-auto mb-2" />
                <div className="text-2xl font-bold text-cyber-blue mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}