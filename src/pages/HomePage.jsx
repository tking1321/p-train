import { Link } from 'react-router-dom'
import { CheckCircle, Calendar, MessageSquare, Star, User, Shield, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TrainerCard from '../components/TrainerCard'

export default function HomePage() {
  const { getAllTrainers } = useAuth()
  const featuredTrainers = getAllTrainers().slice(0, 4)

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark')
    document.documentElement.classList.toggle('light')
    localStorage.setItem('trainrhub_theme', isDark ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen">
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Find Your Trainer.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Browse verified personal trainers, compare programs, and start your journey.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/discover"
              className="w-full sm:w-auto px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Browse Trainers
            </Link>
            <Link
              to="/signup?role=trainer"
              className="w-full sm:w-auto px-8 py-3 border border-black dark:border-white font-medium rounded hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              Join as a Trainer
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-gray-200 dark:border-dark-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">Why TrainrHub</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-current rounded mb-4">
                <Shield size={24} />
              </div>
              <h3 className="font-semibold mb-2">Verified Profiles</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trainers are real and reviewed. Every profile is vetted for authenticity.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-current rounded mb-4">
                <Calendar size={24} />
              </div>
              <h3 className="font-semibold mb-2">Flexible Programs</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                One-time or monthly options to fit your schedule and commitment level.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-current rounded mb-4">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-semibold mb-2">Direct Messaging</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contact trainers before you commit. Get answers to your questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              { num: 1, title: 'Browse trainer profiles', desc: 'Search and filter by specialty, price, and rating' },
              { num: 2, title: 'Review programs and pricing', desc: 'Compare what each trainer offers' },
              { num: 3, title: 'Purchase a program', desc: 'Secure checkout with instant access' },
              { num: 4, title: 'Access direct messaging', desc: 'Connect with your trainer directly' },
            ].map(step => (
              <div key={step.num} className="flex items-start gap-4">
                <div className="w-8 h-8 flex items-center justify-center border border-current rounded text-sm font-medium flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 border-t border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Trainer Spotlight</h2>
            <Link
              to="/discover"
              className="text-sm hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {featuredTrainers.map(trainer => (
              <div key={trainer.id} className="min-w-[280px] sm:min-w-[320px] snap-start">
                <TrainerCard trainer={trainer} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 border-t border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-black dark:text-white">TrainrHub</span>
              <Link to="#" className="hover:text-current">About</Link>
              <Link to="#" className="hover:text-current">Terms</Link>
              <Link to="#" className="hover:text-current">Privacy</Link>
              <Link to="#" className="hover:text-current">Contact</Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="text-xs px-3 py-1.5 border border-gray-200 dark:border-dark-border rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors"
              >
                {document.documentElement.classList.contains('dark') ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            <p className="text-xs text-gray-400">© 2024 TrainrHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
