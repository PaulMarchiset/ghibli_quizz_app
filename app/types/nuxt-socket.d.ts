import type { Socket } from 'socket.io-client'

declare module '#app' {
  interface NuxtApp {
    $socket: Socket | null
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $socket: Socket | null
  }
}

export {}
