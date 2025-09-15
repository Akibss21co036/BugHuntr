"use client"

import { useAuth } from "@/components/auth/auth-context"
import { Header } from "./Header"
import { Hero } from "./Hero"
import { Features } from "./Features"
import { Footer } from "./Footer"

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      <Header isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <Footer />
    </div>
  )
}

export default LandingPage