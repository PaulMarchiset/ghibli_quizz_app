import { Room, SharedQuizQuestion } from './types'
import { roomStore } from './roomStore'
import { randomInt } from 'crypto'

const ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
const CODE_LENGTH = 6
const DEFAULT_TIME = 15

function generateCode(): string {
  return Array.from({ length: CODE_LENGTH }, () =>
    ALPHABET[randomInt(ALPHABET.length)]
  ).join('')
}

function createUniqueCode(): string {
  for (let i = 0; i < 10; i++) {
    const code = generateCode()
    if (!roomStore.has(code)) return code
  }
  throw new Error('Failed to generate room code')
}

/**
 * Managing game rooms : creation, joining, starting, submitting questions, answering and leaving.
 * @params socketId - the ID of the player's socket connection
 * @params playerName - the name of the player (optional, defaults to "Host" or "Player")
 * @params room - the current state of the room for operations like joining, starting, etc.
 * @returns the updated room state after each operation
 */

export const roomService = {
  createRoom(socketId: string, playerName?: string): Room {
    const code = createUniqueCode()

    const room: Room = {
      code,
      hostId: socketId,
      phase: 'lobby',
      questions: [],
      questionSeconds: DEFAULT_TIME,
      answeredByQuestion: {},
      players: [{ id: socketId, name: playerName?.trim() || 'Host', score: 0 }]
    }

    roomStore.set(code, room)
    roomStore.bindSocket(socketId, code)

    return room
  },

  joinRoom(room: Room, socketId: string, name?: string) {
    if (room.phase !== 'lobby') throw new Error('Game already started')

    if (!room.players.some(p => p.id === socketId)) {
      room.players.push({
        id: socketId,
        name: name?.trim() || 'Player',
        score: 0
      })
    }

    roomStore.bindSocket(socketId, room.code)
  },

  startGame(room: Room, socketId: string) {
    if (room.hostId !== socketId) throw new Error('Only host can start')

    room.phase = 'playing'
    room.questions = []
    room.answeredByQuestion = {}
    room.players.forEach(p => (p.score = 0))
  },

  resetToLobby(room: Room, socketId: string) {
    if (room.hostId !== socketId) throw new Error('Only host can reset room')

    room.phase = 'lobby'
    room.questions = []
    room.questionSeconds = DEFAULT_TIME
    room.answeredByQuestion = {}
    room.players.forEach(p => (p.score = 0))
  },

  submitQuestions(room: Room, socketId: string, questions: SharedQuizQuestion[], seconds: number) {
    if (room.hostId !== socketId) throw new Error('Only host')
    if (room.phase !== 'playing') throw new Error('Not playing')

    room.questions = questions
    room.questionSeconds = seconds
    room.answeredByQuestion = {}
  },

  answer(room: Room, socketId: string, questionId: string, choiceId: string) {
    if (room.phase !== 'playing') throw new Error('Room is not in playing state')

    const player = room.players.find(p => p.id === socketId)
    if (!player) throw new Error('Player not found')

    const question = room.questions.find(q => q.id === questionId)
    if (!question) throw new Error('Question not found')

    const answered = room.answeredByQuestion[questionId] ?? []
    if (answered.includes(socketId)) return { alreadyAnswered: true }

    room.answeredByQuestion[questionId] = [...answered, socketId]

    if (question.correctChoiceId === choiceId) {
      player.score++
    }

    const allAnswered = room.answeredByQuestion[questionId].length === room.players.length
    const isLast = room.questions.at(-1)?.id === questionId

    if (allAnswered && isLast) room.phase = 'ended'

    return { allAnswered, isLast }
  },

  leave(room: Room, socketId: string) {
    room.players = room.players.filter(p => p.id !== socketId)
    roomStore.unbindSocket(socketId)

    if (room.players.length === 0) {
      roomStore.delete(room.code)
      return
    }

    if (room.hostId === socketId) {
      room.hostId = room.players[0].id
    }
  }
}