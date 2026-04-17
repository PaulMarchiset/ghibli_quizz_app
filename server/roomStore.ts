import { Room } from './types'

const rooms = new Map<string, Room>()
const socketToRoom = new Map<string, string>()

/**
 * In-memory store for managing active rooms and tracking socket-to-room connections.
 */
export const roomStore = {
  get: (code: string) => rooms.get(code),
  set: (code: string, room: Room) => rooms.set(code, room),
  delete: (code: string) => rooms.delete(code),
  has: (code: string) => rooms.has(code),

  bindSocket(socketId: string, roomCode: string) {
    socketToRoom.set(socketId, roomCode)
  },

  unbindSocket(socketId: string) {
    socketToRoom.delete(socketId)
  },

  getRoomBySocket(socketId: string) {
    return socketToRoom.get(socketId)
  }
}