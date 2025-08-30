import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProfileSkeleton() {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-20 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
