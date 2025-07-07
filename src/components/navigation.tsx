'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { ThemeToggle } from './theme-toggle'
import { User, LogOut, Home, Settings } from 'lucide-react'

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <nav className="navbar bg-base-100 border-b border-base-300 shadow-lg">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
          LifeRPG
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/" className="gap-2">
              <Home size={16} />
              Dashboard
            </Link>
          </li>
          {session && (
            <>
              <li>
                <Link href="/character" className="gap-2">
                  <User size={16} />
                  Character
                </Link>
              </li>
              <li>
                <Link href="/settings" className="gap-2">
                  <Settings size={16} />
                  Settings
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <ThemeToggle />
        
        {status === 'loading' ? (
          <div className="loading loading-spinner loading-sm"></div>
        ) : session ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {session.user?.name?.[0] || 'U'}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">
                <span>{session.user?.name}</span>
              </li>
              <li>
                <Link href="/character">Character</Link>
              </li>
              <li>
                <Link href="/settings">Settings</Link>
              </li>
              <li>
                <button onClick={() => signOut()} className="gap-2">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="gap-2 flex">
            <Link href="/auth/signin" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
