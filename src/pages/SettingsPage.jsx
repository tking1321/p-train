import { useState } from 'react'
import { Moon, Sun, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { profile } = useAuth()
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'))

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)

    if (newMode) {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
      localStorage.setItem('ptrain_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      localStorage.setItem('ptrain_theme', 'light')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <span>Dark Mode</span>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors ${
                darkMode ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  darkMode ? 'right-1 bg-white dark:bg-black' : 'left-1 bg-white'
                }`} />
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4">
            <h2 className="font-semibold mb-2">Account</h2>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-1">Role: {profile?.role}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4">
            <h2 className="font-semibold mb-2">About P-Train</h2>
            <p className="text-sm text-gray-500">
              P-Train connects clients with personal trainers for in-person and online sessions.
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400 mt-8">
        Version 1.0.0
      </p>
    </div>
  )
}
