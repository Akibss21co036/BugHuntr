
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { BugHuntCard } from "@/components/bug-hunt/bug-hunt-card"
import { BugHuntFilterControls } from "@/components/bug-hunt/bug-hunt-filter-controls"
import { FadeIn } from "@/components/animations/fade-in"
import { useBugHunt } from "@/hooks/use-bug-hunt"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/components/auth/auth-context"

export default function BugHuntPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { getActiveBugHunts } = useBugHunt()
  const activeBugHunts = getActiveBugHunts() || []

  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedRewardType, setSelectedRewardType] = useState("all") 
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Bug hunt filtering logic
  const filteredBugHunts = useMemo(() => {
    let filtered = [...activeBugHunts]

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(hunt => hunt.difficulty === selectedDifficulty)
    }

    if (selectedRewardType !== "all") {
      filtered = filtered.filter(hunt => hunt.rewardTypes?.includes(selectedRewardType as any))
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(hunt => hunt.status === selectedStatus)
    }

    // Sort bug hunts
    if (sortBy === "oldest") {
      filtered = [...filtered].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    } else if (sortBy === "deadline") {
      filtered = [...filtered].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    }

    return filtered
  }, [activeBugHunts, selectedDifficulty, selectedRewardType, selectedStatus, sortBy])

  const handleClearFilters = () => {
    setSelectedDifficulty("all")
    setSelectedRewardType("all")
    setSelectedStatus("all")
  }

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="mb-6 lg:mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-primary">
                Bug Hunts
              </h1>
              <p className="text-muted-foreground">
                Discover active bug bounty programs and competitions
              </p>
            </div>
            {user?.role === 'admin' && (
              <Button onClick={() => router.push('/admin/bug-hunts')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Hunt
              </Button>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="mb-6">
            <BugHuntFilterControls
              selectedDifficulty={selectedDifficulty}
              selectedRewardType={selectedRewardType}
              selectedStatus={selectedStatus}
              sortBy={sortBy}
              onDifficultyChange={setSelectedDifficulty}
              onRewardTypeChange={setSelectedRewardType}
              onStatusChange={setSelectedStatus}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
              totalCount={activeBugHunts.length}
              filteredCount={filteredBugHunts.length}
            />
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
          >
            {filteredBugHunts.map((hunt, index) => (
              <BugHuntCard key={hunt.id} hunt={hunt} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredBugHunts.length === 0 && (
          <FadeIn delay={0.3}>
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">No bug hunts found</div>
              <p className="text-sm text-muted-foreground mb-4">
                {activeBugHunts.length === 0 
                  ? "No active bug hunts available at the moment" 
                  : "Try adjusting your filters to see more results"
                }
              </p>
              {activeBugHunts.length > 0 && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  )
}
