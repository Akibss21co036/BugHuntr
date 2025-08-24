import { type RankTier, RANK_CONFIGS } from "@/types/ranking"

interface RankBadgeProps {
  rank: RankTier
  size?: "sm" | "md" | "lg"
  showDescription?: boolean
}

export function RankBadge({ rank, size = "md", showDescription = false }: RankBadgeProps) {
  const config = RANK_CONFIGS[rank]

  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-lg",
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
        ${sizeClasses[size]} 
        ${config.bgColor} 
        ${config.color} 
        rounded-full 
        flex items-center justify-center 
        font-bold 
        border-2 border-current
      `}
      >
        {rank}
      </div>
      {showDescription && <span className={`${config.color} font-medium`}>{config.description}</span>}
    </div>
  )
}
