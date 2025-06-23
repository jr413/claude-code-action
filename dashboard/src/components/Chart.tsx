import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import { ChartData } from '../types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartProps {
  type: 'line' | 'bar' | 'pie'
  data: ChartData
  title: string
  height?: number
}

export const Chart: React.FC<ChartProps> = ({ type, data, title, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: "'Noto Sans JP', sans-serif",
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: '600' as const,
          family: "'Noto Sans JP', sans-serif",
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: "'Noto Sans JP', sans-serif",
        },
        bodyFont: {
          family: "'Noto Sans JP', sans-serif",
        }
      }
    },
    scales: type !== 'pie' ? {
      x: {
        ticks: {
          font: {
            family: "'Noto Sans JP', sans-serif",
          }
        }
      },
      y: {
        ticks: {
          font: {
            family: "'Noto Sans JP', sans-serif",
          }
        }
      }
    } : undefined
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line options={options} data={data} />
      case 'bar':
        return <Bar options={options} data={data} />
      case 'pie':
        return <Pie options={options} data={data} />
      default:
        return null
    }
  }

  return (
    <div className="dashboard-card">
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  )
}