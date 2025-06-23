export interface Metric {
  id: string
  title: string
  value: number | string
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  unit?: string
  timestamp: Date
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

export interface TableRow {
  id: string
  [key: string]: any
}

export interface AudioData {
  id: string
  title: string
  url: string
  duration: number
  timestamp: Date
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
}

export interface DashboardState {
  metrics: Metric[]
  chartData: ChartData
  tableData: TableRow[]
  audioFiles: AudioData[]
  isLoading: boolean
  error: string | null
}

export interface WebSocketMessage {
  type: 'metric_update' | 'chart_update' | 'table_update' | 'audio_update'
  data: any
  timestamp: Date
}