import { Server, Socket } from 'socket.io'
import { roomService } from './roomService'
import { roomStore } from './roomStore'
import { requireRoomCode } from './roomValidation'

function roomState(room: any) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players
  }
}

/**
 * Registers WebSocket event handlers for a client connection.
 * @param io The Socket.IO server instance.
 * @param socket The connected client socket.
 */

export function registerHandlers(io: Server, socket: Socket) {

  socket.on('game:create', (payload, cb) => {
    try {
      const room = roomService.createRoom(socket.id, payload?.playerName)
      socket.join(room.code)
      cb?.({ ok: true, roomCode: room.code })
      io.to(room.code).emit('game:state', roomState(room))
    } catch (e: any) {
      cb?.({ ok: false, message: e.message })
    }
  })

  socket.on('game:join', (payload, cb) => {
    try {
      const code = requireRoomCode(payload?.roomCode)
      const room = roomStore.get(code)
      if (!room) throw new Error('Room not found')

      roomService.joinRoom(room, socket.id, payload?.playerName)

      socket.join(code)
      cb?.({ ok: true })
      io.to(code).emit('game:state', roomState(room))
    } catch (e: any) {
      cb?.({ ok: false, message: e.message })
    }
  })

  socket.on('game:answer', (payload, cb) => {
    try {
      const code = requireRoomCode(payload?.roomCode)
      const room = roomStore.get(code)
      if (!room) throw new Error('Room not found')

      const result = roomService.answer(
        room,
        socket.id,
        payload.questionId,
        payload.choiceId
      )

      if (result.allAnswered && !result.isLast) {
        io.to(code).emit('game:advance', { questionId: payload.questionId })
      }

      io.to(code).emit('game:state', roomState(room))
      cb?.({ ok: true })
    } catch (e: any) {
      cb?.({ ok: false, message: e.message })
    }
  })

  socket.on('disconnect', () => {
    const code = roomStore.getRoomBySocket(socket.id)
    if (!code) return

    const room = roomStore.get(code)
    if (!room) return

    roomService.leave(room, socket.id)
    io.to(code).emit('game:state', roomState(room))
  })
}