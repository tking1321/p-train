import { Link } from 'react-router-dom'
import { Star, CheckCircle } from 'lucide-react'

export default function TrainerCard({ trainer }) {
  const startingPrice = trainer.programs?.length > 0
    ? trainer.programs.reduce((min, p) => Math.min(min, p.price), Infinity)
    : null

  return (
    <div className="border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface rounded hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
      <div className="p-4">
        <div className="flex gap-4">
          <img
            src={trainer.avatar}
            alt={trainer.name}
            className="w-20 h-20 rounded-sm object-cover bg-gray-200 dark:bg-dark-surface-2 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{trainer.name}</h3>
              {trainer.verified && (
                <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {trainer.specialty?.slice(0, 3).map(s => (
                <span
                  key={s}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-dark-surface-2 rounded"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span>{trainer.rating}</span>
              </div>
              <span>·</span>
              <span>{trainer.reviewCount} reviews</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {trainer.bio}
        </p>

        <div className="flex items-center justify-between mt-4">
          {startingPrice && (
            <span className="text-sm font-medium">
              From ${startingPrice}/{trainer.programs.find(p => p.price === startingPrice)?.type === 'monthly' ? 'mo' : 'one-time'}
            </span>
          )}
          <Link
            to={`/trainer/${trainer.id}`}
            className="text-sm px-4 py-2 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  )
}
