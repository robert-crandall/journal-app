'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  FlaskConical, 
  TrendingUp, 
  User, 
  Menu, 
  X,
  LogOut 
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/utils'

interface NavigationProps {
  currentPath?: string
}

const navigationItems = [
  {
    name: 'Journal',
    href: '/dashboard/journal',
    icon: BookOpen,
    description: 'Write and reflect on your day'
  },
  {
    name: 'Experiments',
    href: '/dashboard/experiments',
    icon: FlaskConical,
    description: 'Track your self-improvement experiments'
  },
  {
    name: 'Character Stats',
    href: '/dashboard/character-stats',
    icon: TrendingUp,
    description: 'View your personal development progress'
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
    description: 'Manage your account settings'
  }
]

export function Navigation({ currentPath }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const user = auth.getUser()

  const handleLogout = () => {
    auth.logout()
    router.push('/auth/login')
  }

  return (
    <nav className="bg-base-100 border-b border-base-200 sticky top-0 z-50">
      <div className="container-responsive">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-lg sm:text-xl font-bold text-base-content">Journal</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-base-content hover:bg-base-200'
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            {/* User menu */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar btn-sm sm:btn-md">
                <div className="w-8 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium text-sm sm:text-base">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-200">
                <li>
                  <div className="flex flex-col px-4 py-2 text-sm">
                    <span className="font-medium truncate">{user?.username}</span>
                    <span className="text-base-content/60 text-xs truncate">{user?.email}</span>
                  </div>
                </li>
                <div className="divider my-0"></div>
                <li>
                  <Link href="/dashboard/profile" className="text-sm">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="text-error text-sm">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden btn btn-ghost btn-circle btn-sm sm:btn-md"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-base-200 bg-base-100 animate-slide-up">
          <div className="container-responsive py-2">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-3 rounded-md font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content hover:bg-base-200'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-base-content/60 truncate">{item.description}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
