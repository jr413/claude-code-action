import React, { useState, useEffect } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { MetricCard } from './MetricCard'
import { Chart } from './Chart'
import { DataTable } from './DataTable'
import { AudioPlayer } from './AudioPlayer'
import { ExportButton } from './ExportButton'
import { DashboardState, WebSocketMessage, TableColumn } from '../types'

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'wss://teleai-pro-api.onrender.com'

export const Dashboard: React.FC = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    metrics: [
      { id: '1', title: '総売上', value: '¥2,345,678', change: 12.5, changeType: 'increase', timestamp: new Date() },
      { id: '2', title: 'アクティブユーザー', value: '1,234', change: -3.2, changeType: 'decrease', unit: '人', timestamp: new Date() },
      { id: '3', title: '平均応答時間', value: '1.23', change: 0, changeType: 'neutral', unit: '秒', timestamp: new Date() },
      { id: '4', title: '顧客満足度', value: '4.8', change: 5.3, changeType: 'increase', unit: '/5', timestamp: new Date() },
    ],
    chartData: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [
        {
          label: '売上高',
          data: [1200000, 1900000, 1700000, 2100000, 2300000, 2345678],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
        {
          label: '利益',
          data: [300000, 450000, 400000, 520000, 580000, 600000],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
        }
      ]
    },
    tableData: [
      { id: '1', 顧客名: '株式会社A', ステータス: 'アクティブ', 売上: '¥500,000', 最終アクセス: '2024-01-20' },
      { id: '2', 顧客名: '株式会社B', ステータス: '保留中', 売上: '¥350,000', 最終アクセス: '2024-01-19' },
      { id: '3', 顧客名: '株式会社C', ステータス: 'アクティブ', 売上: '¥780,000', 最終アクセス: '2024-01-20' },
      { id: '4', 顧客名: '株式会社D', ステータス: 'アクティブ', 売上: '¥420,000', 最終アクセス: '2024-01-18' },
    ],
    audioFiles: [
      { id: '1', title: '会議録音 - 2024年1月20日', url: '/audio/meeting1.mp3', duration: 300, timestamp: new Date() },
      { id: '2', title: 'カスタマーコール - 田中様', url: '/audio/call1.mp3', duration: 180, timestamp: new Date() },
      { id: '3', title: '製品デモ - AI機能説明', url: '/audio/demo1.mp3', duration: 240, timestamp: new Date() },
    ],
    isLoading: false,
    error: null
  })

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocketメッセージ受信:', message)
    
    switch (message.type) {
      case 'metric_update':
        setDashboardState(prev => ({
          ...prev,
          metrics: prev.metrics.map(metric => 
            metric.id === message.data.id ? { ...metric, ...message.data } : metric
          )
        }))
        break
      case 'chart_update':
        setDashboardState(prev => ({
          ...prev,
          chartData: message.data
        }))
        break
      case 'table_update':
        setDashboardState(prev => ({
          ...prev,
          tableData: message.data
        }))
        break
      case 'audio_update':
        setDashboardState(prev => ({
          ...prev,
          audioFiles: [...prev.audioFiles, message.data]
        }))
        break
    }
  }

  const { isConnected } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('ダッシュボード接続完了'),
    onDisconnect: () => console.log('ダッシュボード接続切断'),
    onError: (error) => console.error('WebSocketエラー:', error)
  })

  const tableColumns: TableColumn[] = [
    { key: '顧客名', label: '顧客名', sortable: true },
    { key: 'ステータス', label: 'ステータス', sortable: true },
    { key: '売上', label: '売上', sortable: true },
    { key: '最終アクセス', label: '最終アクセス', sortable: true },
  ]

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    console.log(`${format}形式でエクスポート`)
    // エクスポート機能の実装
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              TeleAI エグゼクティブダッシュボード
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'リアルタイム接続中' : '接続なし'}
                </span>
              </div>
              <ExportButton onExport={handleExport} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dashboardState.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{dashboardState.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardState.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Chart
            type="line"
            data={dashboardState.chartData}
            title="売上・利益推移"
            height={350}
          />
          <Chart
            type="bar"
            data={{
              labels: ['製品A', '製品B', '製品C', '製品D', '製品E'],
              datasets: [{
                label: '販売数',
                data: [65, 59, 80, 81, 56],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(251, 146, 60, 0.8)',
                  'rgba(163, 230, 53, 0.8)',
                  'rgba(232, 121, 249, 0.8)',
                ],
              }]
            }}
            title="製品別販売実績"
            height={350}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable
              title="顧客一覧"
              columns={tableColumns}
              data={dashboardState.tableData}
              onRowClick={(row) => console.log('行クリック:', row)}
            />
          </div>
          <div>
            <AudioPlayer
              audioFiles={dashboardState.audioFiles}
              title="録音ファイル"
            />
          </div>
        </div>
      </main>
    </div>
  )
}