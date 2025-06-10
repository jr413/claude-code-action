import { Link } from 'react-router-dom'

export default function PaymentCancel() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100">
            <svg
              className="h-10 w-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Canceled
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Your payment was canceled. No charges were made to your account.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/subscription"
            className="block w-full py-3 px-4 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            View Plans Again
          </Link>
          
          <Link
            to="/dashboard"
            className="block w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you experienced any issues during checkout, please{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}