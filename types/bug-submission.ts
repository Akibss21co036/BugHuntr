export interface BugSubmission {
  id: string
  huntId: string
  huntTitle: string
  title: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  stepsToReproduce: string
  impact: string
  proofOfConcept?: string
  attachments: string[]
  submittedBy: string
  submittedAt: string
  status: "pending" | "approved" | "rejected" | "under-review"
  adminNotes?: string
  pointsAwarded?: number
  reviewedBy?: string
  reviewedAt?: string
}

export interface BugSubmissionFilters {
  status: string
  severity: string
  huntId: string
  sortBy: string
}
