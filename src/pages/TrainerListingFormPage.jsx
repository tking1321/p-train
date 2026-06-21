import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { c, LISTING_TYPES, BILLING_INTERVALS, LOCATION_TYPES, calcFees, formatCurrency } from '../lib/theme'

const DURATIONS = [30, 45, 60, 90, 120]

const EMPTY = {
  title: '',
  description: '',
  listing_type: 'single_session',
  billing_interval: 'per_session',
  price: '',
  duration_minutes: 60,
  location_type: 'in_person',
  is_active: true,
}

export default function TrainerListingFormPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEdit || !profile) return
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('trainer_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({ ...data, price: (data.price / 100).toFixed(2) })
        setLoading(false)
      })
  }, [id, isEdit, profile])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    const price = parseFloat(form.price)
    if (!form.price || isNaN(price) || price <= 0) e.price = 'Must be a positive number'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const priceCents = Math.round(parseFloat(form.price) * 100)
    const payload = {
      trainer_id: profile.id,
      title: form.title.trim(),
      description: form.description.trim(),
      listing_type: form.listing_type,
      billing_interval: form.billing_interval,
      price: priceCents,
      duration_minutes: form.duration_minutes,
      location_type: form.location_type,
      is_active: form.is_active,
    }

    const { error } = isEdit
      ? await supabase.from('listings').update(payload).eq('id', id)
      : await supabase.from('listings').insert(payload)

    setSaving(false)
    if (error) {
      toast.error('Failed to save listing')
      console.error(error)
    } else {
      toast.success(isEdit ? 'Listing updated' : 'Listing created')
      navigate('/trainer/listings')
    }
  }

  const priceCents = Math.round(parseFloat(form.price || 0) * 100)
  const { fee, net } = priceCents > 0 ? calcFees(priceCents) : { fee: 0, net: 0 }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white" />
      </div>
    )
  }

  return (
    <div className={c.pageNarrow}>
      <button onClick={() => navigate('/trainer/listings')} className={c.btnGhost + ' mb-4 -ml-2'}>
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </button>

      <h1 className={c.heading1 + ' mb-6'}>{isEdit ? 'Edit Listing' : 'New Listing'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className={c.label}>Title</label>
          <input
            className={c.input + (errors.title ? ' border-red-400 focus:ring-red-400' : '')}
            placeholder="e.g. 1-on-1 Strength Session"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className={c.label}>Description</label>
          <textarea
            className={c.textarea}
            rows={3}
            placeholder="What's included in this session?"
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Listing type */}
          <div>
            <label className={c.label}>Service Type</label>
            <select className={c.select} value={form.listing_type} onChange={e => set('listing_type', e.target.value)}>
              {Object.entries(LISTING_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Location type */}
          <div>
            <label className={c.label}>Location</label>
            <select className={c.select} value={form.location_type} onChange={e => set('location_type', e.target.value)}>
              {Object.entries(LOCATION_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className={c.label}>Duration</label>
            <select className={c.select} value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))}>
              {DURATIONS.map(d => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>

          {/* Billing interval */}
          <div>
            <label className={c.label}>Billing</label>
            <select className={c.select} value={form.billing_interval} onChange={e => set('billing_interval', e.target.value)}>
              {Object.entries(BILLING_INTERVALS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className={c.label}>Price (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              min="1"
              step="0.01"
              className={c.input + ' pl-8' + (errors.price ? ' border-red-400 focus:ring-red-400' : '')}
              placeholder="0.00"
              value={form.price}
              onChange={e => set('price', e.target.value)}
            />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          {priceCents > 0 && (
            <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Platform fee (15%): <strong className="text-red-500">-{formatCurrency(fee)}</strong></span>
              <span>You receive: <strong className="text-green-600 dark:text-green-400">{formatCurrency(net)}</strong></span>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-[#2a2a2a]">
          <div>
            <p className="font-medium text-sm">Active</p>
            <p className={c.tiny}>Visible to clients when active</p>
          </div>
          <button
            type="button"
            onClick={() => set('is_active', !form.is_active)}
            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_active ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-black transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/trainer/listings')}
            className={c.btnSecondary + ' flex-1'}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={c.btnPrimary + ' flex-1'}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
