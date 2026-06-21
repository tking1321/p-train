import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Sliders, X, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

const specialties = [
  'All',
  'Strength',
  'Cardio',
  'HIIT',
  'Yoga',
  'Pilates',
  'CrossFit',
  'Weight Loss',
  'Nutrition',
  'Mobility',
  'Meditation',
]

const locationTypes = [
  { value: 'all', label: 'All' },
  { value: 'in_person', label: 'In-Person' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
]

const priceRanges = [
  { value: 'all', label: 'Any Price' },
  { value: '0-50', label: 'Under $50' },
  { value: '50-100', label: '$50 - $100' },
  { value: '100-200', label: '$100 - $200' },
  { value: '200+', label: '$200+' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || 'All')
  const [locationType, setLocationType] = useState(searchParams.get('location') || 'all')
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all')

  useEffect(() => {
    searchTrainers()
  }, [specialty, locationType, priceRange])

  const searchTrainers = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar,
          location,
          headline,
          trainer_profiles(
            specialties,
            is_online,
            is_in_person,
            service_radius_km
          )
        `)
        .eq('role', 'trainer')

      if (search) {
        query = query.or(`name.ilike.%${search}%,headline.ilike.%${search}%`)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      let filtered = data || []

      if (specialty !== 'All') {
        filtered = filtered.filter(t =>
          t.trainer_profiles?.specialties?.some(s =>
            s.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      }

      if (locationType !== 'all') {
        filtered = filtered.filter(t => {
          const tp = t.trainer_profiles
          if (!tp) return false
          if (locationType === 'in_person') return tp.is_in_person
          if (locationType === 'online') return tp.is_online
          if (locationType === 'hybrid') return tp.is_online && tp.is_in_person
          return true
        })
      }

      setTrainers(filtered)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (specialty !== 'All') params.set('specialty', specialty)
    if (locationType !== 'all') params.set('location', locationType)
    if (priceRange !== 'all') params.set('price', priceRange)
    setSearchParams(params)
    searchTrainers()
  }

  const clearFilters = () => {
    setSearch('')
    setSpecialty('All')
    setLocationType('all')
    setPriceRange('all')
    setSearchParams({})
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Find Trainers</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </form>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location Type</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {locationTypes.map((lt) => (
                  <option key={lt.value} value={lt.value}>{lt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {priceRanges.map((pr) => (
                  <option key={pr.value} value={pr.value}>{pr.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-black dark:hover:text-white"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No trainers found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Clear filters and try again
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {trainers.length} trainer{trainers.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainers.map((trainer) => (
              <Link
                key={trainer.id}
                to={`/trainer/${trainer.id}`}
                className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={trainer.avatar}
                    alt={trainer.name}
                    className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-blue-500 transition-colors">
                      {trainer.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {trainer.headline}
                    </p>
                    {trainer.location && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {trainer.location}
                      </p>
                    )}
                    {trainer.trainer_profiles?.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trainer.trainer_profiles.specialties.slice(0, 3).map((s) => (
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
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
