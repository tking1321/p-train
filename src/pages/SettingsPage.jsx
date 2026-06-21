import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { c } from '../lib/theme'

export default function SettingsPage() {
  const { profile, setTheme } = useAuth()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDarkMode = () => {
    const next = !isDark
    setIsDark(next)
    setTheme(next ? 'dark' : 'light')
  }

  return (
    <div className={c.pageNarrow}>
      <h1 className={c.heading1 + ' mb-6'}>Settings</h1>

      <div className="space-y-3">
        <div className={c.card + ' overflow-hidden'}>
          <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div className="text-left">
                  <p className="font-medium text-sm">Dark Mode</p>
                  <p className={c.tiny}>{isDark ? 'Currently dark' : 'Currently light'}</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                isDark ? 'bg-black dark:bg-white' : 'bg-gray-200'
              }`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  isDark ? 'translate-x-5 bg-white dark:bg-black' : 'translate-x-1 bg-white'
                }`} />
              </div>
            </button>
          </div>
        </div>

        <div className={c.card + ' p-4'}>
          <h2 className={c.heading3 + ' mb-2'}>Account</h2>
          <p className={c.body}>{profile?.email}</p>
          <p className={c.tiny + ' mt-1 capitalize'}>Role: {profile?.role?.replace(/_/g, ' ')}</p>
        </div>

        <div className={c.card + ' p-4'}>
          <h2 className={c.heading3 + ' mb-2'}>About P-Train</h2>
          <p className={c.body}>
            P-Train connects clients with personal trainers for in-person and online sessions.
          </p>
        </div>
      </div>

      <p className={c.tiny + ' text-center mt-8'}>Version 1.0.0</p>
    </div>
  )
}
