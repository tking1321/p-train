import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function TrainerListingsPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [profile])

  const loadListings = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (listing) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_active: !listing.is_active })
        .eq('id', listing.id)

      if (error) throw error
      setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_active: !l.is_active } : l))
      toast.success(listing.is_active ? 'Listing deactivated' : 'Listing activated')
    } catch (error) {
      console.error('Error toggling listing:', error)
      toast.error('Failed to update listing')
    }
  }

  const deleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error
      setListings(prev => prev.filter(l => l.id !== listingId))
      toast.success('Listing deleted')
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast.error('Failed to delete listing')
    }
  }

  const formatCurrency = (cents) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Listings</h1>
        <Link
          to="/trainer/listings/new"
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium"
        >
          <Plus size={18} />
          New Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <DollarSign className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500 mb-4">No listings yet. Create your first service offering.</p>
          <Link
            to="/trainer/listings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
          >
            <Plus size={18} />
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl ${
                !listing.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      listing.is_active
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{listing.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {listing.listing_type.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {listing.duration_minutes} min
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      {listing.location_type}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold">{formatCurrency(listing.price)}</p>
                  {listing.billing_interval && (
                    <p className="text-xs text-gray-500">{listing.billing_interval.replace('_', ' ')}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => toggleActive(listing)}
                  className="text-sm px-3 py-1 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {listing.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <Link
                  to={`/trainer/listings/${listing.id}`}
                  className="text-sm px-3 py-1 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
                >
                  <Edit size={14} />
                  Edit
                </Link>
                <button
                  onClick={() => deleteListing(listing.id)}
                  className="text-sm px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
