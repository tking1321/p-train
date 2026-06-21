import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, MessageCircle, User,
  Clock, CheckCircle, XCircle, Calendar as CalendarIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { c, formatCurrency } from '../lib/theme'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toDateStr(date) {
  return date.toISOString().split('T')[0]
}

const STATUS_STYLES = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  completed: 'bg-gray-400',
}

export default function TrainerCalendarPage() {
  const { profile } = useAuth()
  const today = new Date()

  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [bookings, setBookings] = useState([])
  const [availability, setAvailability] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const startOfRange = view === 'month'
      ? new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      : (() => {
          const d = new Date(cursor)
          d.setDate(d.getDate() - d.getDay())
          return d
        })()
    const endOfRange = view === 'month'
      ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
      : (() => {
          const d = new Date(startOfRange)
          d.setDate(d.getDate() + 6)
          return d
        })()

    const [bookingsRes, availRes, blockedRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id, scheduled_date, scheduled_time, status, payment_status,
          listing:listings(title, price),
          client:profiles!bookings_client_id_fkey(id, name, avatar)
        `)
        .eq('trainer_id', profile.id)
        .gte('scheduled_date', toDateStr(startOfRange))
        .lte('scheduled_date', toDateStr(endOfRange))
        .order('scheduled_date')
        .order('scheduled_time'),

      supabase
        .from('availability')
        .select('*')
        .eq('trainer_id', profile.id),

      supabase
        .from('blocked_dates')
        .select('date, reason')
        .eq('trainer_id', profile.id)
        .gte('date', toDateStr(startOfRange))
        .lte('date', toDateStr(endOfRange)),
    ])

    setBookings(bookingsRes.data || [])
    setAvailability(availRes.data || [])
    setBlockedDates(blockedRes.data || [])
    setLoading(false)
  }, [profile, cursor, view])

  useEffect(() => { loadData() }, [loadData])

  const bookingsByDate = bookings.reduce((acc, b) => {
    const d = b.scheduled_date
    acc[d] = acc[d] || []
    acc[d].push(b)
    return acc
  }, {})

  const blockedSet = new Set(blockedDates.map(b => b.date))

  const dayAvailabilityMap = availability.reduce((acc, a) => {
    acc[a.day_of_week] = a
    return acc
  }, {})

  const handleAccept = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)
    loadData()
    setSelectedBooking(prev => prev?.id === bookingId ? { ...prev, status: 'confirmed' } : prev)
  }

  const handleDecline = async (bookingId) => {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)
    loadData()
    setSelectedBooking(null)
  }

  // ── Month view ──────────────────────────────────────────────────
  const renderMonth = () => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const cells = []

    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

    const dayBookings = (date) => date ? (bookingsByDate[toDateStr(date)] || []) : []
    const isBlocked = (date) => date ? blockedSet.has(toDateStr(date)) : false
    const isAvailable = (date) => {
      if (!date) return false
      const a = dayAvailabilityMap[date.getDay()]
      return a?.is_available
    }

    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className={`py-2 text-center text-xs font-medium ${c.muted}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-[#2a2a2a] rounded-xl overflow-hidden border border-gray-100 dark:border-[#2a2a2a]">
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="bg-white dark:bg-[#0f0f0f] min-h-[80px]" />
            const dbs = dayBookings(date)
            const blocked = isBlocked(date)
            const avail = isAvailable(date)
            const isToday = isSameDay(date, today)
            const isSelected = selectedDay && isSameDay(date, selectedDay)

            return (
              <div
                key={date.toString()}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className={`bg-white dark:bg-[#0f0f0f] min-h-[80px] p-1 cursor-pointer transition-colors
                  ${isSelected ? 'ring-2 ring-inset ring-black dark:ring-white' : ''}
                  ${blocked ? 'bg-red-50 dark:bg-red-950/20' : avail ? '' : ''}
                  hover:bg-gray-50 dark:hover:bg-[#1a1a1a]`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'}`}>
                    {date.getDate()}
                  </span>
                  {blocked && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                  {!blocked && avail && dbs.length === 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dbs.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedBooking(b) }}
                      className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white cursor-pointer
                        ${STATUS_STYLES[b.status] || 'bg-gray-400'}`}
                    >
                      {b.scheduled_time?.slice(0, 5)} {b.client?.name?.split(' ')[0]}
                    </div>
                  ))}
                  {dbs.length > 3 && (
                    <div className="text-[10px] text-gray-400 px-1">+{dbs.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Week view ───────────────────────────────────────────────────
  const renderWeek = () => {
    const startOfWeek = new Date(cursor)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      return d
    })

    const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7am to 8pm

    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-8 mb-1">
            <div />
            {weekDays.map(d => {
              const isToday = isSameDay(d, today)
              return (
                <div key={d.toString()} className="text-center py-2">
                  <div className={`text-xs ${c.muted}`}>{DAYS[d.getDay()]}</div>
                  <div className={`text-sm font-medium mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-0.5
                    ${isToday ? 'bg-black dark:bg-white text-white dark:text-black' : ''}`}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div className={`border ${c.border} rounded-xl overflow-hidden`}>
            {HOURS.map(hour => (
              <div key={hour} className={`grid grid-cols-8 border-b last:border-b-0 ${c.border}`}>
                <div className={`py-3 px-2 text-right text-xs ${c.muted} border-r ${c.border}`}>
                  {hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}
                </div>
                {weekDays.map(d => {
                  const dateStr = toDateStr(d)
                  const dbs = (bookingsByDate[dateStr] || []).filter(b => {
                    const mins = timeToMinutes(b.scheduled_time)
                    return mins >= hour * 60 && mins < (hour + 1) * 60
                  })
                  const blocked = blockedSet.has(dateStr)

                  return (
                    <div
                      key={d.toString()}
                      className={`relative min-h-[48px] border-r last:border-r-0 ${c.border}
                        ${blocked ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}
                    >
                      {dbs.map(b => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          className={`m-0.5 px-1 py-0.5 rounded text-[10px] text-white leading-tight cursor-pointer
                            ${STATUS_STYLES[b.status] || 'bg-gray-400'}`}
                        >
                          <div className="font-medium truncate">{b.client?.name?.split(' ')[0]}</div>
                          <div className="opacity-80">{b.scheduled_time?.slice(0, 5)}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Navigation ──────────────────────────────────────────────────
  const navigatePrev = () => {
    if (view === 'month') {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
    } else {
      const d = new Date(cursor)
      d.setDate(d.getDate() - 7)
      setCursor(d)
    }
    setSelectedDay(null)
  }

  const navigateNext = () => {
    if (view === 'month') {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
    } else {
      const d = new Date(cursor)
      d.setDate(d.getDate() + 7)
      setCursor(d)
    }
    setSelectedDay(null)
  }

  const navigateToday = () => {
    setCursor(view === 'month'
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today))
    setSelectedDay(null)
  }

  const getTitle = () => {
    if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    const start = new Date(cursor)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`
    }
    return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
  }

  // ── Selected day sessions panel ─────────────────────────────────
  const selectedDayBookings = selectedDay ? (bookingsByDate[toDateStr(selectedDay)] || []) : []

  return (
    <div className={c.page}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={c.heading1}>Calendar</h1>
          <p className={c.muted}>Your sessions, availability, and blocked dates</p>
        </div>
        <Link to="/trainer/availability" className={c.btnSecondary + ' hidden md:inline-flex'}>
          Manage Availability
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button onClick={navigatePrev} className={c.btnGhost + ' p-2'}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-semibold min-w-[200px] text-center">{getTitle()}</h2>
              <button onClick={navigateNext} className={c.btnGhost + ' p-2'}>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={navigateToday} className={`${c.btnSecondary} py-1.5 px-3 text-sm`}>
                Today
              </button>
            </div>

            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
              {['month', 'week'].map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedDay(null) }}
                  className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors
                    ${view === v
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'bg-white dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            {[
              { color: 'bg-green-500', label: 'Confirmed' },
              { color: 'bg-yellow-500', label: 'Pending' },
              { color: 'bg-red-500', label: 'Cancelled' },
              { color: 'bg-green-400', label: 'Available' },
              { color: 'bg-red-400', label: 'Blocked' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className={c.tiny}>{label}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
            </div>
          ) : (
            view === 'month' ? renderMonth() : renderWeek()
          )}
        </div>

        {/* Side panel */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-4">
          {/* Selected day detail */}
          {selectedDay && (
            <div className={c.card + ' p-4'}>
              <h3 className={c.heading3 + ' mb-3'}>
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {blockedSet.has(toDateStr(selectedDay)) && (
                <div className="mb-3 flex items-center gap-2 text-red-500 text-sm">
                  <XCircle className="w-4 h-4" />
                  Blocked date
                </div>
              )}
              {selectedDayBookings.length === 0 ? (
                <p className={c.muted}>No sessions scheduled</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayBookings.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className={`w-full text-left p-3 rounded-lg border ${c.border} hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[b.status]}`} />
                        <span className="text-sm font-medium">{b.scheduled_time?.slice(0, 5)}</span>
                        <span className={c.muted + ' text-sm'}>{b.client?.name}</span>
                      </div>
                      {b.listing?.title && (
                        <p className={c.tiny + ' mt-1 ml-4'}>{b.listing.title}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking detail */}
          {selectedBooking && (
            <div className={c.card + ' p-4'}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={c.heading3}>Session Details</h3>
                <button onClick={() => setSelectedBooking(null)} className={c.btnGhost + ' p-1'}>
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {selectedBooking.client?.avatar ? (
                  <img
                    src={selectedBooking.client.avatar}
                    alt={selectedBooking.client.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedBooking.client?.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedBooking.status === 'confirmed' ? c.badgeGreen :
                    selectedBooking.status === 'pending' ? c.badgeYellow :
                    selectedBooking.status === 'cancelled' ? c.badgeRed : c.badgeGray
                  }`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span>{new Date(selectedBooking.scheduled_date + 'T00:00').toLocaleDateString('en-US', {
                    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                  })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.scheduled_time?.slice(0, 5)}</span>
                </div>
                {selectedBooking.listing?.title && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span>{selectedBooking.listing.title}</span>
                  </div>
                )}
                {selectedBooking.listing?.price && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 text-gray-400 text-center font-bold text-xs">$</span>
                    <span>{formatCurrency(selectedBooking.listing.price)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {selectedBooking.client?.id && (
                  <Link
                    to={`/messages`}
                    className={c.btnSecondary + ' flex-1 justify-center text-sm py-2'}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Link>
                )}
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAccept(selectedBooking.id)}
                      className={c.btnPrimary + ' flex-1 justify-center text-sm py-2'}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(selectedBooking.id)}
                      className={c.btnDanger + ' text-sm py-2 px-3'}
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Upcoming this week */}
          {!selectedDay && !selectedBooking && (
            <div className={c.card + ' p-4'}>
              <h3 className={c.heading3 + ' mb-3'}>Upcoming Sessions</h3>
              {bookings.filter(b => {
                const d = new Date(b.scheduled_date + 'T00:00')
                return d >= today && b.status !== 'cancelled'
              }).slice(0, 5).map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="w-full text-left flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-lg px-2 -mx-2 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_STYLES[b.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.client?.name}</p>
                    <p className={c.tiny}>
                      {new Date(b.scheduled_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {b.scheduled_time?.slice(0, 5)}
                    </p>
                  </div>
                </button>
              ))}
              {bookings.filter(b => new Date(b.scheduled_date + 'T00:00') >= today).length === 0 && (
                <p className={c.muted}>No upcoming sessions</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
