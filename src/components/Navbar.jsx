import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, LogOut, Settings, Search, Calendar, MessageCircle, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { profile, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setProfileOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const linkClass = (path) => `
    relative px-2 py-1 transition-colors
    ${isActive(path)
      ? 'text-black dark:text-white'
      : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
    }
    after:absolute after:bottom-0 after:left-0 after:h-px after:bg-current after:transition-all
    ${isActive(path) ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
  `

  const getDashboardLink = () => {
    if (!profile) return '/'
    return profile.role === 'client' ? '/dashboard' : '/trainer'
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm pt-[env(safe-area-inset-top,0)]">
      <div className="max-w-7xl mx-auto px-4 pl-[env(safe-area-inset-left,1rem)] pr-[env(safe-area-inset-right,1rem)]">
        <div className="flex items-center justify-between h-14">
          <Link to={profile ? getDashboardLink() : '/'} className="text-lg font-semibold tracking-tight">
            P-Train
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {profile ? (
              profile.role === 'client' ? (
                <>
                  <Link to="/search" className={linkClass('/search')}>Find Trainers</Link>
                  <Link to="/messages" className={linkClass('/messages')}>Messages</Link>
                </>
              ) : (
                <>
                  <Link to="/trainer" className={linkClass('/trainer')}>Dashboard</Link>
                  <Link to="/trainer/listings" className={linkClass('/trainer/listings')}>Listings</Link>
                  <Link to="/messages" className={linkClass('/messages')}>Messages</Link>
                </>
              )
            ) : (
              <>
                <Link to="/" className={linkClass('/')}>Home</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800"
                  />
                  <span className="text-sm">{profile.name?.split(' ')[0]}</span>
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <User size={16} />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom,0)]">
          <div className="px-4 py-4 space-y-2 pl-[env(safe-area-inset-left,1rem)] pr-[env(safe-area-inset-right,1rem)]">
            {profile ? (
              profile.role === 'client' ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded ${isActive('/dashboard') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/search') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <Search size={18} />
                    Find Trainers
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/messages') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <MessageCircle size={18} />
                    Messages
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/profile') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/trainer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded ${isActive('/trainer') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/trainer/listings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/trainer/listings') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <Briefcase size={18} />
                    Listings
                  </Link>
                  <Link
                    to="/trainer/availability"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/trainer/availability') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <Calendar size={18} />
                    Availability
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/messages') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <MessageCircle size={18} />
                    Messages
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${isActive('/profile') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                  >
                    <User size={18} />
                    Profile
                  </Link>
                </>
              )
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 rounded ${isActive('/') ? 'bg-gray-100 dark:bg-gray-900' : ''}`}
                >
                  Home
                </Link>
              </>
            )}

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              {profile ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900 text-red-500"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-900 font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
