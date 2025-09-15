"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Target, Award, Users, TrendingUp, Lock } from "lucide-react"

export const Features = () => {
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

  return (
    <section id="features" className="py-20 bg-muted/20 relative">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
            Why Choose BugHuntr?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access premium security research, connect with elite researchers, and advance your cybersecurity career.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
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
      </div>
    </section>
  )
}