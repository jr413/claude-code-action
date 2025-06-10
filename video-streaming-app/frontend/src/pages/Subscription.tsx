import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '')

interface Plan {
  id: string
  name: string
  price: {
    monthly: number
    annually: number
  }
  features: string[]
  highlighted?: boolean
}

const plans: Plan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: {
      monthly: 2980,
      annually: 29800,
    },
    features: [
      '20 videos per month',
      'HD quality (720p)',
      'Watch on 2 devices',
      'Standard content library',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 8980,
      annually: 89800,
    },
    features: [
      'Unlimited videos',
      '4K quality',
      'Watch on 4 devices',
      'Full content library',
      'Exclusive releases',
      'Priority support',
    ],
    highlighted: true,
  },
]

export default function Subscription() {
  const user = useAuthStore((state) => state.user)
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annually'>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get('/payments/subscription')
      return response.data
    },
  })

  // Create checkout session
  const createCheckoutSession = useMutation({
    mutationFn: async ({ plan, interval }: { plan: string; interval: string }) => {
      const response = await api.post('/payments/create-checkout-session', {
        plan,
        interval,
      })
      return response.data
    },
    onSuccess: async (data) => {
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
        if (error) {
          toast.error(error.message || 'Failed to redirect to checkout')
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create checkout session')
      setIsLoading(null)
    },
  })

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      await api.post('/payments/cancel-subscription')
    },
    onSuccess: () => {
      toast.success('Subscription will be canceled at the end of the billing period')
    },
  })

  const handleSelectPlan = (planId: string) => {
    if (user?.plan_type === 'free') {
      setIsLoading(planId)
      createCheckoutSession.mutate({ plan: planId, interval: selectedInterval })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h1>
        <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
          Unlock premium content with our subscription plans
        </p>
      </div>

      {/* Current Subscription */}
      {subscription?.subscription && (
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Current Plan: {subscription.plan_type.toUpperCase()}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {subscription.subscription.cancel_at_period_end
                  ? `Cancels on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`
                  : `Renews on ${new Date(subscription.subscription.current_period_end).toLocaleDateString()}`}
              </p>
            </div>
            {!subscription.subscription.cancel_at_period_end && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel your subscription?')) {
                    cancelSubscription.mutate()
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setSelectedInterval('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedInterval === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedInterval('annually')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedInterval === 'annually'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Annually
            <span className="ml-1 text-xs text-green-600 dark:text-green-400">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card relative ${
              plan.highlighted
                ? 'ring-2 ring-primary-500 shadow-xl'
                : ''
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="card-body">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  ¥{plan.price[selectedInterval].toLocaleString()}
                </span>
                <span className="ml-1 text-xl text-gray-500">
                  /{selectedInterval === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              
              {selectedInterval === 'annually' && (
                <p className="mt-1 text-sm text-gray-500">
                  ¥{Math.round(plan.price.annually / 12).toLocaleString()}/mo when billed annually
                </p>
              )}
              
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-3 text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                {user?.plan_type === plan.id ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : user?.plan_type === 'premium' && plan.id === 'standard' ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                  >
                    Downgrade Not Available
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading === plan.id}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading === plan.id ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Free Plan Info */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Currently on the free plan? You get access to 5 videos per month in 480p quality.
        </p>
      </div>
    </div>
  )
}