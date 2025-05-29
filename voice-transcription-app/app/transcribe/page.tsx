'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileAudio, 
  Loader2,
  Check,
  X,
  Download,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'video/mp4']
    if (!validTypes.includes(selectedFile.type)) {
      setError('サポートされていないファイル形式です。MP3、WAV、M4A、MP4ファイルをアップロードしてください。')
      return
    }
    
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (selectedFile.size > maxSize) {
      setError('ファイルサイズが大きすぎます。100MB以下のファイルをアップロードしてください。')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate upload completion
    setTimeout(() => {
      setIsUploading(false)
      setIsTranscribing(true)
      
      // Simulate transcription
      setTimeout(() => {
        setIsTranscribing(false)
        setTranscriptionResult(`こちらは${file.name}の文字起こし結果のデモです。

実際の実装では、ここにOpenAI WhisperやAssemblyAIなどのAPIを使用して、アップロードされた音声ファイルの文字起こし結果が表示されます。

Voice Transcription Proは、最先端のAI技術を活用して、高精度な音声文字起こしを提供します。複数の話者の識別、タイムスタンプの付与、複数言語への対応など、プロフェッショナルな機能を備えています。`)
      }, 3000)
    }, 2000)
  }

  const handleDownload = (format: 'txt' | 'srt') => {
    if (!transcriptionResult) return

    const blob = new Blob([transcriptionResult], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcription.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center text-white hover:text-white/80">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            音声ファイルの文字起こし
          </h1>

          {!transcriptionResult ? (
            <>
              {/* File Upload */}
              <Card 
                className={`glass border-white/20 mb-6 ${isDragging ? 'ring-4 ring-white/50' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <CardContent className="p-8">
                  {error && (
                    <Alert className="mb-4 bg-red-500/20 border-red-500/50 text-white">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {!file ? (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Upload className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        ファイルをドラッグ&ドロップ
                      </h3>
                      <p className="text-white/70 mb-4">または</p>
                      <Button
                        onClick={() => document.getElementById('file-input')?.click()}
                        className="bg-white text-purple-700 hover:bg-white/90"
                      >
                        ファイルを選択
                      </Button>
                      <input
                        id="file-input"
                        type="file"
                        accept="audio/*,video/mp4"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                      <div className="flex gap-2 justify-center mt-4">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          最大100MB
                        </Badge>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          MP3/WAV/M4A/MP4
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <FileAudio className="w-8 h-8 text-white mr-3" />
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-white/70 text-sm">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFile(null)}
                          className="text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {isUploading && (
                        <div className="mb-4">
                          <Progress value={uploadProgress} className="mb-2" />
                          <p className="text-white/70 text-sm text-center">
                            アップロード中... {uploadProgress}%
                          </p>
                        </div>
                      )}
                      
                      {!isUploading && !isTranscribing && (
                        <Button
                          onClick={handleUpload}
                          className="w-full bg-white text-purple-700 hover:bg-white/90"
                        >
                          文字起こしを開始
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transcribing Status */}
              {isTranscribing && (
                <Card className="glass border-white/20">
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-12 h-12 text-white mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      文字起こし中...
                    </h3>
                    <p className="text-white/70">
                      AIが音声を解析しています。しばらくお待ちください。
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Transcription Result */
            <Card className="glass border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center">
                    <Check className="w-5 h-5 mr-2 text-green-400" />
                    文字起こし完了
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      setTranscriptionResult(null)
                      setUploadProgress(0)
                    }}
                    className="text-white hover:bg-white/10"
                  >
                    新規文字起こし
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <p className="text-white whitespace-pre-wrap">{transcriptionResult}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload('txt')}
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    TXTダウンロード
                  </Button>
                  <Button
                    onClick={() => handleDownload('srt')}
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    SRTダウンロード
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}