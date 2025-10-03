"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, SortAsc, X } from "lucide-react"

interface BugHuntFilterControlsProps {
  selectedDifficulty: string
  selectedRewardType: string
  selectedStatus: string
  sortBy: string
  onDifficultyChange: (difficulty: string) => void
  onRewardTypeChange: (rewardType: string) => void
  onStatusChange: (status: string) => void
  onSortChange: (sort: string) => void
  onClearFilters: () => void
  totalCount: number
  filteredCount: number
}

const difficultyOptions = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
]

const rewardTypeOptions = [
  { value: "all", label: "All Rewards" },
  { value: "cash", label: "Cash" },
  { value: "certificates", label: "Certificates" },
  { value: "internship", label: "Internship" },
  { value: "jobs", label: "Jobs" },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
]

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "difficulty", label: "Difficulty" },
  { value: "endDate", label: "Ending Soon" },
]

export function BugHuntFilterControls({
  selectedDifficulty,
  selectedRewardType,
  selectedStatus,
  sortBy,
  onDifficultyChange,
  onRewardTypeChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
}: BugHuntFilterControlsProps) {
  const hasActiveFilters = selectedDifficulty !== "all" || selectedRewardType !== "all" || selectedStatus !== "all"

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
            <SelectTrigger className="w-32 sm:w-40 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRewardType} onValueChange={onRewardTypeChange}>
            <SelectTrigger className="w-32 sm:w-40 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rewardTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-32 sm:w-40 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1 bg-transparent shrink-0">
              <X className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 shrink-0">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium hidden sm:inline">Sort:</span>
          </div>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-28 sm:w-36 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} bug hunts
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedDifficulty !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-20">{selectedDifficulty}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onDifficultyChange("all")} />
              </Badge>
            )}
            {selectedRewardType !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-24">{selectedRewardType}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onRewardTypeChange("all")} />
              </Badge>
            )}
            {selectedStatus !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-24">{selectedStatus}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onStatusChange("all")} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}