import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const updateUser = useAuthStore((state) => state.updateUser)

  useEffect(() => {
    // Refresh user data to get updated plan
    const refreshUserData = async () => {
      try {
        const response = await api.get('/users/profile')
        updateUser(response.data)
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }

    if (sessionId) {
      refreshUserData()
    }
  }, [sessionId, updateUser])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Thank you for your subscription. You now have access to premium content.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/browse"
            className="block w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Start Watching
          </Link>
          
          <Link
            to="/dashboard"
            className="block w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  )
}