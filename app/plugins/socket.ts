import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { io, type Socket } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  if (!import.meta.client) {
    return {
      provide: {
        socket: null as Socket | null
      }
    }
  }

  const config = useRuntimeConfig()
  const socketUrl = config.public.socketUrl || 'http://localhost:4001'
  const socket = io(socketUrl, {
    transports: ['websocket']
  })

  return {
    provide: {
      socket
    }
  }
})