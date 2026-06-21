import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { User, MessageSquare, Star, Settings, Briefcase, Clock, X, Plus, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Modal from '../components/Modal'
import ReviewCard from '../components/ReviewCard'
import { specialties } from '../data/mockData'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, updateUser, logout, getUserPurchases, getTrainerReviews, getClientsForTrainer, getAllTrainers, addProgram, updateProgram, deleteProgram } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('profile')
  const [editProgram, setEditProgram] = useState(null)
  const [newProgram, setNewProgram] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    yearsExperience: '',
    certifications: [],
    specialty: [],
  })

  const [newCert, setNewCert] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState({ email: true, inApp: true })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      yearsExperience: user.yearsExperience || '',
      certifications: user.certifications || [],
      specialty: user.specialty || [],
    })

    setDarkMode(document.documentElement.classList.contains('dark'))

    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [user, navigate, searchParams])

  if (!user) return null

  const purchases = getUserPurchases()
  const reviews = user.role === 'trainer' ? getTrainerReviews(user.id) : []
  const clients = user.role === 'trainer' ? getClientsForTrainer() : []
  const programs = user.role === 'trainer' ? (getAllTrainers().find(t => t.id === user.id)?.programs || []) : []

  const handleSaveProfile = () => {
    updateUser(formData)
    toast.success('Profile saved!')
  }

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark')
    document.documentElement.classList.toggle('light')
    setDarkMode(!isDark)
    localStorage.setItem('trainrhub_theme', isDark ? 'light' : 'dark')
  }

  const addCertification = () => {
    if (newCert && !formData.certifications.includes(newCert)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert],
      }))
      setNewCert('')
    }
  }

  const removeCertification = (cert) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== cert),
    }))
  }

  const addSpecialty = (s) => {
    if (!formData.specialty.includes(s)) {
      setFormData(prev => ({
        ...prev,
        specialty: [...prev.specialty, s],
      }))
    }
  }

  const removeSpecialty = (s) => {
    setFormData(prev => ({
      ...prev,
      specialty: prev.specialty.filter(sp => sp !== s),
    }))
  }

  const handleAddProgram = () => {
    setNewProgram({
      name: '',
      description: '',
      price: '',
      type: 'monthly',
      included: [''],
    })
  }

  const saveNewProgram = () => {
    if (newProgram?.name && newProgram?.price) {
      const program = {
        ...newProgram,
        price: parseInt(newProgram.price),
        included: newProgram.included.filter(i => i.trim()),
      }
      addProgram(user.id, program)
      setNewProgram(null)
      toast.success('Program added!')
    }
  }

  const handleEditProgram = (program) => {
    setEditProgram({ ...program })
  }

  const saveEditProgram = () => {
    if (editProgram) {
      updateProgram(user.id, editProgram.id, {
        ...editProgram,
        price: parseInt(editProgram.price),
        included: editProgram.included.filter(i => i.trim()),
      })
      setEditProgram(null)
      toast.success('Program updated!')
    }
  }

  const handleDeleteProgram = (programId) => {
    deleteProgram(user.id, programId)
    setConfirmDelete(null)
    toast.success('Program deleted!')
  }

  const handleDeleteAccount = () => {
    logout()
    toast.info('Account deleted')
    navigate('/')
  }

  const tabs = user.role === 'trainer'
    ? [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'programs', label: 'Programs', icon: Briefcase },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'clients', label: 'Clients', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'programs', label: 'My Programs', icon: Briefcase },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-20 h-20 rounded-sm bg-gray-200 dark:bg-dark-surface-2"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.role === 'trainer' ? 'Trainer' : 'Client'}</p>
          {user.role === 'trainer' && (
            <Link
              to={`/trainer/${user.id}`}
              target="_blank"
              className="text-sm text-blue-500 hover:underline mt-1 inline-block"
            >
              View public profile →
            </Link>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-dark-border mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-current text-black dark:text-white'
                  : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 bg-gray-50 dark:bg-dark-surface-2 border border-gray-200 dark:border-dark-border rounded text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:border-gray-400 resize-none"
              placeholder="Tell clients about yourself..."
            />
          </div>

          {user.role === 'trainer' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:border-gray-400"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={formData.yearsExperience}
                  onChange={e => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded focus:outline-none focus:border-gray-400"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.certifications.map(cert => (
                    <span
                      key={cert}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-dark-surface-2 rounded text-sm"
                    >
                      {cert}
                      <button
                        onClick={() => removeCertification(cert)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCert}
                    onChange={e => setNewCert(e.target.value)}
                    placeholder="Add certification..."
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={addCertification}
                    className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded text-sm hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Specialties</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.specialty.map(s => (
                    <span
                      key={s}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-dark-surface-2 rounded text-sm"
                    >
                      {s}
                      <button
                        onClick={() => removeSpecialty(s)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {specialties.filter(s => !formData.specialty.includes(s)).map(s => (
                    <button
                      key={s}
                      onClick={() => addSpecialty(s)}
                      className="px-3 py-1 border border-gray-200 dark:border-dark-border rounded text-sm hover:bg-gray-100 dark:hover:bg-dark-hover"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleSaveProfile}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            Save Changes
          </button>
        </div>
      )}

      {activeTab === 'programs' && user.role === 'trainer' && (
        <div>
          <button
            onClick={handleAddProgram}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            <Plus size={18} />
            Add Program
          </button>

          {programs.length === 0 ? (
            <p className="text-gray-500">No programs yet. Add your first program!</p>
          ) : (
            <div className="space-y-4">
              {programs.map(program => (
                <div
                  key={program.id}
                  className="p-4 border border-gray-200 dark:border-dark-border rounded"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{program.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{program.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-medium">${program.price}</span>
                        <span className="text-gray-400">{program.type === 'monthly' ? 'Monthly' : 'One-time'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProgram(program)}
                        className="text-sm px-3 py-1 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(program.id)}
                        className="text-sm px-3 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'programs' && user.role === 'client' && (
        <div>
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't purchased any programs yet.</p>
              <Link
                to="/discover"
                className="inline-block px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded"
              >
                Browse Trainers
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map(purchase => (
                <div
                  key={purchase.id}
                  className="p-4 border border-gray-200 dark:border-dark-border rounded"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{purchase.programName}</h3>
                      <p className="text-sm text-gray-500">{purchase.trainerName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>{purchase.type === 'monthly' ? 'Monthly' : 'One-time'}</span>
                        <span>•</span>
                        <span>Purchased {purchase.date}</span>
                      </div>
                    </div>
                    <Link
                      to={`/messages?trainer=${purchase.trainerId}`}
                      className="flex items-center gap-2 text-sm px-3 py-1.5 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
                    >
                      <MessageSquare size={14} />
                      Message Trainer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && user.role === 'trainer' && (
        <div>
          {reviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet.</p>
          ) : (
            <div>
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} showReply />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'clients' && user.role === 'trainer' && (
        <div>
          {clients.length === 0 ? (
            <p className="text-gray-500">No clients yet.</p>
          ) : (
            <div className="space-y-4">
              {clients.map(client => (
                <div
                  key={client.id}
                  className="p-4 border border-gray-200 dark:border-dark-border rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-surface-2"
                    />
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.programName} • {client.purchaseDate}</p>
                    </div>
                  </div>
                  <Link
                    to={`/messages?trainer=${client.id}`}
                    className="text-sm px-3 py-1.5 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
                  >
                    Message
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">Appearance</h3>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover text-sm ${
                darkMode ? 'bg-dark-surface' : 'bg-light-surface'
              }`}
            >
              <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-white' : 'bg-gray-300'}`}>
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${darkMode ? 'right-1 bg-black' : 'left-1 bg-white'}`}
                />
              </div>
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Notifications</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-hover">
                <span className="text-sm">Email notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={e => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-hover">
                <span className="text-sm">In-app notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.inApp}
                  onChange={e => setNotifications(prev => ({ ...prev, inApp: e.target.checked }))}
                  className="w-4 h-4"
                />
              </label>
            </div>
          </div>

          {user.role === 'trainer' && (
            <div>
              <h3 className="text-sm font-medium mb-3">Verification</h3>
              <div className="p-4 border border-gray-200 dark:border-dark-border rounded">
                <div className="flex items-center gap-3">
                  {user.verified ? (
                    <>
                      <CheckCircle size={20} className="text-blue-500" />
                      <span className="text-sm">Verified Trainer</span>
                    </>
                  ) : (
                    <>
                      <Clock size={20} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Verification pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="text-sm text-red-500 hover:underline"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!newProgram}
        onClose={() => setNewProgram(null)}
        title="Add Program"
        size="lg"
      >
        {newProgram && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Program Name</label>
              <input
                type="text"
                value={newProgram.name}
                onChange={e => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                placeholder="e.g., Strength Foundation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newProgram.description}
                onChange={e => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none resize-none"
                placeholder="Describe what clients will get..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  value={newProgram.price}
                  onChange={e => setNewProgram(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newProgram.type}
                  onChange={e => setNewProgram(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">What's Included</label>
              {newProgram.included.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => {
                      const updated = [...newProgram.included]
                      updated[i] = e.target.value
                      setNewProgram(prev => ({ ...prev, included: updated }))
                    }}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                    placeholder="e.g., 4 workouts per week"
                  />
                  {newProgram.included.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = newProgram.included.filter((_, idx) => idx !== i)
                        setNewProgram(prev => ({ ...prev, included: updated }))
                      }}
                      className="px-2 text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setNewProgram(prev => ({ ...prev, included: [...prev.included, ''] }))}
                className="text-sm text-blue-500 hover:underline"
              >
                + Add item
              </button>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setNewProgram(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
              >
                Cancel
              </button>
              <button
                onClick={saveNewProgram}
                disabled={!newProgram.name || !newProgram.price}
                className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50"
              >
                Save Program
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!editProgram}
        onClose={() => setEditProgram(null)}
        title="Edit Program"
        size="lg"
      >
        {editProgram && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Program Name</label>
              <input
                type="text"
                value={editProgram.name}
                onChange={e => setEditProgram(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={editProgram.description}
                onChange={e => setEditProgram(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  value={editProgram.price}
                  onChange={e => setEditProgram(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editProgram.type}
                  onChange={e => setEditProgram(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded text-sm focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="one-time">One-Time</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditProgram(null)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
              >
                Cancel
              </button>
              <button
                onClick={saveEditProgram}
                className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Program"
      >
        <p className="text-gray-500 mb-6">Are you sure you want to delete this program? This cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteProgram(confirmDelete)}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        title="Delete Account"
      >
        <p className="text-gray-500 mb-6">Are you sure you want to delete your account? All your data will be permanently removed.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDeleteAccount(false)}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete Account
          </button>
        </div>
      </Modal>
    </div>
  )
}
