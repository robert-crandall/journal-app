'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ErrorMessageProps } from '@/types'
import { cn } from '@/utils'

export function ErrorMessage({ 
  message, 
  onRetry, 
  className 
}: ErrorMessageProps) {
  return (
    <div className={cn('alert alert-error', className)}>
      <AlertTriangle className="h-6 w-6" />
      <div className="flex-1">
        <h3 className="font-bold">Something went wrong</h3>
        <div className="text-xs">{message}</div>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn btn-sm btn-outline"
          aria-label="Retry"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
