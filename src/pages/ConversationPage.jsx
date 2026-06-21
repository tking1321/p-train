import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, MoreVertical } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ConversationPage() {
  const { conversationId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadConversation()
  }, [conversationId, profile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async () => {
    try {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          client:profiles!conversations_client_id_fkey(id, name, avatar, role),
          trainer:profiles!conversations_trainer_id_fkey(id, name, avatar, role)
        `)
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      setConversation(conv)
      setOtherUser(profile.role === 'client' ? conv.trainer : conv.client)

      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgsError) throw msgsError
      setMessages(msgs || [])

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', profile.id)
        .eq('read', false)

      subscribeToMessages()
    } catch (error) {
      console.error('Error loading conversation:', error)
      navigate('/messages')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          receiver_id: otherUser.id,
          text: input.trim(),
          read: false,
        })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }

  let lastDate = null

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-10">
        <Link to="/messages" className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link to={`/trainer/${otherUser.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800"
          />
          <div className="min-w-0">
            <p className="font-semibold truncate">{otherUser.name}</p>
            <p className="text-xs text-gray-500 capitalize">{otherUser.role}</p>
          </div>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const msgDate = new Date(msg.created_at).toDateString()
            const showDate = msgDate !== lastDate
            lastDate = msgDate

            const isOwn = msg.sender_id === profile.id

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {formatDate(msg.created_at)}
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-black">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none text-sm"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
