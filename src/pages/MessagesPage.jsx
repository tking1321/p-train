import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function MessagesPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile) return
    loadConversations()
  }, [profile])

  const loadConversations = async () => {
    try {
      const field = profile.role === 'client' ? 'client_id' : 'trainer_id'
      const otherField = profile.role === 'client' ? 'trainer_id' : 'client_id'

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          ${profile.role === 'client' ? 'trainer' : 'client'}:profiles!conversations_${otherField}_fkey(id, name, avatar)
        `)
        .eq(field, profile.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      let conversationsWithMessages = []
      for (const conv of (data || [])) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, text, created_at, sender_id, read')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const unreadRes = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', profile.id)

        conversationsWithMessages.push({
          ...conv,
          otherUser: conv.trainer || conv.client,
          lastMessage: messages?.[0]?.text || 'No messages yet',
          timestamp: messages?.[0]?.created_at || conv.updated_at,
          unread: unreadRes.count || 0,
        })
      }

      setConversations(conversationsWithMessages)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 172800000) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (!profile) {
    navigate('/login')
    return null
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
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <p className="text-gray-500">No conversations yet.</p>
          {profile.role === 'client' && (
            <Link
              to="/search"
              className="inline-block mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg"
            >
              Find trainers
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <img
                src={conv.otherUser?.avatar}
                alt={conv.otherUser?.name}
                className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{conv.otherUser?.name}</span>
                  <span className="text-xs text-gray-500">{formatTime(conv.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
