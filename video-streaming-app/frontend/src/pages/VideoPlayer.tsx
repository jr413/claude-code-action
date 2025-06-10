import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface VideoData {
  id: string
  title: string
  description: string
  creator_name: string
  creator_thumbnail: string
  thumbnail_url: string
  duration_seconds: number
  view_count: number
  like_count: number
  quality: string
  plan_required: string
}

interface StreamData {
  type: string
  url: string
  fallback_url: string
  duration: number
  quality: string
}

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout>()

  // Fetch video details
  const { data: video, isLoading: videoLoading } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const response = await api.get(`/content/videos/${id}`)
      return response.data as VideoData
    },
    onError: (error: any) => {
      if (error.response?.status === 403) {
        toast.error('Please upgrade your plan to watch this video')
        navigate('/subscription')
      }
    },
  })

  // Fetch stream URL
  const { data: streamData } = useQuery({
    queryKey: ['stream', id],
    queryFn: async () => {
      const response = await api.get(`/videos/stream/${id}`)
      return response.data as StreamData
    },
    enabled: !!video,
  })

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/videos/like/${id}`)
      return response.data
    },
    onSuccess: (data) => {
      setIsLiked(data.liked)
      toast.success(data.liked ? 'Added to likes' : 'Removed from likes')
    },
  })

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/videos/favorite/${id}`)
      return response.data
    },
    onSuccess: (data) => {
      setIsFavorited(data.favorited)
      toast.success(data.favorited ? 'Added to favorites' : 'Removed from favorites')
    },
  })

  // Progress tracking
  const trackProgress = async (currentTime: number, duration: number) => {
    try {
      await api.post(`/videos/progress/${id}`, {
        position: Math.floor(currentTime),
        duration: Math.floor(duration),
      })
    } catch (error) {
      console.error('Failed to track progress:', error)
    }
  }

  // Initialize video player
  useEffect(() => {
    if (!videoRef.current || !streamData) return

    const videoElement = document.createElement('video-js')
    videoElement.classList.add('vjs-big-play-centered')
    videoRef.current.appendChild(videoElement)

    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      fluid: true,
      sources: [
        {
          src: streamData.url,
          type: streamData.type === 'hls' ? 'application/x-mpegURL' : 'video/mp4',
        },
      ],
      poster: video?.thumbnail_url,
    })

    playerRef.current = player

    // Track progress every 10 seconds
    player.on('timeupdate', () => {
      const currentTime = player.currentTime()
      const duration = player.duration()

      if (currentTime && duration && !isNaN(duration)) {
        if (!progressIntervalRef.current) {
          progressIntervalRef.current = setInterval(() => {
            trackProgress(player.currentTime(), duration)
          }, 10000)
        }
      }
    })

    // Track completion
    player.on('ended', () => {
      if (player.duration()) {
        trackProgress(player.duration(), player.duration())
      }
    })

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (player && !player.isDisposed()) {
        player.dispose()
      }
      playerRef.current = null
    }
  }, [streamData, video])

  if (videoLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Video not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden mb-4">
            <div ref={videoRef} data-vjs-player className="w-full"></div>
          </div>

          {/* Video Info */}
          <div className="card">
            <div className="card-body">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {video.title}
              </h1>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={video.creator_thumbnail || 'https://via.placeholder.com/40'}
                    alt={video.creator_name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {video.creator_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {video.view_count} views
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => likeMutation.mutate()}
                    className={`btn ${
                      isLiked ? 'btn-primary' : 'btn-secondary'
                    } flex items-center space-x-2`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    <span>{video.like_count}</span>
                  </button>

                  <button
                    onClick={() => favoriteMutation.mutate()}
                    className={`btn ${
                      isFavorited ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {video.description && (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300">
                    {video.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Videos */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Related Videos
          </h2>
          <RelatedVideos currentVideoId={id!} />
        </div>
      </div>
    </div>
  )
}

function RelatedVideos({ currentVideoId }: { currentVideoId: string }) {
  const { data: videos, isLoading } = useQuery({
    queryKey: ['related-videos', currentVideoId],
    queryFn: async () => {
      const response = await api.get('/content/videos?limit=10')
      return response.data.videos.filter((v: any) => v.id !== currentVideoId)
    },
  })

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
  }

  return (
    <div className="space-y-4">
      {videos?.map((video: any) => (
        <a
          key={video.id}
          href={`/video/${video.id}`}
          className="flex space-x-3 group"
        >
          <img
            src={video.thumbnail_url || 'https://via.placeholder.com/120x68'}
            alt={video.title}
            className="w-32 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 line-clamp-2">
              {video.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{video.creator_name}</p>
            <p className="text-xs text-gray-500">
              {video.view_count} views • {Math.floor(video.duration_seconds / 60)} min
            </p>
          </div>
        </a>
      ))}
    </div>
  )
}