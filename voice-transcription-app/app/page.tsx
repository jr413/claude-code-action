'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Upload, 
  Mic, 
  FileAudio, 
  Play, 
  Pause,
  Download,
  Check,
  Zap,
  Globe,
  Shield,
  Clock,
  BarChart,
  Sparkles
} from 'lucide-react'

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(25)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 100 ? prev + 1 : 0))
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              プロ級のAI音声文字起こし
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
              Voice Transcription Pro
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              最先端AIが実現する、驚異的な精度の音声文字起こしサービス
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 shadow-lg">
                <Upload className="mr-2 h-4 w-4" />
                無料で試す
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
                デモを見る
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" />
      </section>

      {/* File Upload Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card 
            className={`max-w-4xl mx-auto glass border-white/20 ${isDragging ? 'ring-4 ring-white/50' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
          >
            <CardContent className="p-12 text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Upload className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  ファイルをドラッグ&ドロップ
                </h2>
                <p className="text-white/80">
                  または クリックしてファイルを選択
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <FileAudio className="w-3 h-3 mr-1" />
                  MP3
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <FileAudio className="w-3 h-3 mr-1" />
                  WAV
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <FileAudio className="w-3 h-3 mr-1" />
                  M4A
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <FileAudio className="w-3 h-3 mr-1" />
                  MP4
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Real-time Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              リアルタイムデモ
            </h2>
            <p className="text-xl text-white/80">
              実際の文字起こし精度をご体験ください
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Audio Player */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mic className="mr-2" />
                  音声プレイヤー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/80">sample_audio.mp3</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        処理中
                      </Badge>
                    </div>
                    <Progress value={progress} className="mb-4" />
                    <div className="flex items-center justify-between">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause /> : <Play />}
                      </Button>
                      <span className="text-white/60">2:45 / 5:30</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcription Result */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileAudio className="mr-2" />
                  文字起こし結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="文字起こし結果がここに表示されます..."
                  value="本日は、Voice Transcription Proのデモをご覧いただきありがとうございます。私たちのAI技術は、業界最高水準の精度で音声を文字に変換します。"
                  readOnly
                />
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    <Download className="mr-2 h-4 w-4" />
                    テキスト保存
                  </Button>
                  <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    <Download className="mr-2 h-4 w-4" />
                    SRT保存
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              プロフェッショナル機能
            </h2>
            <p className="text-xl text-white/80">
              ビジネスに必要なすべての機能を提供
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "超高速処理",
                description: "1時間の音声を5分で文字起こし"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "多言語対応",
                description: "100以上の言語に対応"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "セキュリティ",
                description: "エンタープライズ級のデータ保護"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "リアルタイム",
                description: "ライブ音声の即時文字起こし"
              },
              {
                icon: <BarChart className="w-8 h-8" />,
                title: "分析機能",
                description: "話者識別・感情分析機能"
              },
              {
                icon: <Check className="w-8 h-8" />,
                title: "99.9%精度",
                description: "業界最高水準の認識精度"
              }
            ].map((feature, index) => (
              <Card key={index} className="glass border-white/20 hover:border-white/40 transition-all hover:scale-105">
                <CardHeader>
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center text-white mb-4 backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-white/70">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              シンプルな料金プラン
            </h2>
            <p className="text-xl text-white/80">
              あなたのニーズに合わせた最適なプランを
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "スターター",
                price: "¥0",
                period: "月額",
                features: [
                  "月10時間まで",
                  "基本的な文字起こし",
                  "5言語対応",
                  "メールサポート"
                ],
                popular: false
              },
              {
                name: "プロフェッショナル",
                price: "¥9,800",
                period: "月額",
                features: [
                  "月100時間まで",
                  "高精度文字起こし",
                  "50言語対応",
                  "話者識別機能",
                  "優先サポート"
                ],
                popular: true
              },
              {
                name: "エンタープライズ",
                price: "カスタム",
                period: "",
                features: [
                  "無制限利用",
                  "最高精度",
                  "全言語対応",
                  "API連携",
                  "専任サポート",
                  "SLA保証"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <Card key={index} className={`glass border-white/20 ${plan.popular ? 'ring-2 ring-white/50 scale-105' : ''}`}>
                <CardHeader>
                  {plan.popular && (
                    <Badge className="mb-2 bg-yellow-500 text-yellow-900">
                      人気プラン
                    </Badge>
                  )}
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.period && <span className="text-white/70 ml-2">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-white/80">
                        <Check className="w-5 h-5 mr-2 text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-white text-purple-700 hover:bg-white/90">
                    {plan.name === "エンタープライズ" ? "お問い合わせ" : "無料で始める"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}