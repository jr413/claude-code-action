import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../lib/api'

interface Category {
  id: string
  name: string
  slug: string
}

interface Creator {
  id: string
  name: string
  slug: string
  thumbnail_url: string
  plan_required: string
}

interface Video {
  id: string
  title: string
  slug: string
  thumbnail_url: string
  creator_name: string
  duration_seconds: number
  view_count: number
  plan_required: string
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''
  const selectedCreator = searchParams.get('creator') || ''
  const searchQuery = searchParams.get('search') || ''
  const [search, setSearch] = useState(searchQuery)

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/content/categories')
      return response.data as Category[]
    },
  })

  // Fetch creators
  const { data: creatorsData } = useQuery({
    queryKey: ['creators', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      const response = await api.get(`/content/creators?${params}`)
      return response.data
    },
  })

  // Fetch videos
  const { data: videosData, isLoading } = useQuery({
    queryKey: ['videos', selectedCategory, selectedCreator, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedCreator) params.append('creator', selectedCreator)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '20')
      
      const response = await api.get(`/content/videos?${params}`)
      return response.data
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    setSearchParams(params)
  }

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams)
    if (categoryId) {
      params.set('category', categoryId)
    } else {
      params.delete('category')
    }
    params.delete('creator') // Reset creator when category changes
    setSearchParams(params)
  }

  const handleCreatorChange = (creatorId: string) => {
    const params = new URLSearchParams(searchParams)
    if (creatorId) {
      params.set('creator', creatorId)
    } else {
      params.delete('creator')
    }
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Browse Content</h1>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="input w-48"
            >
              <option value="">All Categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Creator Filter */}
          {creatorsData?.creators && creatorsData.creators.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Creator
              </label>
              <select
                value={selectedCreator}
                onChange={(e) => handleCreatorChange(e.target.value)}
                className="input w-48"
              >
                <option value="">All Creators</option>
                {creatorsData.creators.map((creator: Creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Featured Creators */}
      {!selectedCreator && creatorsData?.creators && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Featured Creators</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {creatorsData.creators
              .filter((creator: Creator) => creator.plan_required === 'free' || creator.plan_required === 'standard')
              .slice(0, 6)
              .map((creator: Creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleCreatorChange(creator.id)}
                  className="text-center group"
                >
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={creator.thumbnail_url || 'https://via.placeholder.com/80'}
                      alt={creator.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600">
                    {creator.name}
                  </p>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* Videos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {videosData?.videos && videosData.videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {videosData.videos.map((video: Video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No videos found</p>
            </div>
          )}

          {/* Pagination */}
          {videosData?.pagination && videosData.pagination.pages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-2">
                {Array.from({ length: videosData.pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams)
                      params.set('page', page.toString())
                      setSearchParams(params)
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      page === videosData.pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function VideoCard({ video }: { video: Video }) {
  return (
    <Link to={`/video/${video.id}`} className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={video.thumbnail_url || 'https://via.placeholder.com/640x360'}
            alt={video.title}
            className="w-full h-48 object-cover"
          />
          {video.plan_required !== 'free' && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded">
                {video.plan_required}
              </span>
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