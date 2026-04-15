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
  const fallbackSocketUrl = `${window.location.protocol}//${window.location.hostname}:4001`
  const configuredSocketUrl = config.public.socketUrl?.trim()
  const socketUrl = configuredSocketUrl
    ? configuredSocketUrl.includes('://')
      ? configuredSocketUrl
      : configuredSocketUrl.startsWith('localhost') || configuredSocketUrl.startsWith('127.0.0.1')
        ? `http://${configuredSocketUrl}`
        : `https://${configuredSocketUrl}`
    : fallbackSocketUrl
  const socket = io(socketUrl, {
    transports: ['websocket']
  })

  return {
    provide: {
      socket
    }
  }
})