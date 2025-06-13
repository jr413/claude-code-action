import { useParams } from 'react-router-dom'
import { Play, Heart, Share2, Download, Clock, User } from 'lucide-react'
import { useState } from 'react'

const ContentPage = () => {
  const { id } = useParams()
  const [isFavorited, setIsFavorited] = useState(false)
  
  // TODO: Fetch content details from API
  const content = {
    id,
    title: 'AIアシスタント紹介動画',
    description: 'AI技術を使った革新的なアシスタントの紹介。最新のAI技術がどのように私たちの日常生活を変えていくかを詳しく解説します。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://via.placeholder.com/1280x720',
    duration: 180,
    creator: {
      name: 'AI Studio Pro',
      avatar: 'https://via.placeholder.com/40'
    },
    stats: {
      views: 1234,
      likes: 89,
      createdAt: '2024-01-15'
    },
    planRequired: 'free'
  }
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Video Player */}
      <div className="bg-black rounded-lg overflow-hidden mb-6">
        <video
          controls
          className="w-full"
          poster={content.thumbnailUrl}
        >
          <source src={content.videoUrl} type="video/mp4" />
          お使いのブラウザは動画タグをサポートしていません。
        </video>
      </div>
      
      {/* Content Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4">{content.title}</h1>
        
        {/* Stats and Actions */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <span>{content.stats.views.toLocaleString()} 回視聴</span>
            <span>{content.stats.createdAt}</span>
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatDuration(content.duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                isFavorited 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'お気に入り済み' : 'お気に入り'}</span>
            </button>
            
            <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Share2 className="h-5 w-5" />
              <span>共有</span>
            </button>
            
            <button className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="h-5 w-5" />
              <span>ダウンロード</span>
            </button>
          </div>
        </div>
        
        {/* Creator Info */}
        <div className="flex items-center mb-6">
          <img
            src={content.creator.avatar}
            alt={content.creator.name}
            className="w-12 h-12 rounded-full mr-4"
          />
          <div>
            <p className="font-semibold">{content.creator.name}</p>
            <p className="text-sm text-gray-600">クリエイター</p>
          </div>
          <button className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            フォロー
          </button>
        </div>
        
        {/* Description */}
        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold mb-2">説明</h3>
          <p className="text-gray-700">{content.description}</p>
        </div>
      </div>
    </div>
  )
}

export default ContentPage