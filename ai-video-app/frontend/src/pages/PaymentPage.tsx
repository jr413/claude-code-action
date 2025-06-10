import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import clsx from 'clsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'フリー',
    price: 0,
    features: [
      'プレビューのみ',
      'ウォーターマーク付き',
      '月0回まで',
    ],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    price: 2980,
    features: [
      'HD画質（720p）',
      'Runway Gen3映像',
      '月20回まで',
      '標準処理速度',
      '基本キャラクター',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    price: 8980,
    features: [
      '4K高画質',
      'Veo3最新AI映像',
      '月15回まで',
      '優先処理',
      '全キャラクター利用可能',
      '限定コンテンツ',
    ],
    recommended: true,
  },
];

export const PaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscription, isLoading, refetch } = useQuery(
    'subscription',
    async () => {
      const response = await axios.get('/payment/subscription');
      return response.data.data;
    }
  );

  const createCheckoutMutation = useMutation(
    async (planType: string) => {
      const response = await axios.post('/payment/create-checkout-session', {
        planType,
      });
      return response.data.data;
    },
    {
      onSuccess: async (data) => {
        const stripe = await stripePromise;
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            toast.error('決済ページへの移動に失敗しました');
          }
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || '決済の開始に失敗しました');
      },
    }
  );

  const cancelSubscriptionMutation = useMutation(
    async () => {
      await axios.post('/payment/cancel-subscription');
    },
    {
      onSuccess: () => {
        toast.success('サブスクリプションをキャンセルしました');
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'キャンセルに失敗しました');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const currentPlan = subscription?.planType || 'free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">料金プラン</h1>
        <p className="text-gray-400">
          あなたにぴったりのプランを選んでください
        </p>
      </div>

      {/* Current Subscription */}
      {subscription?.isActive && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                現在のプラン: {currentPlan === 'premium' ? 'プレミアム' : 'スタンダード'}
              </h3>
              <p className="text-gray-400 text-sm">
                次回更新日: {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-yellow-400 text-sm mt-1">
                  期間終了時にキャンセル予定
                </p>
              )}
            </div>
            {!subscription.cancelAtPeriodEnd && (
              <button
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isLoading}
                className="btn-secondary text-sm"
              >
                {cancelSubscriptionMutation.isLoading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  'キャンセル'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={clsx(
              'card p-6 relative',
              plan.recommended && 'ring-2 ring-primary-500',
              currentPlan === plan.id && 'bg-dark-300'
            )}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  おすすめ
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-white">
                ¥{plan.price.toLocaleString()}
                <span className="text-lg text-gray-400 font-normal">/月</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-primary-400 mr-2">✓</span>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            {currentPlan === plan.id ? (
              <button disabled className="btn-secondary w-full opacity-50">
                現在のプラン
              </button>
            ) : plan.id === 'free' ? (
              <button disabled className="btn-secondary w-full opacity-50">
                ダウングレード不可
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  createCheckoutMutation.mutate(plan.id);
                }}
                disabled={createCheckoutMutation.isLoading && selectedPlan === plan.id}
                className={clsx(
                  'w-full',
                  plan.recommended ? 'btn-primary' : 'btn-secondary'
                )}
              >
                {createCheckoutMutation.isLoading && selectedPlan === plan.id ? (
                  <LoadingSpinner size="small" />
                ) : (
                  'このプランを選ぶ'
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">よくある質問</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              プランの変更はいつでも可能ですか？
            </h3>
            <p className="text-gray-400">
              はい、いつでもプランの変更が可能です。アップグレードの場合は即座に反映され、
              ダウングレードの場合は次回請求サイクルから適用されます。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              使用回数はいつリセットされますか？
            </h3>
            <p className="text-gray-400">
              使用回数は毎月の請求日にリセットされます。未使用分の繰り越しはできません。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              解約はいつでもできますか？
            </h3>
            <p className="text-gray-400">
              はい、いつでも解約可能です。解約後も、お支払い済みの期間が終了するまで
              サービスをご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};