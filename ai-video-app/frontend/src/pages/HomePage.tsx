import { Link } from 'react-router-dom'
import { Play, Star, Clock } from 'lucide-react'

const HomePage = () => {
  // TODO: Fetch content from API
  const mockContent = [
    {
      id: '1',
      title: 'AIアシスタント紹介動画',
      thumbnail: 'https://via.placeholder.com/320x180',
      duration: 180,
      rating: 4.5,
      views: 1234,
      plan: 'free'
    },
    {
      id: '2',
      title: 'バーチャルキャラクター配信',
      thumbnail: 'https://via.placeholder.com/320x180',
      duration: 600,
      rating: 4.8,
      views: 5678,
      plan: 'standard'
    },
    {
      id: '3',
      title: 'プレミアムAI映像体験',
      thumbnail: 'https://via.placeholder.com/320x180',
      duration: 480,
      rating: 5.0,
      views: 890,
      plan: 'premium'
    }
  ]
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  const getPlanBadge = (plan: string) => {
    const badges = {
      free: 'bg-green-100 text-green-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    }
    return badges[plan as keyof typeof badges] || badges.free
  }
  
  return (
    <div>
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">AI動画プラットフォームへようこそ</h1>
        <p className="text-xl text-gray-600">最新のAI技術で生成された高品質な動画コンテンツをお楽しみください</p>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold mb-6">人気のコンテンツ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockContent.map((content) => (
            <Link
              key={content.id}
              to={`/content/${content.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(content.duration)}
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPlanBadge(content.plan)}`}>
                    {content.plan.toUpperCase()}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-t-lg">
                  <Play className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{content.rating}</span>
                  </div>
                  <span>{content.views.toLocaleString()} 回視聴</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage