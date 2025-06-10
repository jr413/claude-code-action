import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

interface DashboardData {
  recentVideos: any[]
  favorites: any[]
  recommendations: any[]
  stats: {
    videos_watched: number
    videos_completed: number
    watch_time_hours: number
  }
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [profile, history, favorites, recommendations] = await Promise.all([
        api.get('/users/profile'),
        api.get('/videos/history?limit=6'),
        api.get('/videos/favorites?limit=6'),
        api.get('/users/recommendations?limit=6'),
      ])

      return {
        recentVideos: history.data.history,
        favorites: favorites.data.favorites,
        recommendations: recommendations.data.recommendations,
        stats: profile.data.stats,
      } as DashboardData
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your account
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Videos Watched</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {dashboardData?.stats.videos_watched || 0}
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Completed</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {dashboardData?.stats.videos_completed || 0}
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Watch Time</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {dashboardData?.stats.watch_time_hours || 0} hours
            </p>
          </div>
        </div>
      </div>

      {/* Continue Watching */}
      {dashboardData?.recentVideos && dashboardData.recentVideos.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Continue Watching</h2>
            <Link to="/browse" className="text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.recentVideos.map((item) => (
              <VideoCard key={item.video_id} video={item} showProgress />
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {dashboardData?.favorites && dashboardData.favorites.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Favorites</h2>
            <Link to="/browse?filter=favorites" className="text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.favorites.map((item) => (
              <VideoCard key={item.video_id} video={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
            <Link to="/browse" className="text-primary-600 hover:text-primary-700">
              Explore more →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.recommendations.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* Subscription CTA */}
      {user?.plan_type === 'free' && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
          <p className="mb-6">
            Get unlimited access to all content in stunning 4K quality. No ads, no limits.
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-md hover:bg-gray-100"
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  )
}

interface VideoCardProps {
  video: any
  showProgress?: boolean
}

function VideoCard({ video, showProgress = false }: VideoCardProps) {
  const progress = showProgress && video.last_position_seconds && video.duration_seconds
    ? (video.last_position_seconds / video.duration_seconds) * 100
    : 0

  return (
    <Link to={`/video/${video.id || video.video_id}`} className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={video.thumbnail_url || 'https://via.placeholder.com/640x360'}
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-primary-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {video.creator_name}
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span>{video.view_count || 0} views</span>
            {video.duration_seconds && (
              <>
                <span className="mx-2">•</span>
                <span>{Math.floor(video.duration_seconds / 60)} min</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}