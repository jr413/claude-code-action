import React, { useState } from 'react'

interface ExportButtonProps {
  onExport: (format: 'csv' | 'json' | 'pdf') => void
  disabled?: boolean
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, disabled }) => {
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    onExport(format)
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="button-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>エクスポート</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              CSVとしてエクスポート
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              JSONとしてエクスポート
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              PDFとしてエクスポート
            </button>
          </div>
        </div>
      )}
    </div>
  )
}