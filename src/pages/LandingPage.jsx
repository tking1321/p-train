import { Link } from 'react-router-dom'
import { ArrowRight, Users, Calendar, MessageCircle, Shield, Zap, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { user } = useAuth()

  if (user) {
    return null
  }

  const features = [
    {
      icon: Search,
      title: 'Find Your Perfect Trainer',
      description: 'Browse qualified trainers by specialty, location, and price. Filter by availability and training style.',
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book sessions instantly. Choose in-person or online training that fits your schedule.',
    },
    {
      icon: MessageCircle,
      title: 'Direct Communication',
      description: 'Message trainers directly. Ask questions before you commit.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Pay safely through the platform. Your transactions are protected.',
    },
  ]

  const trainerFeatures = [
    {
      icon: Users,
      title: 'Build Your Client Base',
      description: 'Reach thousands of potential clients looking for trainers like you.',
    },
    {
      icon: Calendar,
      title: 'Manage Your Schedule',
      description: 'Set your availability. Accept bookings on your terms.',
    },
    {
      icon: Zap,
      title: 'Flexible Offerings',
      description: 'Create single sessions, packages, or monthly coaching plans.',
    },
  ]

  return (
    <div className="min-h-screen">
      <section className="relative px-4 py-20 md:py-32 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black -z-10"></div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Find Your Personal Trainer
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Connect with certified trainers for in-person or online sessions.
          Achieve your fitness goals with personalized guidance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Find a Trainer
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/signup?role=trainer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            Become a Trainer
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            For Clients
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            For Trainers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {trainerFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/signup?role=trainer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Start Training Clients
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24 bg-gray-50 dark:bg-gray-900 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to Start?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Join thousands of clients and trainers transforming fitness together.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Get Started Free
          <ArrowRight size={20} />
        </Link>
      </section>

      <footer className="px-4 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500 dark:text-gray-500">
          <p>P-Train - Connecting Trainers and Clients</p>
        </div>
      </footer>
    </div>
  )
}
