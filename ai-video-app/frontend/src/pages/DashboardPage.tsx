import { Clock, PlayCircle, CreditCard, TrendingUp } from 'lucide-react'

const DashboardPage = () => {
  // TODO: Fetch user data from API
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    plan: 'free',
    usage: {
      current: 5,
      limit: 20,
      resetDate: '2024-02-01'
    },
    stats: {
      totalViews: 45,
      totalTime: 3240, // seconds
      favorites: 8
    }
  }
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}時間${minutes}分`
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">アカウント情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">ユーザー名</p>
            <p className="font-medium">{userData.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">メールアドレス</p>
            <p className="font-medium">{userData.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">プラン</p>
            <p className="font-medium capitalize">{userData.plan}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">使用状況</p>
            <p className="font-medium">{userData.usage.current} / {userData.usage.limit} 回</p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総視聴回数</p>
              <p className="text-2xl font-bold">{userData.stats.totalViews}</p>
            </div>
            <PlayCircle className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総視聴時間</p>
              <p className="text-2xl font-bold">{formatTime(userData.stats.totalTime)}</p>
            </div>
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">お気に入り</p>
              <p className="text-2xl font-bold">{userData.stats.favorites}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">今月の利用</p>
              <p className="text-2xl font-bold">{userData.usage.current}回</p>
            </div>
            <CreditCard className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>
      
      {/* Plan Upgrade */}
      {userData.plan === 'free' && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-xl font-semibold mb-2">プレミアムプランにアップグレード</h3>
          <p className="mb-4">より高品質な動画と無制限のアクセスを楽しもう！</p>
          <button className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
            プランを見る
          </button>
        </div>
      )}
    </div>
  )
}

export default DashboardPage