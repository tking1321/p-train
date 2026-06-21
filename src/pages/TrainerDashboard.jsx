import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MessageCircle, DollarSign, Users, Clock, ChevronRight, Plus, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/theme'

export default function TrainerDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    activeListings: 0,
    pendingBookings: 0,
    totalClients: 0,
    monthlyEarnings: 0,
  })
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile) return

    try {
      const [bookingsRes, listingsRes, conversationsRes, clientsRes, paymentsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            client:profiles!bookings_client_id_fkey(id, name, avatar)
          `)
          .eq('trainer_id', profile.id)
          .in('status', ['pending', 'confirmed'])
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(5),

        supabase
          .from('listings')
          .select('*')
          .eq('trainer_id', profile.id)
          .eq('is_active', true),

        supabase
          .from('conversations')
          .select(`
            id,
            updated_at,
            client:profiles!conversations_client_id_fkey(id, name, avatar),
            messages(id, text, created_at, sender_id)
          `)
          .eq('trainer_id', profile.id)
          .order('updated_at', { ascending: false })
          .limit(3),

        supabase
          .from('bookings')
          .select('client_id', { count: 'exact', head: true })
          .eq('trainer_id', profile.id),

        supabase
          .from('earnings_ledger')
          .select('net_amount')
          .eq('trainer_id', profile.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])

      setUpcomingBookings(bookingsRes.data || [])
      setListings(listingsRes.data || [])
      setRecentMessages((conversationsRes.data || []).map(c => ({
        id: c.id,
        client: c.client,
        lastMessage: c.messages?.[0]?.text || '',
        timestamp: c.updated_at,
      })))

      setStats({
        activeListings: listingsRes.data?.length || 0,
        pendingBookings: (bookingsRes.data || []).filter(b => b.status === 'pending').length,
        totalClients: new Set((bookingsRes.data || []).map(b => b.client_id)).size,
        monthlyEarnings: (paymentsRes.data || []).reduce((sum, p) => sum + (p.net_amount || 0), 0),
      })
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  const statCards = [
    { label: 'Active Listings', value: stats.activeListings, icon: Users, href: '/trainer/listings' },
    { label: 'Pending Requests', value: stats.pendingBookings, icon: Clock, color: 'text-yellow-500' },
    { label: 'Total Clients', value: stats.totalClients, icon: Users },
    { label: 'This Month', value: formatCurrency(stats.monthlyEarnings), icon: DollarSign, color: 'text-green-500', href: '/trainer/income' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {profile?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your training business</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          stat.href ? (
            <Link
              key={stat.label}
              to={stat.href}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color || 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Link>
          ) : (
            <div
              key={stat.label}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color || 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          )
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/trainer/listings/new"
          className="p-4 flex flex-col items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black rounded-xl"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">New Listing</span>
        </Link>
        <Link
          to="/trainer/calendar"
          className="p-4 flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm font-medium">Calendar</span>
        </Link>
        <Link
          to="/trainer/income"
          className="p-4 flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-sm font-medium">Income</span>
        </Link>
        <Link
          to="/messages"
          className="p-4 flex flex-col items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm font-medium">Messages</span>
        </Link>
      </div>

      {upcomingBookings.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions
            </h2>
            <Link to="/trainer/bookings" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
              >
                <img
                  src={booking.client?.avatar}
                  alt={booking.client?.name}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{booking.client?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} at {booking.scheduled_time}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {booking.status}
                  </span>
                  {booking.status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          await supabase
                            .from('bookings')
                            .update({ status: 'confirmed' })
                            .eq('id', booking.id)
                          loadDashboardData()
                        }}
                        className="text-xs px-2 py-1 bg-black dark:bg-white text-white dark:text-black rounded"
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentMessages.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Recent Messages
            </h2>
            <Link to="/messages" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentMessages.map((msg) => (
              <Link
                key={msg.id}
                to={`/messages/${msg.id}`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <img
                  src={msg.client?.avatar}
                  alt={msg.client?.name}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{msg.client?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {msg.lastMessage}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your Listings</h2>
          <Link to="/trainer/listings" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
            Manage all
          </Link>
        </div>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.slice(0, 4).map((listing) => (
              <Link
                key={listing.id}
                to={`/trainer/listings/${listing.id}`}
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{listing.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{listing.listing_type.replace('_', ' ')}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(listing.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            to="/trainer/listings/new"
            className="block p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">Create your first listing</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Start offering your training services
            </p>
          </Link>
        )}
      </section>
    </div>
  )
}
