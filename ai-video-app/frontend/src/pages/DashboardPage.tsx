import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const DashboardPage = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery(
    'userProfile',
    async () => {
      const response = await axios.get('/auth/me');
      return response.data.data;
    }
  );

  const { data: sessions, isLoading: sessionsLoading } = useQuery(
    'recentSessions',
    async () => {
      const response = await axios.get('/content/sessions?limit=5');
      return response.data.data;
    }
  );

  if (profileLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const usagePercentage = profile ? (profile.usage_count / profile.usage_limit) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          ようこそ、{user?.email}さん
        </h1>
        <p className="text-gray-400">
          今日も素敵な体験をお楽しみください
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Plan Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-300">現在のプラン</h3>
            <span className="text-2xl">💎</span>
          </div>
          <p className={`text-2xl font-bold ${
            profile?.plan_type === 'premium' ? 'text-yellow-400' :
            profile?.plan_type === 'standard' ? 'text-blue-400' :
            'text-gray-400'
          }`}>
            {profile?.plan_type === 'premium' ? 'プレミアム' :
             profile?.plan_type === 'standard' ? 'スタンダード' :
             'フリー'}
          </p>
          <Link
            to="/payment"
            className="mt-4 text-sm text-primary-400 hover:text-primary-300 inline-flex items-center"
          >
            プランを変更 →
          </Link>
        </div>

        {/* Usage Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-300">今月の利用状況</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">使用回数</span>
              <span className="text-white font-semibold">
                {profile?.usage_count || 0} / {profile?.usage_limit || 0}
              </span>
            </div>
            <div className="w-full bg-dark-400 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage >= 80 && (
              <p className="text-xs text-yellow-400 mt-1">
                使用回数が残りわずかです
              </p>
            )}
          </div>
        </div>

        {/* Quick Start Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-300">クイックスタート</h3>
            <span className="text-2xl">🚀</span>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            新しい体験を始めましょう
          </p>
          <Link
            to="/characters"
            className="btn-primary w-full text-center"
          >
            キャラクターを選ぶ
          </Link>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <div className="p-6 border-b border-dark-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">最近のセッション</h2>
            <Link
              to="/profile"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              すべて見る →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-dark-300">
          {sessions?.sessions?.length > 0 ? (
            sessions.sessions.map((session: any) => (
              <Link
                key={session.id}
                to={`/player/${session.id}`}
                className="block p-6 hover:bg-dark-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {session.character_display_name} - {session.scenario_title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {format(new Date(session.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.video_generation_status === 'completed'
                      ? 'bg-green-500/20 text-green-400'
                      : session.video_generation_status === 'processing'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : session.video_generation_status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {session.video_generation_status === 'completed' ? '完了' :
                     session.video_generation_status === 'processing' ? '処理中' :
                     session.video_generation_status === 'failed' ? '失敗' :
                     '保留中'}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center text-gray-400">
              まだセッションがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
};