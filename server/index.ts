import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'

type Player = { id: string; name: string; score: number }
type RoomPhase = 'lobby' | 'playing' | 'ended'
type SharedQuizQuestion = {
  id: string
  type: 'character-species' | 'character-movie' | 'movie-character' | 'japanese-name'
  prompt: string
  image?: string
  choices: { id: string; label: string }[]
  correctChoiceId: string
}
type Room = {
  code: string
  hostId: string
  players: Player[]
  phase: RoomPhase
  questions: SharedQuizQuestion[]
  questionSeconds: number
  answeredByQuestion: Record<string, string[]>
}

type CreatePayload = { playerName?: string }
type JoinPayload = { roomCode?: string; playerName?: string }
type StartPayload = { roomCode?: string }
type LeavePayload = { roomCode?: string }
type QuestionsPayload = { roomCode?: string; questions?: SharedQuizQuestion[]; questionSeconds?: number }
type AnswerPayload = { roomCode?: string; questionId?: string; choiceId?: string }
type Ack = (response: { ok: boolean; roomCode?: string; message?: string }) => void

const PORT = Number(process.env.SOCKET_PORT ?? 4001)
const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })
const rooms = new Map<string, Room>()

function roomState(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players
  }
}

function hasValidQuestions(value: unknown): value is SharedQuizQuestion[] {
  if (!Array.isArray(value) || value.length === 0) return false

  return value.every((q) => {
    if (!q || typeof q !== 'object') return false
    if (typeof q.id !== 'string') return false
    if (typeof q.prompt !== 'string') return false
    if (typeof q.correctChoiceId !== 'string') return false
    if (!Array.isArray(q.choices) || q.choices.length < 2) return false

    return q.choices.every((c: { id?: unknown; label?: unknown }) => {
      return typeof c.id === 'string' && typeof c.label === 'string'
    })
  })
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function normalizedName(playerName: string | undefined, fallback: string) {
  const value = playerName?.trim()
  return value || fallback
}

function removePlayerFromRoom(roomCode: string, socketId: string) {
  const room = rooms.get(roomCode)
  if (!room) return

  const idx = room.players.findIndex((p) => p.id === socketId)
  if (idx === -1) return

  room.players.splice(idx, 1)
  if (room.players.length === 0) {
    rooms.delete(roomCode)
    return
  }

  if (room.hostId === socketId) {
    room.hostId = room.players[0].id
  }

  io.to(roomCode).emit('game:state', roomState(room))
}

function validateRoomRequest(payload: { roomCode?: string }, cb?: Ack) {
  const roomCode = payload.roomCode?.trim().toUpperCase()
  if (!roomCode) {
    cb?.({ ok: false, message: 'Room code is required' })
    return null
  }

  const room = rooms.get(roomCode)
  if (!room) {
    cb?.({ ok: false, message: 'Room not found' })
    return null
  }

  return { roomCode, room }
}

io.on('connection', (socket: Socket) => {
  socket.on('game:create', (payload: CreatePayload = {}, cb?: Ack) => {
    const code = randomCode()
    const room: Room = {
      code,
      hostId: socket.id,
      phase: 'lobby',
      questions: [],
      questionSeconds: 15,
      answeredByQuestion: {},
      players: [{ id: socket.id, name: normalizedName(payload.playerName, 'Host'), score: 0 }]
    }

    rooms.set(code, room)
    socket.join(code)
    cb?.({ ok: true, roomCode: code })
    io.to(code).emit('game:state', roomState(room))
  })

  socket.on('game:join', (payload: JoinPayload = {}, cb?: Ack) => {
    const valid = validateRoomRequest(payload, cb)
    if (!valid) return
    const { roomCode, room } = valid

    if (room.phase !== 'lobby') return cb?.({ ok: false, message: 'Game already started' })

    const alreadyInRoom = room.players.some((player) => player.id === socket.id)
    if (!alreadyInRoom) {
      room.players.push({ id: socket.id, name: normalizedName(payload.playerName, 'Player'), score: 0 })
    }

    socket.join(roomCode)
    cb?.({ ok: true })
    io.to(roomCode).emit('game:state', roomState(room))
  })

  socket.on('game:start', (payload: StartPayload = {}, cb?: Ack) => {
  const valid = validateRoomRequest(payload, cb)
  if (!valid) return
  const { roomCode, room } = valid

  if (room.hostId !== socket.id) return cb?.({ ok: false, message: 'Only host can start' })

  room.phase = 'playing'
  room.questions = []
  room.questionSeconds = 15
  room.answeredByQuestion = {}
  for (const player of room.players) {
    player.score = 0
  }
  cb?.({ ok: true })
  io.to(roomCode).emit('game:state', roomState(room))
})

  socket.on('game:questions', (payload: QuestionsPayload = {}, cb?: Ack) => {
    const roomCode = payload.roomCode?.trim().toUpperCase()
    if (!roomCode) return cb?.({ ok: false, message: 'Room code is required' })

    const room = rooms.get(roomCode)
    if (!room) return cb?.({ ok: false, message: 'Room not found' })
    if (room.hostId !== socket.id) return cb?.({ ok: false, message: 'Only host can publish questions' })
    if (room.phase !== 'playing') return cb?.({ ok: false, message: 'Room is not in playing state' })
    if (!hasValidQuestions(payload.questions)) return cb?.({ ok: false, message: 'Invalid questions payload' })
    if (typeof payload.questionSeconds !== 'number' || payload.questionSeconds < 1) {
      return cb?.({ ok: false, message: 'Invalid question timer' })
    }

    room.questions = payload.questions
    room.questionSeconds = payload.questionSeconds
    room.answeredByQuestion = {}
    cb?.({ ok: true })
    io.to(roomCode).emit('game:questions', {
      questions: room.questions,
      questionSeconds: room.questionSeconds
    })
  })

  socket.on('game:answer', (payload: AnswerPayload = {}, cb?: Ack) => {
    const roomCode = payload.roomCode?.trim().toUpperCase()
    if (!roomCode) return cb?.({ ok: false, message: 'Room code is required' })

    const room = rooms.get(roomCode)
    if (!room) return cb?.({ ok: false, message: 'Room not found' })
    if (room.phase !== 'playing') return cb?.({ ok: false, message: 'Room is not in playing state' })

    const player = room.players.find((p) => p.id === socket.id)
    if (!player) return cb?.({ ok: false, message: 'Player is not in this room' })

    const questionId = payload.questionId?.trim()
    const choiceId = payload.choiceId?.trim()
    if (!questionId || !choiceId) {
      return cb?.({ ok: false, message: 'Question and choice are required' })
    }

    const question = room.questions.find((q) => q.id === questionId)
    if (!question) return cb?.({ ok: false, message: 'Question not found in room' })

    const answeredList = room.answeredByQuestion[questionId] ?? []
    if (answeredList.includes(socket.id)) {
      return cb?.({ ok: true })
    }

    room.answeredByQuestion[questionId] = [...answeredList, socket.id]

    if (question.correctChoiceId === choiceId) {
      player.score += 1
    }

    if (room.answeredByQuestion[questionId].length === room.players.length) {
      io.to(roomCode).emit('game:advance', { questionId })
    }

    io.to(roomCode).emit('game:state', roomState(room))

    cb?.({ ok: true })
  })

  socket.on('game:leave', (payload: LeavePayload = {}, cb?: Ack) => {
    const roomCode = payload.roomCode?.trim().toUpperCase()
    if (!roomCode) return cb?.({ ok: false, message: 'Room code is required' })

    removePlayerFromRoom(roomCode, socket.id)
    socket.leave(roomCode)
    cb?.({ ok: true })
  })

  socket.on('disconnect', () => {
    for (const [code, room] of rooms) {
      if (!room.players.some((p) => p.id === socket.id)) continue
      removePlayerFromRoom(code, socket.id)
    }
  })
})

httpServer.listen(PORT, () => {
  console.log(`Socket room server listening on :${PORT}`)
})