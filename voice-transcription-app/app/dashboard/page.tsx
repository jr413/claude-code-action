import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileAudio, 
  Clock, 
  Globe, 
  Upload,
  BarChart,
  Settings,
  LogOut
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Voice Transcription Pro</h1>
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30">
                無料プラン
              </Badge>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  ログアウト
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileAudio, label: '文字起こし済み', value: '0', unit: 'ファイル' },
            { icon: Clock, label: '合計時間', value: '0', unit: '分' },
            { icon: Globe, label: '対応言語', value: '5', unit: '言語' },
            { icon: BarChart, label: '今月の使用量', value: '0', unit: '時間' },
          ].map((stat, index) => (
            <Card key={index} className="glass border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">
                      {stat.value}
                      <span className="text-lg font-normal ml-1">{stat.unit}</span>
                    </p>
                  </div>
                  <stat.icon className="w-8 h-8 text-white/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="mr-2" />
                新規文字起こし
              </CardTitle>
              <CardDescription className="text-white/70">
                音声ファイルをアップロードして文字起こしを開始
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/transcribe">
                <Button className="w-full bg-white text-purple-700 hover:bg-white/90">
                  ファイルをアップロード
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2" />
                アカウント設定
              </CardTitle>
              <CardDescription className="text-white/70">
                プランの変更や設定の管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings">
                <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                  設定を開く
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transcriptions */}
        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white">最近の文字起こし</CardTitle>
            <CardDescription className="text-white/70">
              過去の文字起こしファイルを管理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileAudio className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">まだ文字起こしファイルがありません</p>
              <p className="text-white/50 text-sm mt-2">
                音声ファイルをアップロードして始めましょう
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}