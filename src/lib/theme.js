// Shared CSS class helpers that work in both light and dark mode.
// Usage: import { c } from '../lib/theme'; then className={c.card}

export const c = {
  // Layouts
  page: 'max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8',
  pageNarrow: 'max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8',

  // Cards / surfaces
  card: 'bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl',
  cardHover: 'bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors',
  surface: 'bg-gray-50 dark:bg-[#111111]',
  surfaceAlt: 'bg-gray-100 dark:bg-[#1a1a1a]',

  // Inputs / forms
  input: 'w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
  inputSm: 'px-3 py-2 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100',
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5',
  select: 'w-full px-3 py-2 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100',
  textarea: 'w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-gray-100 resize-none',

  // Buttons
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
  btnPrimaryLg: 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium text-base hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
  btnSecondary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
  btnDanger: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
  btnGhost: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-colors',

  // Text
  heading1: 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-white',
  heading2: 'text-xl font-semibold text-gray-900 dark:text-white',
  heading3: 'text-base font-semibold text-gray-900 dark:text-white',
  body: 'text-sm text-gray-700 dark:text-gray-300',
  muted: 'text-sm text-gray-500 dark:text-gray-500',
  tiny: 'text-xs text-gray-400 dark:text-gray-600',

  // Badges
  badgeGreen: 'inline-flex items-center px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  badgeYellow: 'inline-flex items-center px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  badgeRed: 'inline-flex items-center px-2 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  badgeBlue: 'inline-flex items-center px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  badgeGray: 'inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',

  // Dividers / borders
  divider: 'border-t border-gray-200 dark:border-[#2a2a2a]',
  border: 'border-gray-200 dark:border-[#2a2a2a]',

  // Stat card
  statCard: 'p-5 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl',
}

export const TRAINER_ROLES = ['trainer_individual', 'trainer_business']
export const IS_TRAINER = (role) => TRAINER_ROLES.includes(role)

export const LISTING_TYPES = {
  single_session: 'Single Session',
  monthly_coaching: 'Monthly Coaching',
  recurring_package: 'Recurring Package',
  custom: 'Custom Service',
}

export const BILLING_INTERVALS = {
  one_time: 'One-time',
  per_session: 'Per session',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export const LOCATION_TYPES = {
  in_person: 'In-Person',
  online: 'Online',
  hybrid: 'Hybrid',
}

export const STRIPE_ACCOUNT_STATUSES = {
  not_started: { label: 'Not Started', color: 'badgeGray' },
  pending: { label: 'Pending Review', color: 'badgeYellow' },
  verified: { label: 'Verified', color: 'badgeGreen' },
  restricted: { label: 'Restricted', color: 'badgeRed' },
  rejected: { label: 'Rejected', color: 'badgeRed' },
}

export const PLATFORM_FEE_RATE = 0.15

export function calcFees(amountCents) {
  const fee = Math.round(amountCents * PLATFORM_FEE_RATE)
  return { fee, net: amountCents - fee }
}

export function formatCurrency(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatRelativeTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
