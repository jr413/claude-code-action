import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { WebSocketMessage } from '../types'

interface UseWebSocketOptions {
  url: string
  onMessage: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export const useWebSocket = ({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions) => {
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('WebSocket接続成功')
      onConnect?.()
    })

    socket.on('disconnect', () => {
      console.log('WebSocket切断')
      onDisconnect?.()
    })

    socket.on('error', (error) => {
      console.error('WebSocketエラー:', error)
      onError?.(new Error(error))
    })

    socket.on('message', (data: WebSocketMessage) => {
      onMessage(data)
    })

    socketRef.current = socket
  }, [url, onMessage, onConnect, onDisconnect, onError])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', { type, data, timestamp: new Date() })
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: socketRef.current?.connected ?? false,
    sendMessage,
    reconnect: connect,
    disconnect
  }
}