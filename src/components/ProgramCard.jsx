import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProgramCard({ program, trainerId, trainerName, onPurchase }) {
  const { user, hasPurchasedFrom } = useAuth()
  const toast = useToast()
  const canPurchase = user?.role === 'client' || !user

  return (
    <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold">{program.name}</h4>
        <span
          className={`
            text-xs px-2 py-1 rounded flex-shrink-0
            ${program.type === 'monthly'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            }
          `}
        >
          {program.type === 'monthly' ? 'Monthly' : 'One-Time'}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
        {program.description}
      </p>

      <ul className="mt-3 space-y-1">
        {program.included?.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
            <span className="text-green-500 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
        <div>
          <span className="text-xl font-semibold">${program.price}</span>
          {program.type === 'monthly' && (
            <span className="text-sm text-gray-500">/month</span>
          )}
        </div>
        <button
          onClick={() => onPurchase(program, trainerId, trainerName)}
          disabled={user?.role === 'trainer'}
          className={`
            text-sm px-4 py-2 rounded transition-colors
            ${user?.role === 'trainer'
              ? 'bg-gray-100 dark:bg-dark-surface-2 text-gray-400 cursor-not-allowed'
              : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100'
            }
          `}
        >
          {user?.role === 'trainer' ? 'Trainer' : 'Purchase'}
        </button>
      </div>
    </div>
  )
}
