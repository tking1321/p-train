import { Star } from 'lucide-react'

export default function ReviewCard({ review, showReply = false, onReply }) {
  return (
    <div className="border-b border-gray-200 dark:border-dark-border py-4 first:pt-0 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-dark-surface-2 flex items-center justify-center text-sm font-medium flex-shrink-0">
          {review.clientName?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{review.clientName}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={12}
                  className={i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{review.text}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>{review.date}</span>
            {showReply && (
              <button
                onClick={() => onReply?.(review)}
                className="text-blue-500 hover:underline"
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
