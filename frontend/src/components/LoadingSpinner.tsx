'use client'

import { LoadingSpinnerProps } from '@/types'
import { cn } from '@/utils'

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }

  return (
    <div className={cn('flex justify-center items-center p-4', className)}>
      <span className={cn('loading loading-spinner', sizeClasses[size])}></span>
    </div>
  )
}

export default LoadingSpinner
