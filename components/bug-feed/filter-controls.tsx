"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, SortAsc, X } from "lucide-react"

interface FilterControlsProps {
  selectedSeverity: string
  selectedCategory: string
  selectedRewardType?: string
  sortBy: string
  onSeverityChange: (severity: string) => void
  onCategoryChange: (category: string) => void
  onRewardTypeChange?: (rewardType: string) => void
  onSortChange: (sort: string) => void
  onClearFilters: () => void
  totalCount: number
  filteredCount: number
  showRewardFilter?: boolean
  user?: { role: string; companyName?: string } | null
}

const severityOptions = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "Web Application", label: "Web Application" },
  { value: "API", label: "API" },
  { value: "Mobile", label: "Mobile" },
  { value: "Network", label: "Network" },
  { value: "Infrastructure", label: "Infrastructure" },
]

const rewardTypeOptions = [
  { value: "all", label: "All Rewards" },
  { value: "cash", label: "Cash" },
  { value: "certificates", label: "Certificates" },
  { value: "internship", label: "Internship" },
  { value: "jobs", label: "Jobs" },
]

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "severity", label: "Severity" },
  { value: "bounty", label: "Highest Bounty" },
]

export function FilterControls({
  selectedSeverity,
  selectedCategory,
  selectedRewardType = "all",
  sortBy,
  onSeverityChange,
  onCategoryChange,
  onRewardTypeChange,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount,
  showRewardFilter = false,
  user,
}: FilterControlsProps) {
  const hasActiveFilters = selectedSeverity !== "all" || selectedCategory !== "all" || (showRewardFilter && selectedRewardType !== "all")

  // Filter severity options based on user role and company
  const availableSeverityOptions = severityOptions.filter((option) => {
    // Show all options to company admins (they're already filtered by company at data level)
    if (user?.role === "admin" && user?.companyName) {
      return true;
    }
    // For non-admin users, only show "all", "medium", and "low"
    if (option.value === "all" || option.value === "medium" || option.value === "low") {
      return true;
    }
    // Hide "critical" and "high" from non-admin users
    return false;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedSeverity} onValueChange={onSeverityChange}>
            <SelectTrigger className="w-32 sm:w-40 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSeverityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-36 sm:w-44 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showRewardFilter && onRewardTypeChange && (
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
          )}

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
          Showing {filteredCount} of {totalCount} vulnerabilities
        </div>
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedSeverity !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-20">{selectedSeverity}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onSeverityChange("all")} />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-24">{selectedCategory}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onCategoryChange("all")} />
              </Badge>
            )}
            {showRewardFilter && selectedRewardType !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="truncate max-w-24">{selectedRewardType}</span>
                <X className="h-3 w-3 cursor-pointer shrink-0" onClick={() => onRewardTypeChange?.("all")} />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
