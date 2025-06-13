'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Palette } from 'lucide-react'
import { themeUtils, storageUtils } from '@/utils'

const themes = [
  { name: 'Light', value: 'light' as const, icon: Sun },
  { name: 'Dark', value: 'dark' as const, icon: Moon },
  { name: 'Dracula', value: 'dracula' as const, icon: Palette },
]

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'dracula'>('light')

  useEffect(() => {
    // Load saved theme or default to system preference
    const savedTheme = storageUtils.get('theme', themeUtils.getSystemTheme())
    setCurrentTheme(savedTheme)
    themeUtils.applyTheme(savedTheme)
  }, [])

  const handleThemeChange = (theme: 'light' | 'dark' | 'dracula') => {
    setCurrentTheme(theme)
    themeUtils.applyTheme(theme)
    storageUtils.set('theme', theme)
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle" aria-label="Change theme">
        {(() => {
          const theme = themes.find(t => t.value === currentTheme)
          const Icon = theme?.icon || Sun
          return <Icon className="h-5 w-5" />
        })()}
      </div>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        {themes.map((theme) => {
          const Icon = theme.icon
          return (
            <li key={theme.value}>
              <button
                onClick={() => handleThemeChange(theme.value)}
                className={`flex items-center gap-2 ${currentTheme === theme.value ? 'active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {theme.name}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ThemeToggle
