import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, MessageCircle, Bookmark, Clock, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ClientDashboard() {
  const { profile } = useAuth()
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [savedTrainers, setSavedTrainers] = useState([])
  const [recentMessages, setRecentMessages] = useState([])
  const [nearbyTrainers, setNearbyTrainers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile) return

    try {
      const [bookingsRes, savedRes, messagesRes, trainersRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            trainer:profiles!bookings_trainer_id_fkey(id, name, avatar)
          `)
          .eq('client_id', profile.id)
          .in('status', ['confirmed', 'pending'])
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(5),

        supabase
          .from('saved_trainers')
          .select(`
            trainer:profiles!saved_trainers_trainer_id_fkey(id, name, avatar, location)
          `)
          .eq('client_id', profile.id)
          .limit(4),

        loadRecentMessages(),

        supabase
          .from('profiles')
          .select('id, name, avatar, location, headline')
          .eq('role', 'trainer')
          .limit(4),
      ])

      setUpcomingBookings(bookingsRes.data || [])
      setSavedTrainers((savedRes.data || []).map(s => s.trainer))
      setRecentMessages(messagesRes)
      setNearbyTrainers(trainersRes.data || [])
    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentMessages = async () => {
    const { data: conversations } = await supabase
      .from('conversations')
      .select(`
        id,
        updated_at,
        trainer:profiles!conversations_trainer_id_fkey(id, name, avatar),
        messages(id, text, created_at, sender_id)
      `)
      .eq('client_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(3)

    return (conversations || []).map(c => ({
      id: c.id,
      trainer: c.trainer,
      lastMessage: c.messages?.[0]?.text || '',
      timestamp: c.updated_at,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  const formatDate = (date, time) => {
    const d = new Date(`${date}T${time}`)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) return `Today at ${time}`
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow at ${time}`
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {profile?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 dark:text-gray-400">Find your perfect trainer</p>
      </div>

      <Link
        to="/search"
        className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Search className="w-5 h-5 text-gray-400" />
        <span className="text-gray-500 dark:text-gray-400">Search trainers...</span>
      </Link>

      {upcomingBookings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Sessions
          </h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/messages`}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <img
                  src={booking.trainer?.avatar}
                  alt={booking.trainer?.name}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{booking.trainer?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(booking.scheduled_date, booking.scheduled_time)}
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
                </div>
              </Link>
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
                  src={msg.trainer?.avatar}
                  alt={msg.trainer?.name}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{msg.trainer?.name}</p>
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

      {savedTrainers.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Saved Trainers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {savedTrainers.map((trainer) => (
              <Link
                key={trainer.id}
                to={`/trainer/${trainer.id}`}
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <img
                  src={trainer.avatar}
                  alt={trainer.name}
                  className="w-16 h-16 rounded-full mx-auto mb-2 bg-gray-100 dark:bg-gray-800"
                />
                <p className="font-medium text-sm">{trainer.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{trainer.location}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Featured Trainers</h2>
          <Link to="/search" className="text-sm text-gray-500 hover:text-black dark:hover:text-white">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nearbyTrainers.map((trainer) => (
            <Link
              key={trainer.id}
              to={`/trainer/${trainer.id}`}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  src={trainer.avatar}
                  alt={trainer.name}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{trainer.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {trainer.headline || trainer.location}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
