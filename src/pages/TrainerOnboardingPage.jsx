import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Building2, User, Check, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { c, IS_TRAINER, LISTING_TYPES, BILLING_INTERVALS, LOCATION_TYPES } from '../lib/theme'

const STEPS = [
  { id: 1, title: 'Account Type' },
  { id: 2, title: 'Profile Basics' },
  { id: 3, title: 'Stripe Payout' },
  { id: 4, title: 'Your Services' },
  { id: 5, title: 'Availability' },
  { id: 6, title: 'Go Live' },
]

const SPECIALTY_OPTIONS = [
  'Strength Training', 'Cardio', 'HIIT', 'Yoga', 'Pilates',
  'CrossFit', 'Weight Loss', 'Nutrition Coaching', 'Mobility',
  'Running', 'Boxing', 'Meditation', 'Sports Performance',
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function TrainerOnboardingPage() {
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [trainerProfile, setTrainerProfile] = useState(null)
  const [stripeStatus, setStripeStatus] = useState('not_started')
  const [stripeLoading, setStripeLoading] = useState(false)

  const [accountType, setAccountType] = useState('individual')
  const [profileData, setProfileData] = useState({
    display_name: '', phone: '', location_city: '', location_state: '',
    bio: '', website_url: '', social_instagram: '', social_youtube: '',
    specialties: [], certifications: [], service_mode: 'hybrid',
    service_radius_miles: 20, business_name: '',
  })
  const [listings, setListings] = useState([{
    title: '', description: '', listing_type: 'single_session',
    billing_interval: 'per_session', price: '', duration_minutes: 60,
    location_type: 'hybrid', active: true,
  }])
  const [availability, setAvailability] = useState(
    DAYS.map((_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '17:00', is_available: i > 0 && i < 6 }))
  )
  const [newCert, setNewCert] = useState('')

  useEffect(() => {
    loadTrainerProfile()
  }, [profile])

  useEffect(() => {
    const urlStep = searchParams.get('step')
    if (urlStep) setStep(parseInt(urlStep))
    if (searchParams.get('stripe_return') === 'true') {
      checkStripeStatus()
    }
  }, [searchParams])

  const loadTrainerProfile = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .single()
    if (data) {
      setTrainerProfile(data)
      setAccountType(data.trainer_type || 'individual')
      setStripeStatus(data.stripe_account_status || 'not_started')
      const savedStep = data.onboarding_step || 1
      if (savedStep > 1 && !searchParams.get('step')) setStep(savedStep)
      setProfileData(prev => ({
        ...prev,
        display_name: profile.display_name || profile.name || '',
        phone: profile.phone || '',
        location_city: profile.location_city || '',
        location_state: profile.location_state || '',
        bio: profile.bio || '',
        website_url: data.website_url || '',
        specialties: data.specialties || [],
        service_mode: data.service_mode || 'hybrid',
        service_radius_miles: data.service_radius_miles || 20,
        business_name: data.business_name || '',
        social_instagram: data.social_links?.instagram || '',
        social_youtube: data.social_links?.youtube || '',
      }))
    }
  }

  const saveStep = async (nextStep) => {
    setSaving(true)
    try {
      if (step === 1) {
        await supabase.from('trainer_profiles').update({
          trainer_type: accountType,
          onboarding_step: Math.max(nextStep, trainerProfile?.onboarding_step || 1),
        }).eq('user_id', profile.id)
      } else if (step === 2) {
        await supabase.from('profiles').update({
          display_name: profileData.display_name,
          name: profileData.display_name,
          phone: profileData.phone,
          location_city: profileData.location_city,
          location_state: profileData.location_state,
          bio: profileData.bio,
          location: `${profileData.location_city}, ${profileData.location_state}`,
        }).eq('id', profile.id)
        await supabase.from('trainer_profiles').update({
          headline: profileData.bio?.slice(0, 120),
          website_url: profileData.website_url,
          specialties: profileData.specialties,
          certifications: profileData.certifications,
          service_mode: profileData.service_mode,
          service_radius_miles: profileData.service_radius_miles,
          business_name: accountType === 'business' ? profileData.business_name : null,
          social_links: {
            instagram: profileData.social_instagram,
            youtube: profileData.social_youtube,
          },
          onboarding_step: Math.max(nextStep, trainerProfile?.onboarding_step || 1),
        }).eq('user_id', profile.id)
      } else if (step === 4) {
        for (const listing of listings) {
          if (!listing.title || !listing.price) continue
          await supabase.from('listings').insert({
            trainer_id: profile.id,
            title: listing.title,
            description: listing.description,
            listing_type: listing.listing_type,
            billing_interval: listing.billing_interval,
            price: Math.round(parseFloat(listing.price) * 100),
            duration_minutes: listing.duration_minutes,
            location_type: listing.location_type,
            is_active: false,
          })
        }
        await supabase.from('trainer_profiles').update({
          onboarding_step: Math.max(nextStep, trainerProfile?.onboarding_step || 1),
        }).eq('user_id', profile.id)
      } else if (step === 5) {
        for (const slot of availability) {
          if (!slot.is_available) continue
          const { data: existing } = await supabase
            .from('availability')
            .select('id')
            .eq('trainer_id', profile.id)
            .eq('day_of_week', slot.day_of_week)
            .single()
          if (existing) {
            await supabase.from('availability').update({
              start_time: slot.start_time, end_time: slot.end_time, is_available: true,
            }).eq('id', existing.id)
          } else {
            await supabase.from('availability').insert({
              trainer_id: profile.id, day_of_week: slot.day_of_week,
              start_time: slot.start_time, end_time: slot.end_time, is_available: true,
            })
          }
        }
        await supabase.from('trainer_profiles').update({
          onboarding_step: Math.max(nextStep, trainerProfile?.onboarding_step || 1),
        }).eq('user_id', profile.id)
      }
      await refreshProfile()
      setStep(nextStep)
    } catch (err) {
      console.error('Save step error:', err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const startStripeOnboarding = async () => {
    setStripeLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=create_account`,
        { method: 'GET', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' } }
      )
      const result = await res.json()
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error || 'Failed to start Stripe onboarding')
      }
    } catch (err) {
      toast.error('Failed to connect to Stripe')
    } finally {
      setStripeLoading(false)
    }
  }

  const checkStripeStatus = async () => {
    setStripeLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=get_status`,
        { method: 'GET', headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const result = await res.json()
      setStripeStatus(result.status)
      if (result.status === 'verified') toast.success('Stripe account verified!')
      await supabase.from('trainer_profiles').update({
        onboarding_step: Math.max(4, trainerProfile?.onboarding_step || 1),
      }).eq('user_id', profile.id)
    } catch (err) {
      toast.error('Failed to check Stripe status')
    } finally {
      setStripeLoading(false)
    }
  }

  const publishProfile = async () => {
    setSaving(true)
    try {
      await supabase.from('trainer_profiles').update({ active: true, profile_complete: true }).eq('user_id', profile.id)
      await supabase.from('listings').update({ is_active: true }).eq('trainer_id', profile.id)
      await refreshProfile()
      toast.success('Your profile is live!')
      navigate('/trainer')
    } catch (err) {
      toast.error('Failed to publish profile')
    } finally {
      setSaving(false)
    }
  }

  const addListing = () => setListings(prev => [...prev, {
    title: '', description: '', listing_type: 'single_session',
    billing_interval: 'per_session', price: '', duration_minutes: 60,
    location_type: 'hybrid', active: true,
  }])

  const removeListing = (i) => setListings(prev => prev.filter((_, idx) => idx !== i))

  const updateListing = (i, field, val) =>
    setListings(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const toggleSpecialty = (s) =>
    setProfileData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }))

  const addCert = () => {
    if (newCert.trim()) {
      setProfileData(prev => ({ ...prev, certifications: [...(prev.certifications || []), newCert.trim()] }))
      setNewCert('')
    }
  }

  const removeCert = (c) =>
    setProfileData(prev => ({ ...prev, certifications: prev.certifications.filter(x => x !== c) }))

  const canPublish = stripeStatus === 'verified' && profileData.display_name && profileData.bio

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-16">
      {/* Progress header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-[#2a2a2a]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Trainer Setup</span>
            <span className="text-xs text-gray-500">{step} / {STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex-1 h-1 rounded-full transition-colors ${s.id <= step ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-[#2a2a2a]'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{STEPS[step - 1]?.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className={c.heading1}>How do you train?</h1>
              <p className={`${c.muted} mt-1`}>Choose the account type that fits your business.</p>
            </div>
            <div className="grid gap-4">
              {[
                { id: 'individual', icon: User, title: 'Individual Trainer', desc: 'You are a solo personal trainer operating under your own name. Perfect for freelancers and independent coaches.' },
                { id: 'business', icon: Building2, title: 'Training Business', desc: 'You operate a gym, studio, or training company with multiple trainers or services.' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAccountType(opt.id)}
                  className={`p-5 rounded-xl border text-left transition-all ${accountType === opt.id ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#111]' : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accountType === opt.id ? 'bg-gray-900 dark:bg-white' : 'bg-gray-100 dark:bg-[#1a1a1a]'}`}>
                      <opt.icon className={`w-5 h-5 ${accountType === opt.id ? 'text-white dark:text-black' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{opt.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                    {accountType === opt.id && <Check className="w-5 h-5 text-gray-900 dark:text-white ml-auto flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Profile Basics */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className={c.heading1}>Build your profile</h1>
              <p className={`${c.muted} mt-1`}>This is what clients see when they find you.</p>
            </div>
            {accountType === 'business' && (
              <div>
                <label className={c.label}>Business Name</label>
                <input value={profileData.business_name} onChange={e => setProfileData(p => ({ ...p, business_name: e.target.value }))} className={c.input} placeholder="Your gym or studio name" />
              </div>
            )}
            <div>
              <label className={c.label}>Display Name</label>
              <input value={profileData.display_name} onChange={e => setProfileData(p => ({ ...p, display_name: e.target.value }))} className={c.input} placeholder="Your full name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={c.label}>City</label>
                <input value={profileData.location_city} onChange={e => setProfileData(p => ({ ...p, location_city: e.target.value }))} className={c.input} placeholder="Los Angeles" />
              </div>
              <div>
                <label className={c.label}>State</label>
                <input value={profileData.location_state} onChange={e => setProfileData(p => ({ ...p, location_state: e.target.value }))} className={c.input} placeholder="CA" maxLength={2} />
              </div>
            </div>
            <div>
              <label className={c.label}>Phone (optional)</label>
              <input value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} className={c.input} placeholder="+1 (555) 000-0000" type="tel" />
            </div>
            <div>
              <label className={c.label}>Bio</label>
              <textarea value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} className={`${c.textarea} min-h-[120px]`} placeholder="Tell clients about your background, approach, and what makes you unique..." rows={4} />
            </div>
            <div>
              <label className={c.label}>Specialties</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {SPECIALTY_OPTIONS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${profileData.specialties.includes(s) ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={c.label}>Certifications (optional)</label>
              <div className="flex gap-2 mb-2">
                <input value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())} className={c.input} placeholder="e.g. NASM-CPT" />
                <button onClick={addCert} className={c.btnPrimary}>Add</button>
              </div>
              {profileData.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileData.certifications.map(cert => (
                    <span key={cert} className="px-3 py-1 text-sm bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                      {cert}
                      <button onClick={() => removeCert(cert)} className="text-gray-400 hover:text-red-500 ml-1">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={c.label}>Session Format</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(LOCATION_TYPES).map(([k, v]) => (
                  <button key={k} onClick={() => setProfileData(p => ({ ...p, service_mode: k }))}
                    className={`py-2 text-sm rounded-lg border transition-colors ${profileData.service_mode === k ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {profileData.service_mode !== 'online' && (
              <div>
                <label className={c.label}>Service Radius (miles)</label>
                <input type="number" value={profileData.service_radius_miles} min={1} max={200}
                  onChange={e => setProfileData(p => ({ ...p, service_radius_miles: parseInt(e.target.value) || 20 }))}
                  className={c.input} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={c.label}>Instagram (optional)</label>
                <input value={profileData.social_instagram} onChange={e => setProfileData(p => ({ ...p, social_instagram: e.target.value }))} className={c.input} placeholder="@handle" />
              </div>
              <div>
                <label className={c.label}>Website (optional)</label>
                <input value={profileData.website_url} onChange={e => setProfileData(p => ({ ...p, website_url: e.target.value }))} className={c.input} placeholder="https://..." />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Stripe */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className={c.heading1}>Connect payout account</h1>
              <p className={`${c.muted} mt-1`}>You need a verified Stripe account to receive payments from clients.</p>
            </div>
            <div className={`${c.card} p-6 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stripeStatus === 'verified' ? 'bg-green-500' : stripeStatus === 'pending' ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {stripeStatus === 'verified' ? 'Payout account verified' :
                    stripeStatus === 'pending' ? 'Verification in progress' :
                    stripeStatus === 'restricted' ? 'Additional info required' :
                    'Not connected'}
                </span>
              </div>
              {stripeStatus !== 'verified' && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {accountType === 'business'
                    ? 'You\'ll complete business tax info and company representative verification.'
                    : 'You\'ll provide personal tax info and identity verification.'}
                </p>
              )}
              {stripeStatus === 'verified' ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Ready to receive payouts</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={startStripeOnboarding} disabled={stripeLoading}
                    className={`${c.btnPrimary} w-full justify-center`}>
                    {stripeLoading ? 'Loading...' : (
                      <><ExternalLink className="w-4 h-4" /> {stripeStatus === 'pending' ? 'Continue Stripe Setup' : 'Connect with Stripe'}</>
                    )}
                  </button>
                  {stripeStatus !== 'not_started' && (
                    <button onClick={checkStripeStatus} disabled={stripeLoading}
                      className={`${c.btnSecondary} w-full justify-center text-sm`}>
                      <RefreshCw className="w-4 h-4" /> Check status
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className={`${c.surface} rounded-xl p-4`}>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                P-Train uses <strong>Stripe Connect</strong> to process payments securely. We collect a 15% platform fee on each booking. Your earnings are transferred automatically after sessions are completed.
              </p>
            </div>
            {stripeStatus === 'verified' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-lg">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">You can proceed to the next step.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Services */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className={c.heading1}>Create your services</h1>
              <p className={`${c.muted} mt-1`}>Add the services clients can book from your profile.</p>
            </div>
            {listings.map((listing, i) => (
              <div key={i} className={`${c.card} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Service {i + 1}</span>
                  {listings.length > 1 && (
                    <button onClick={() => removeListing(i)} className="text-sm text-red-500 hover:text-red-600">Remove</button>
                  )}
                </div>
                <div>
                  <label className={c.label}>Title</label>
                  <input value={listing.title} onChange={e => updateListing(i, 'title', e.target.value)} className={c.input} placeholder="e.g. 60-Minute Personal Training Session" />
                </div>
                <div>
                  <label className={c.label}>Description (optional)</label>
                  <textarea value={listing.description} onChange={e => updateListing(i, 'description', e.target.value)} className={`${c.textarea}`} rows={2} placeholder="What's included in this session..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={c.label}>Service Type</label>
                    <select value={listing.listing_type} onChange={e => updateListing(i, 'listing_type', e.target.value)} className={c.select}>
                      {Object.entries(LISTING_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={c.label}>Billing</label>
                    <select value={listing.billing_interval} onChange={e => updateListing(i, 'billing_interval', e.target.value)} className={c.select}>
                      {Object.entries(BILLING_INTERVALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={c.label}>Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" value={listing.price} onChange={e => updateListing(i, 'price', e.target.value)} className={`${c.input} pl-8`} placeholder="75" min="1" />
                    </div>
                  </div>
                  <div>
                    <label className={c.label}>Duration (min)</label>
                    <select value={listing.duration_minutes} onChange={e => updateListing(i, 'duration_minutes', parseInt(e.target.value))} className={c.select}>
                      {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={c.label}>Location Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(LOCATION_TYPES).map(([k, v]) => (
                      <button key={k} onClick={() => updateListing(i, 'location_type', k)}
                        className={`py-2 text-sm rounded-lg border transition-colors ${listing.location_type === k ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-black' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {listing.price && (
                  <div className="text-xs text-gray-400 bg-gray-50 dark:bg-[#111] rounded-lg p-3">
                    Platform fee: ${(parseFloat(listing.price) * 0.15).toFixed(2)} &nbsp;·&nbsp;
                    Your net: <span className="font-medium text-gray-700 dark:text-gray-300">${(parseFloat(listing.price) * 0.85).toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
            <button onClick={addListing} className={`${c.btnSecondary} w-full justify-center`}>
              + Add Another Service
            </button>
          </div>
        )}

        {/* Step 5: Availability */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h1 className={c.heading1}>Set your availability</h1>
              <p className={`${c.muted} mt-1`}>Clients will only be able to book during your available hours.</p>
            </div>
            <div className={`${c.card} overflow-hidden`}>
              {availability.map((slot) => (
                <div key={slot.day_of_week} className={`flex items-center gap-3 px-4 py-3 ${slot.day_of_week < 6 ? 'border-b border-gray-100 dark:border-[#1a1a1a]' : ''}`}>
                  <label className="flex items-center gap-2 w-28 cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={slot.is_available}
                      onChange={e => setAvailability(prev => prev.map(s => s.day_of_week === slot.day_of_week ? { ...s, is_available: e.target.checked } : s))}
                      className="w-4 h-4 rounded" />
                    <span className={`text-sm font-medium ${slot.is_available ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{DAYS[slot.day_of_week]}</span>
                  </label>
                  {slot.is_available ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={slot.start_time}
                        onChange={e => setAvailability(prev => prev.map(s => s.day_of_week === slot.day_of_week ? { ...s, start_time: e.target.value } : s))}
                        className={`${c.inputSm} flex-1`} />
                      <span className="text-gray-400 text-sm">–</span>
                      <input type="time" value={slot.end_time}
                        onChange={e => setAvailability(prev => prev.map(s => s.day_of_week === slot.day_of_week ? { ...s, end_time: e.target.value } : s))}
                        className={`${c.inputSm} flex-1`} />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Go Live */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className={c.heading1}>Ready to go live?</h1>
              <p className={`${c.muted} mt-1`}>Review the checklist below before publishing your profile.</p>
            </div>
            <div className={`${c.card} divide-y divide-gray-100 dark:divide-[#1a1a1a]`}>
              {[
                { label: 'Profile complete', done: !!(profileData.display_name && profileData.bio) },
                { label: 'Specialties selected', done: profileData.specialties.length > 0 },
                { label: 'Stripe payout verified', done: stripeStatus === 'verified' },
                { label: 'Services created', done: listings.some(l => l.title && l.price) },
                { label: 'Availability set', done: availability.some(a => a.is_available) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between px-5 py-3">
                  <span className={`text-sm ${item.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{item.label}</span>
                  {item.done
                    ? <Check className="w-5 h-5 text-green-500" />
                    : <AlertCircle className="w-5 h-5 text-yellow-500" />}
                </div>
              ))}
            </div>
            {!canPublish && (
              <div className="flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Complete all items above before publishing. Stripe verification is required to receive payments.</span>
              </div>
            )}
            <button onClick={publishProfile} disabled={!canPublish || saving}
              className={`${c.btnPrimaryLg} w-full justify-center`}>
              {saving ? 'Publishing...' : 'Publish Profile'}
            </button>
            <button onClick={() => navigate('/trainer')}
              className="w-full text-sm text-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Save and continue later
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className={`${c.btnSecondary} flex-1 justify-center`}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < 6 && (
            <button onClick={() => saveStep(step + 1)} disabled={saving}
              className={`${c.btnPrimary} flex-1 justify-center`}>
              {saving ? 'Saving...' : <>{step === 3 && stripeStatus !== 'verified' ? 'Skip for now' : 'Continue'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
