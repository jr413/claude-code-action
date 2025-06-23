import React from 'react'
import { Metric } from '../types'

interface MetricCardProps {
  metric: Metric
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getChangeIcon = () => {
    if (!metric.change) return null
    
    if (metric.changeType === 'increase') {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    } else if (metric.changeType === 'decrease') {
      return (
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )
    }
    return null
  }

  const getChangeColor = () => {
    if (metric.changeType === 'increase') return 'text-green-600'
    if (metric.changeType === 'decrease') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="metric-card">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.title}</h3>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline">
          <span className="text-2xl font-semibold text-gray-900">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
          )}
        </div>
        {metric.change !== undefined && (
          <div className={`flex items-center ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1 text-sm font-medium">
              {Math.abs(metric.change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}