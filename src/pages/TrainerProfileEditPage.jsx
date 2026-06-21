import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

const specialtyOptions = [
  'Strength Training',
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

export default function TrainerProfileEditPage() {
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    bio: '',
    location: '',
    specialties: [],
    certifications: [],
    service_radius_km: 25,
    is_online: true,
    is_in_person: true,
  })
  const [newCertification, setNewCertification] = useState('')

  useEffect(() => {
    loadProfile()
  }, [profile])

  const loadProfile = async () => {
    if (!profile) return

    try {
      const { data: tp } = await supabase
        .from('trainer_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      setFormData({
        name: profile.name || '',
        headline: tp?.headline || '',
        bio: profile.bio || '',
        location: profile.location || '',
        specialties: tp?.specialties || [],
        certifications: tp?.certifications || [],
        service_radius_km: tp?.service_radius_km || 25,
        is_online: tp?.is_online ?? true,
        is_in_person: tp?.is_in_person ?? true,
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }))
  }

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()],
      }))
      setNewCertification('')
    }
  }

  const removeCertification = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert),
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      await supabase
        .from('profiles')
        .update({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
        })
        .eq('id', profile.id)

      await supabase
        .from('trainer_profiles')
        .update({
          headline: formData.headline,
          specialties: formData.specialties,
          certifications: formData.certifications,
          service_radius_km: formData.service_radius_km,
          is_online: formData.is_online,
          is_in_person: formData.is_in_person,
        })
        .eq('user_id', profile.id)

      await refreshProfile()
      toast.success('Profile updated!')
      navigate('/trainer')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Headline</label>
          <input
            type="text"
            value={formData.headline}
            onChange={(e) => updateField('headline', e.target.value)}
            placeholder="A brief tagline for your profile"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Specialties</label>
          <div className="flex flex-wrap gap-2">
            {specialtyOptions.map((specialty) => (
              <button
                key={specialty}
                onClick={() => toggleSpecialty(specialty)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  formData.specialties.includes(specialty)
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                {specialty}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Certifications</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              placeholder="Add certification..."
              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
            />
            <button onClick={addCertification} className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((cert) => (
              <span key={cert} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full flex items-center gap-1">
                {cert}
                <button onClick={() => removeCertification(cert)} className="text-gray-500 hover:text-red-500">&times;</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Service Radius (km)</label>
          <input
            type="number"
            value={formData.service_radius_km}
            onChange={(e) => updateField('service_radius_km', parseInt(e.target.value) || 25)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Session Types</label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_in_person}
                onChange={(e) => updateField('is_in_person', e.target.checked)}
                className="w-5 h-5"
              />
              <span>In-Person Sessions</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_online}
                onChange={(e) => updateField('is_online', e.target.checked)}
                className="w-5 h-5"
              />
              <span>Online Sessions</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
