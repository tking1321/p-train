import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, MapPin, CheckCircle, Share2, MessageSquare, ChevronDown, ChevronUp, Bookmark, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function TrainerProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()

  const [trainer, setTrainer] = useState(null)
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [availability, setAvailability] = useState([])
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAllBio, setShowAllBio] = useState(false)

  useEffect(() => {
    loadTrainerData()
  }, [id, profile])

  const loadTrainerData = async () => {
    setLoading(true)
    try {
      const [trainerRes, listingsRes, reviewsRes, availRes, savedRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            *,
            trainer_profiles(*)
          `)
          .eq('id', id)
          .eq('role', 'trainer')
          .single(),

        supabase
          .from('listings')
          .select('*')
          .eq('trainer_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),

        supabase
          .from('reviews')
          .select('*')
          .eq('trainer_id', id)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('availability')
          .select('*')
          .eq('trainer_id', id)
          .order('day_of_week', { ascending: true }),

        profile ? supabase
          .from('saved_trainers')
          .select('id')
          .eq('client_id', profile.id)
          .eq('trainer_id', id)
          .single() : Promise.resolve({ data: null }),
      ])

      setTrainer(trainerRes.data)
      setListings(listingsRes.data || [])
      setReviews(reviewsRes.data || [])
      setAvailability(availRes.data || [])
      setIsSaved(!!savedRes.data)
    } catch (error) {
      console.error('Error loading trainer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.info('Link copied to clipboard')
  }

  const handleSave = async () => {
    if (!profile) {
      toast.info('Please log in to save trainers')
      navigate('/login')
      return
    }

    if (isSaved) {
      await supabase
        .from('saved_trainers')
        .delete()
        .eq('client_id', profile.id)
        .eq('trainer_id', id)
      setIsSaved(false)
      toast.info('Removed from saved')
    } else {
      await supabase
        .from('saved_trainers')
        .insert({ client_id: profile.id, trainer_id: id })
      setIsSaved(true)
      toast.success('Trainer saved!')
    }
  }

  const handleMessage = async () => {
    if (!profile) {
      toast.info('Please log in to message trainers')
      navigate('/login')
      return
    }

    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', profile.id)
      .eq('trainer_id', id)
      .single()

    if (existingConv) {
      navigate(`/messages/${existingConv.id}`)
      return
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ client_id: profile.id, trainer_id: id })
      .select('id')
      .single()

    if (newConv) {
      navigate(`/messages/${newConv.id}`)
    }
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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Trainer not found</h1>
        <Link to="/search" className="text-blue-500 hover:underline">
          Browse trainers
        </Link>
      </div>
    )
  }

  const tp = trainer.trainer_profiles?.[0] || {}
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="relative h-32 md:h-48 bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900" />

      <div className="max-w-5xl mx-auto px-4">
        <div className="relative -mt-12 md:-mt-16 flex flex-col md:flex-row md:items-end gap-4">
          <img
            src={trainer.avatar}
            alt={trainer.name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-white dark:border-black object-cover bg-gray-200 dark:bg-gray-800"
          />
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold">{trainer.name}</h1>
              {trainer.verified && (
                <CheckCircle size={18} className="text-blue-500" />
              )}
            </div>
            {trainer.headline && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{trainer.headline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {avgRating && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-black dark:text-white">{avgRating}</span>
                  <span>({reviews.length} reviews)</span>
                </div>
              )}
              {trainer.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  {trainer.location}
                </div>
              )}
              {tp.is_online && (
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs">
                  Online
                </span>
              )}
              {tp.is_in_person && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                  In-Person
                </span>
              )}
            </div>
            {tp.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {tp.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 md:mt-6 flex gap-2 flex-wrap">
          <Link
            to={`/book/${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Calendar size={18} />
            Book Session
          </Link>
          <button
            onClick={handleMessage}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <MessageSquare size={18} />
            Message
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isSaved
                ? 'border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>

        <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          {trainer.bio ? (
            <>
              <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-line ${!showAllBio && 'line-clamp-4'}`}>
                {trainer.bio}
              </p>
              {trainer.bio.length > 300 && (
                <button
                  onClick={() => setShowAllBio(!showAllBio)}
                  className="mt-2 text-sm text-blue-500 hover:underline flex items-center gap-1"
                >
                  {showAllBio ? (
                    <>Show less <ChevronUp size={14} /></>
                  ) : (
                    <>Read more <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </>
          ) : (
            <p className="text-gray-500">No bio provided.</p>
          )}
        </section>

        <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Services & Pricing</h2>
          {listings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-sm text-gray-500">{listing.listing_type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(listing.price)}</p>
                      {listing.billing_interval && (
                        <p className="text-xs text-gray-500">{listing.billing_interval.replace('_', ' ')}</p>
                      )}
                    </div>
                  </div>
                  {listing.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {listing.duration_minutes} min
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {listing.location_type}
                    </span>
                    <Link
                      to={`/book/${id}/${listing.id}`}
                      className="ml-auto text-sm text-blue-500 hover:underline"
                    >
                      Book now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No services listed yet.</p>
          )}
        </section>

        {availability.length > 0 && (
          <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4">Availability</h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {availability.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-3 rounded-lg text-sm ${
                    slot.is_available
                      ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 line-through'
                  }`}
                >
                  <p className="font-medium">{dayNames[slot.day_of_week]}</p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
