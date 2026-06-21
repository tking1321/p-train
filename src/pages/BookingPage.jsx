import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Calendar, Clock, MapPin, CreditCard, ChevronLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function BookingPage() {
  const { trainerId, listingId } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [trainer, setTrainer] = useState(null)
  const [listing, setListing] = useState(null)
  const [listings, setListings] = useState([])
  const [availability, setAvailability] = useState([])
  const [blockedDates, setBlockedDates] = useState([])

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedListing, setSelectedListing] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBookingData()
  }, [trainerId])

  const loadBookingData = async () => {
    try {
      const [trainerRes, listingsRes, availRes, blockedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, avatar, location, headline')
          .eq('id', trainerId)
          .single(),

        supabase
          .from('listings')
          .select('*')
          .eq('trainer_id', trainerId)
          .eq('is_active', true),

        supabase
          .from('availability')
          .select('*')
          .eq('trainer_id', trainerId),

        supabase
          .from('blocked_dates')
          .select('blocked_date')
          .eq('trainer_id', trainerId),
      ])

      setTrainer(trainerRes.data)
      setListings(listingsRes.data || [])
      setAvailability(availRes.data || [])
      setBlockedDates((blockedRes.data || []).map(b => b.blocked_date))

      if (listingId) {
        const specificListing = listingsRes.data?.find(l => l.id === listingId)
        if (specificListing) {
          setListing(specificListing)
          setSelectedListing(specificListing)
        }
      }

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setSelectedDate(tomorrow.toISOString().split('T')[0])
    } catch (error) {
      console.error('Error loading booking data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSlots = () => {
    if (!selectedDate) return []

    const date = new Date(selectedDate)
    const dayOfWeek = date.getDay()

    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek && a.is_available)
    if (dayAvailability.length === 0) return []

    const slots = []
    dayAvailability.forEach(avail => {
      let [startHour, startMin] = avail.start_time.split(':').map(Number)
      const [endHour, endMin] = avail.end_time.split(':').map(Number)

      while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
        const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
        slots.push(timeStr)
        startMin += 30
        if (startMin >= 60) {
          startHour++
          startMin = 0
        }
      }
    })

    return slots
  }

  const calculatePlatformFee = (price) => Math.round(price * 0.15)
  const calculateTotal = (price) => price

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedListing) {
      toast.error('Please select date, time, and service')
      return
    }

    if (!profile) {
      toast.info('Please log in to book a session')
      navigate('/login')
      return
    }

    setSubmitting(true)

    try {
      const price = selectedListing.price
      const platformFee = calculatePlatformFee(price)
      const trainerPayout = price - platformFee

      const endTime = new Date(`${selectedDate}T${selectedTime}`)
      endTime.setMinutes(endTime.getMinutes() + (selectedListing.duration_minutes || 60))

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: profile.id,
          trainer_id: trainerId,
          listing_id: selectedListing.id,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          end_time: endTime.toTimeString().slice(0, 5),
          duration_minutes: selectedListing.duration_minutes || 60,
          status: 'pending',
          location_type: selectedListing.location_type,
          session_notes: notes,
          total_price: price,
          platform_fee: platformFee,
          trainer_payout: trainerPayout,
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      toast.success('Booking request sent!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Trainer not found</h1>
        <Link to="/search" className="text-blue-500 hover:underline">Browse trainers</Link>
      </div>
    )
  }

  const availableSlots = getAvailableSlots()
  const isBlocked = blockedDates.includes(selectedDate)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Link
        to={`/trainer/${trainerId}`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white mb-6"
      >
        <ChevronLeft size={16} />
        Back to trainer
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <img
          src={trainer.avatar}
          alt={trainer.name}
          className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800"
        />
        <div>
          <h1 className="text-xl font-bold">Book a Session</h1>
          <p className="text-gray-500">{trainer.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard size={18} />
            Select Service
          </h2>
          {listings.length > 0 ? (
            <div className="space-y-2">
              {listings.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListing(l)}
                  className={`w-full p-4 text-left rounded-xl border transition-all ${
                    selectedListing?.id === l.id
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-gray-500">{l.listing_type.replace('_', ' ')}</p>
                    </div>
                    <p className="font-semibold">${(l.price / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {l.duration_minutes} min
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {l.location_type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No services available for booking.</p>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar size={18} />
            Select Date
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          {isBlocked && (
            <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
              <AlertCircle size={14} />
              This date is not available
            </p>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} />
            Select Time
          </h2>
          {availableSlots.length > 0 && !isBlocked ? (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTime === slot
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No available slots for this date.</p>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-3">Session Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific goals or requests for this session..."
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            rows={3}
          />
        </section>

        {selectedListing && selectedDate && selectedTime && !isBlocked && (
          <section className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
            <h2 className="font-semibold mb-3">Booking Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span>{selectedListing.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span>{selectedListing.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="capitalize">{selectedListing.location_type}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${(selectedListing.price / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Platform fee</span>
                  <span>${(calculatePlatformFee(selectedListing.price) / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span>${(selectedListing.price / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={submitting}
              className="w-full mt-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Processing...' : 'Request Booking'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              Booking is pending trainer confirmation. You won't be charged until confirmed.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
