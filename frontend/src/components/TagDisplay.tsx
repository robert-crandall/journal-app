import { Tag, Hash, Heart, TrendingUp } from 'lucide-react'
import { ContentTag, ToneTag, CharacterStat } from '@/types'

interface TagDisplayProps {
  contentTags?: ContentTag[]
  toneTags?: ToneTag[]
  characterStats?: (CharacterStat & { xpGained: number })[]
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TagDisplay({ 
  contentTags = [], 
  toneTags = [], 
  characterStats = [], 
  size = 'md',
  className = '' 
}: TagDisplayProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5', 
    lg: 'text-base px-4 py-2'
  }

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (contentTags.length === 0 && toneTags.length === 0 && characterStats.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Content Tags */}
      {contentTags.map((tag) => (
        <span
          key={tag.id}
          className={`badge badge-primary badge-outline ${sizeClasses[size]} flex items-center gap-1`}
          title="Content Tag"
        >
          <Hash className={iconSize[size]} />
          {tag.name}
        </span>
      ))}

      {/* Tone Tags */}
      {toneTags.map((tag) => (
        <span
          key={tag.id}
          className={`badge badge-secondary badge-outline ${sizeClasses[size]} flex items-center gap-1`}
          title="Tone Tag"
        >
          <Heart className={iconSize[size]} />
          {tag.name}
        </span>
      ))}

      {/* Character Stats */}
      {characterStats.map((stat) => (
        <span
          key={stat.id}
          className={`badge badge-accent badge-outline ${sizeClasses[size]} flex items-center gap-1`}
          title={`Character Stat: +${stat.xpGained} XP`}
        >
          <TrendingUp className={iconSize[size]} />
          {stat.name}
          {stat.xpGained > 0 && (
            <span className="text-xs font-bold">+{stat.xpGained}</span>
          )}
        </span>
      ))}
    </div>
  )
}
