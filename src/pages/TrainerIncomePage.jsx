import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { c, formatCurrency, calcFees } from '../lib/theme'

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'Custom', days: null },
]

function toDateStr(d) {
  return d.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function buildDateBuckets(start, end, granularity) {
  const buckets = []
  let current = new Date(start)
  while (current <= end) {
    buckets.push(new Date(current))
    if (granularity === 'week') {
      current.setDate(current.getDate() + 7)
    } else if (granularity === 'month') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + 1)
    }
  }
  return buckets
}

function bucketLabel(date, granularity) {
  if (granularity === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  if (granularity === 'week') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getGranularity(days) {
  if (days <= 30) return 'day'
  if (days <= 180) return 'week'
  return 'month'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold mb-2 text-gray-900 dark:text-white">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.value * 100)}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrainerIncomePage() {
  const { profile } = useAuth()
  const today = new Date()

  const [rangeIdx, setRangeIdx] = useState(1)
  const [customStart, setCustomStart] = useState(toDateStr(addDays(today, -30)))
  const [customEnd, setCustomEnd] = useState(toDateStr(today))
  const [ledger, setLedger] = useState([])
  const [loading, setLoading] = useState(true)
  const [trainerProfile, setTrainerProfile] = useState(null)

  const isCustom = RANGES[rangeIdx].days === null

  const getRange = useCallback(() => {
    if (isCustom) {
      return { start: new Date(customStart + 'T00:00'), end: new Date(customEnd + 'T23:59') }
    }
    const days = RANGES[rangeIdx].days
    return { start: addDays(today, -days + 1), end: today }
  }, [rangeIdx, customStart, customEnd, isCustom])

  const loadData = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { start, end } = getRange()

    const [ledgerRes, tpRes] = await Promise.all([
      supabase
        .from('earnings_ledger')
        .select('*')
        .eq('trainer_id', profile.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at'),

      supabase
        .from('trainer_profiles')
        .select('stripe_account_id, payout_enabled, stripe_account_status')
        .eq('user_id', profile.id)
        .single(),
    ])

    setLedger(ledgerRes.data || [])
    setTrainerProfile(tpRes.data)
    setLoading(false)
  }, [profile, getRange])

  useEffect(() => { loadData() }, [loadData])

  const { start, end } = getRange()
  const days = Math.ceil((end - start) / 86400000) + 1
  const granularity = getGranularity(days)
  const buckets = buildDateBuckets(start, end, granularity)

  const bucketData = buckets.map(bucketDate => {
    let nextBucket = new Date(bucketDate)
    if (granularity === 'month') nextBucket.setMonth(nextBucket.getMonth() + 1)
    else if (granularity === 'week') nextBucket.setDate(nextBucket.getDate() + 7)
    else nextBucket.setDate(nextBucket.getDate() + 1)

    const entries = ledger.filter(e => {
      const d = new Date(e.created_at)
      return d >= bucketDate && d < nextBucket
    })

    const gross = entries.reduce((s, e) => s + (e.gross_amount || 0), 0)
    const fee = entries.reduce((s, e) => s + (e.platform_fee_amount || 0), 0)
    const net = entries.reduce((s, e) => s + (e.net_amount || 0), 0)
    const payouts = entries.filter(e => e.payout_status === 'paid').reduce((s, e) => s + (e.net_amount || 0), 0)

    return {
      label: bucketLabel(bucketDate, granularity),
      Gross: parseFloat((gross / 100).toFixed(2)),
      Commission: parseFloat((fee / 100).toFixed(2)),
      Net: parseFloat((net / 100).toFixed(2)),
      Payouts: parseFloat((payouts / 100).toFixed(2)),
    }
  })

  const totals = ledger.reduce((acc, e) => ({
    gross: acc.gross + (e.gross_amount || 0),
    fee: acc.fee + (e.platform_fee_amount || 0),
    net: acc.net + (e.net_amount || 0),
    payouts: acc.payouts + (e.payout_status === 'paid' ? (e.net_amount || 0) : 0),
    pending: acc.pending + (e.payout_status === 'pending' ? (e.net_amount || 0) : 0),
  }), { gross: 0, fee: 0, net: 0, payouts: 0, pending: 0 })

  const prevStart = addDays(start, -(days))
  const prevEnd = addDays(start, -1)

  const openStripeDashboard = async () => {
    if (!trainerProfile?.stripe_account_id) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-connect?action=create_dashboard_link`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const json = await res.json()
      if (json.url) window.open(json.url, '_blank')
    } catch (err) {
      console.error('Dashboard link error:', err)
    }
  }

  const statCards = [
    {
      label: 'Gross Revenue',
      value: formatCurrency(totals.gross),
      sub: `${ledger.length} transactions`,
      color: 'text-gray-900 dark:text-white',
      icon: TrendingUp,
      iconColor: 'text-blue-500',
    },
    {
      label: 'Platform Fees',
      value: formatCurrency(totals.fee),
      sub: '15% commission',
      color: 'text-red-500',
      icon: ArrowDownRight,
      iconColor: 'text-red-500',
    },
    {
      label: 'Net Income',
      value: formatCurrency(totals.net),
      sub: 'After fees',
      color: 'text-green-600 dark:text-green-400',
      icon: DollarSign,
      iconColor: 'text-green-500',
    },
    {
      label: 'Payouts Received',
      value: formatCurrency(totals.payouts),
      sub: `${formatCurrency(totals.pending)} pending`,
      color: 'text-gray-900 dark:text-white',
      icon: ArrowUpRight,
      iconColor: 'text-green-500',
    },
  ]

  return (
    <div className={c.page}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={c.heading1}>Income</h1>
          <p className={c.muted}>Earnings, fees, and payout history</p>
        </div>
        {trainerProfile?.payout_enabled && (
          <button onClick={openStripeDashboard} className={c.btnSecondary + ' hidden md:inline-flex'}>
            <ExternalLink className="w-4 h-4" />
            Stripe Dashboard
          </button>
        )}
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRangeIdx(i)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors
                ${rangeIdx === i
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-[#0f0f0f] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {isCustom && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={e => setCustomStart(e.target.value)}
              className={c.inputSm + ' w-auto'}
            />
            <span className={c.muted}>to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={toDateStr(today)}
              onChange={e => setCustomEnd(e.target.value)}
              className={c.inputSm + ' w-auto'}
            />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label} className={c.statCard}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className={c.muted + ' text-xs mt-0.5'}>{stat.label}</p>
            <p className={c.tiny + ' mt-1'}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black dark:border-white" />
        </div>
      ) : ledger.length === 0 ? (
        <div className={`${c.card} p-12 text-center`}>
          <DollarSign className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className={c.heading3}>No earnings yet</p>
          <p className={c.muted + ' mt-1'}>Your income will appear here once clients complete bookings</p>
        </div>
      ) : (
        <>
          {/* Area chart — Gross vs Net */}
          <div className={c.card + ' p-5 mb-6'}>
            <h2 className={c.heading3 + ' mb-4'}>Revenue Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bucketData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v}`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Gross" stroke="#3b82f6" fill="url(#grossGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Net" stroke="#22c55e" fill="url(#netGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart — Net vs Payouts */}
          <div className={c.card + ' p-5 mb-6'}>
            <h2 className={c.heading3 + ' mb-4'}>Net Income vs Payouts Received</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v}`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Net" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Payouts" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction table */}
          <div className={c.card + ' overflow-hidden'}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <h2 className={c.heading3}>Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    {['Date', 'Gross', 'Fee', 'Net', 'Payout Status'].map(h => (
                      <th key={h} className={`px-5 py-3 text-left text-xs font-medium ${c.muted}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.slice().reverse().map(e => (
                    <tr key={e.id} className="border-b last:border-b-0 border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 font-medium">{formatCurrency(e.gross_amount || 0)}</td>
                      <td className="px-5 py-3 text-red-500">-{formatCurrency(e.platform_fee_amount || 0)}</td>
                      <td className="px-5 py-3 text-green-600 dark:text-green-400 font-medium">{formatCurrency(e.net_amount || 0)}</td>
                      <td className="px-5 py-3">
                        <span className={
                          e.payout_status === 'paid' ? c.badgeGreen :
                          e.payout_status === 'pending' ? c.badgeYellow :
                          e.payout_status === 'failed' ? c.badgeRed : c.badgeGray
                        }>
                          {e.payout_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Stripe payout setup CTA */}
      {!trainerProfile?.payout_enabled && (
        <div className="mt-6 p-5 border border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Payouts not enabled</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-0.5">
              Complete your Stripe Connect setup to receive payouts.
            </p>
            <a href="/trainer/onboarding?step=3" className="text-sm font-medium text-yellow-800 dark:text-yellow-300 underline mt-1 inline-block">
              Set up payouts
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
