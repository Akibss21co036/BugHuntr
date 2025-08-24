"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { BugCard } from "@/components/bug-feed/bug-card"
import { FilterControls } from "@/components/bug-feed/filter-controls"
import { BugCardSkeleton } from "@/components/loading/bug-card-skeleton"
import { FadeIn } from "@/components/animations/fade-in"
import { mockBugs } from "@/data/mock-bugs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Users, Award } from "lucide-react"
import { BugHuntCard } from "@/components/bug-hunt/bug-hunt-card"
import { useBugHunt } from "@/hooks/use-bug-hunt"

export default function BugFeedPage() {
  const [selectedSeverity, setSelectedSeverity] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const { getActiveBugHunts } = useBugHunt()
  const activeBugHunts = getActiveBugHunts() || []

  const filteredAndSortedBugs = useMemo(() => {
    let filteredBugs = mockBugs

    if (selectedSeverity !== "all") {
      filteredBugs = filteredBugs.filter((bug) => bug.severity === selectedSeverity)
    }

    if (selectedCategory !== "all") {
      filteredBugs = filteredBugs.filter((bug) => bug.category === selectedCategory)
    }

    if (sortBy === "oldest") {
      filteredBugs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else {
      filteredBugs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    return filteredBugs
  }, [selectedSeverity, selectedCategory, sortBy])

  const stats = useMemo(() => {
    const totalBugs = mockBugs.length
    const criticalCount = mockBugs.filter((bug) => bug.severity === "critical").length
    const resolvedCount = mockBugs.filter((bug) => bug.status === "resolved").length
    const activeHunters = new Set(mockBugs.map((bug) => bug.author)).size

    return {
      total: totalBugs,
      critical: criticalCount,
      resolved: resolvedCount,
      hunters: activeHunters,
    }
  }, [])

  const handleClearFilters = () => {
    setSelectedSeverity("all")
    setSelectedCategory("all")
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setIsLoading(true)
    setTimeout(() => {
      if (filterType === "severity") setSelectedSeverity(value)
      if (filterType === "category") setSelectedCategory(value)
      if (filterType === "sort") setSortBy(value)
      setIsLoading(false)
    }, 300)
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-cyber-blue to-cyber-cyan bg-clip-text text-transparent">
              Security Intelligence Feed
            </h1>
            <p className="text-muted-foreground">
              Discover the latest security vulnerabilities and threat intelligence from our community
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyber-blue" />
                  <span className="text-sm text-muted-foreground">Total Reports</span>
                </div>
                <div className="text-2xl font-bold text-cyber-blue mt-1">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-severity-critical" />
                  <span className="text-sm text-muted-foreground">Critical</span>
                </div>
                <div className="text-2xl font-bold text-severity-critical mt-1">{stats.critical}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-neon-green" />
                  <span className="text-sm text-muted-foreground">Resolved</span>
                </div>
                <div className="text-2xl font-bold text-neon-green mt-1">{stats.resolved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyber-purple" />
                  <span className="text-sm text-muted-foreground">Active Hunters</span>
                </div>
                <div className="text-2xl font-bold text-cyber-purple mt-1">{stats.hunters}</div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mb-6 lg:mb-8">
            <FilterControls
              selectedSeverity={selectedSeverity}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              onSeverityChange={(value) => handleFilterChange("severity", value)}
              onCategoryChange={(value) => handleFilterChange("category", value)}
              onSortChange={(value) => handleFilterChange("sort", value)}
              onClearFilters={handleClearFilters}
              totalCount={mockBugs.length}
              filteredCount={filteredAndSortedBugs.length}
            />
          </div>
        </FadeIn>

        {activeBugHunts && activeBugHunts.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-cyber-blue">Active Bug Hunts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mb-8">
                {activeBugHunts.map((hunt, index) => (
                  <BugHuntCard key={hunt.id} hunt={hunt} index={index} />
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <BugCardSkeleton key={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 auto-rows-max"
            >
              {filteredAndSortedBugs.map((bug, index) => (
                <div key={bug.id} onClick={() => router.push(`/bug/${bug.id}`)}>
                  <BugCard bug={bug} index={index} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && filteredAndSortedBugs.length === 0 && (
          <FadeIn delay={0.3}>
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">No vulnerabilities found</div>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters to see more results</p>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  )
}
