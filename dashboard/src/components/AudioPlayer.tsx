import React, { useState, useRef, useEffect } from 'react'
import { AudioData } from '../types'

interface AudioPlayerProps {
  audioFiles: AudioData[]
  title?: string
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioFiles, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const currentFile = audioFiles[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleNext)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleNext)
    }
  }, [currentIndex])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % audioFiles.length)
    setIsPlaying(false)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + audioFiles.length) % audioFiles.length)
    setIsPlaying(false)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (audioFiles.length === 0) return null

  return (
    <div className="dashboard-card">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <audio ref={audioRef} src={currentFile?.url} />
      
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-900">{currentFile?.title}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {currentIndex + 1} / {audioFiles.length}
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="前の曲"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
            aria-label={isPlaying ? '一時停止' : '再生'}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="次の曲"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <h5 className="text-xs font-medium text-gray-700 mb-2">プレイリスト</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {audioFiles.map((file, index) => (
              <button
                key={file.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors ${
                  index === currentIndex ? 'bg-primary-100 text-primary-700' : 'text-gray-600'
                }`}
              >
                {index + 1}. {file.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}