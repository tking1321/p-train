import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X, Star } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TrainerCard from '../components/TrainerCard'
import { specialties } from '../data/mockData'

export default function DiscoverPage() {
  const { getAllTrainers } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    specialty: '',
    minPrice: 0,
    maxPrice: 500,
    programType: '',
    minRating: 0,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 9

  const trainers = getAllTrainers()

  const filteredTrainers = useMemo(() => {
    return trainers.filter(trainer => {
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesName = trainer.name.toLowerCase().includes(searchLower)
        const matchesSpecialty = trainer.specialty?.some(s => s.toLowerCase().includes(searchLower))
        if (!matchesName && !matchesSpecialty) return false
      }

      if (filters.specialty && !trainer.specialty?.includes(filters.specialty)) return false

      if (trainer.programs?.length > 0) {
        const trainerMinPrice = trainer.programs.reduce((min, p) => Math.min(min, p.price), Infinity)
        if (trainerMinPrice < filters.minPrice) return false
        if (trainerMinPrice > filters.maxPrice) return false
      }

      if (filters.programType) {
        const hasType = trainer.programs?.some(p => p.type === filters.programType)
        if (!hasType) return false
      }

      if (trainer.rating < filters.minRating) return false

      return true
    })
  }, [trainers, search, filters])

  const totalPages = Math.ceil(filteredTrainers.length / perPage)
  const paginatedTrainers = filteredTrainers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  )

  const hasActiveFilters = search || filters.specialty || filters.minPrice > 0 || filters.maxPrice < 500 || filters.programType || filters.minRating

  const clearFilters = () => {
    setSearch('')
    setFilters({
      specialty: '',
      minPrice: 0,
      maxPrice: 500,
      programType: '',
      minRating: 0,
    })
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="sticky top-14 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or specialty..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-600"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded text-sm transition-colors ${
                showFilters
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'border-gray-200 dark:border-dark-border hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Specialty</label>
                  <select
                    value={filters.specialty}
                    onChange={e => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">All Specialties</option>
                    {specialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Price Range</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={e => setFilters(prev => ({ ...prev, minPrice: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={e => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || 500 }))}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400"
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Program Type</label>
                  <select
                    value={filters.programType}
                    onChange={e => setFilters(prev => ({ ...prev, programType: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">All Types</option>
                    <option value="one-time">One-Time</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">Minimum Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          minRating: prev.minRating === rating ? 0 : rating
                        }))}
                        className={`p-2 rounded transition-colors ${
                          filters.minRating >= rating
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-dark-hover'
                        }`}
                      >
                        <Star size={16} className={filters.minRating >= rating ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-1 text-sm text-gray-500 hover:text-current"
                >
                  <X size={14} />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {filteredTrainers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-gray-200 dark:border-dark-border rounded">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No trainers found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-500 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''} found
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedTrainers.map(trainer => (
                <TrainerCard key={trainer.id} trainer={trainer} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-hover disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm rounded transition-colors ${
                      currentPage === page
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'hover:bg-gray-100 dark:hover:bg-dark-hover'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-dark-border rounded disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-dark-hover disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
