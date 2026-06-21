import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TrainerAvailabilityPage() {
  const { profile } = useAuth()
  const toast = useToast()

  const [availability, setAvailability] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [profile])

  const loadAvailability = async () => {
    if (!profile) return

    try {
      const [availRes, blockedRes] = await Promise.all([
        supabase
          .from('availability')
          .select('*')
          .eq('trainer_id', profile.id)
          .order('day_of_week', { ascending: true }),

        supabase
          .from('blocked_dates')
          .select('*')
          .eq('trainer_id', profile.id)
          .order('blocked_date', { ascending: true }),
      ])

      const defaultSlots = dayNames.map((_, index) => ({
        day_of_week: index,
        start_time: '09:00',
        end_time: '17:00',
        is_available: false,
      }))

      const merged = defaultSlots.map((slot) => {
        const existing = availRes.data?.find(a => a.day_of_week === slot.day_of_week)
        return existing || slot
      })

      setAvailability(merged)
      setBlockedDates(blockedRes.data || [])
    } catch (error) {
      console.error('Error loading availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = (dayOfWeek, field, value) => {
    setAvailability(prev => prev.map(slot =>
      slot.day_of_week === dayOfWeek ? { ...slot, [field]: value } : slot
    ))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      for (const slot of availability) {
        const existing = await supabase
          .from('availability')
          .select('id')
          .eq('trainer_id', profile.id)
          .eq('day_of_week', slot.day_of_week)
          .single()

        if (existing.data) {
          await supabase
            .from('availability')
            .update({
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: slot.is_available,
            })
            .eq('id', existing.data.id)
        } else {
          await supabase
            .from('availability')
            .insert({
              trainer_id: profile.id,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: slot.is_available,
            })
        }
      }

      toast.success('Availability saved!')
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const addBlockedDate = async (e) => {
    e.preventDefault()
    const form = e.target
    const date = form.date.value

    if (!date) return

    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .insert({
          trainer_id: profile.id,
          blocked_date: date,
        })
        .select()
        .single()

      if (error) throw error
      setBlockedDates(prev => [...prev, data])
      form.reset()
      toast.success('Date blocked')
    } catch (error) {
      console.error('Error blocking date:', error)
      toast.error('Failed to block date')
    }
  }

  const removeBlockedDate = async (blockedId) => {
    try {
      await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', blockedId)

      setBlockedDates(prev => prev.filter(b => b.id !== blockedId))
      toast.info('Date unblocked')
    } catch (error) {
      console.error('Error unblocking date:', error)
      toast.error('Failed to unblock date')
    }
  }

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
        <div>
          <h1 className="text-2xl font-bold">Availability</h1>
          <p className="text-gray-500 text-sm">Set your weekly schedule and block off dates</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold">Weekly Schedule</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {availability.map((slot) => (
            <div key={slot.day_of_week} className="p-4 flex items-center gap-4">
              <div className="w-28">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slot.is_available}
                    onChange={(e) => updateSlot(slot.day_of_week, 'is_available', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="font-medium">{dayNames[slot.day_of_week]}</span>
                </label>
              </div>

              {slot.is_available && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => updateSlot(slot.day_of_week, 'start_time', e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => updateSlot(slot.day_of_week, 'end_time', e.target.value)}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                </div>
              )}

              {!slot.is_available && (
                <span className="text-gray-400 text-sm">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold">Blocked Dates</h2>
          <p className="text-sm text-gray-500">Days you're unavailable (holidays, time off, etc.)</p>
        </div>

        <form onSubmit={addBlockedDate} className="p-4 flex gap-2">
          <input
            type="date"
            name="date"
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
          >
            Block
          </button>
        </form>

        {blockedDates.length > 0 && (
          <div className="p-4 pt-0 space-y-2">
            {blockedDates.map((blocked) => (
              <div
                key={blocked.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span>{new Date(blocked.blocked_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}</span>
                <button
                  onClick={() => removeBlockedDate(blocked.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
