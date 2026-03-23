import { computed } from 'vue'
import type { QuizQuestion } from '../services/game/quizGame'

export type RoomPlayer = {
  id: string
  name: string
  score: number
}

export type RoomPhase = 'lobby' | 'playing' | 'ended'

export type GameRoomState = {
  code: string
  hostId: string
  phase: RoomPhase
  players: RoomPlayer[]
}

type AckResponse = {
  ok: boolean
  message?: string
  roomCode?: string
}

export function useGameRoom() {
  const nuxtApp = useNuxtApp()
  const socket = nuxtApp.$socket

  const roomState = useState<GameRoomState | null>('gameRoomState', () => null)
  const sharedQuestions = useState<QuizQuestion[] | null>('gameRoomSharedQuestions', () => null)
  const sharedQuestionSeconds = useState<number | null>('gameRoomSharedQuestionSeconds', () => null)
  const advanceQuestionId = useState<string | null>('gameRoomAdvanceQuestionId', () => null)
  const socketError = useState<string | null>('gameRoomSocketError', () => null)
  const listenerBound = useState<boolean>('gameRoomListenerBound', () => false)

  const playerId = computed(() => socket?.id ?? '')
  const roomCode = computed(() => roomState.value?.code ?? '')
  const players = computed(() => roomState.value?.players ?? [])
  const phase = computed<RoomPhase>(() => roomState.value?.phase ?? 'lobby')
  const hostId = computed(() => roomState.value?.hostId ?? '')
  const isHost = computed(() => !!playerId.value && playerId.value === hostId.value)
  const connected = computed(() => socket?.connected ?? false)

  function ensureListeners() {
    if (!socket || listenerBound.value) return

    socket.on('game:state', (nextState: GameRoomState) => {
      roomState.value = nextState
      socketError.value = null

      if (nextState.phase === 'lobby') {
        sharedQuestions.value = null
        sharedQuestionSeconds.value = null
        advanceQuestionId.value = null
      }
    })

    socket.on('game:questions', (payload: { questions?: QuizQuestion[]; questionSeconds?: number }) => {
      sharedQuestions.value = Array.isArray(payload?.questions) ? payload.questions : null
      sharedQuestionSeconds.value = typeof payload?.questionSeconds === 'number' ? payload.questionSeconds : null
      socketError.value = null
    })

    socket.on('game:error', (payload: { message?: string }) => {
      socketError.value = payload?.message ?? 'WebSocket error'
    })

    socket.on('game:advance', (payload: { questionId?: string }) => {
      advanceQuestionId.value = typeof payload?.questionId === 'string' ? payload.questionId : null
    })

    socket.on('disconnect', () => {
      socketError.value = 'Disconnected from room server'
    })

    listenerBound.value = true
  }

  function emitWithAck(event: string, payload: Record<string, unknown>) {
    return new Promise<AckResponse>((resolve) => {
      if (!socket) {
        resolve({ ok: false, message: 'Socket is unavailable on server-side rendering.' })
        return
      }

      socket.emit(event, payload, (response: AckResponse | undefined) => {
        resolve(response ?? { ok: false, message: 'No response from room server' })
      })
    })
  }

  async function createGame(playerName: string) {
    ensureListeners()
    const response = await emitWithAck('game:create', { playerName })
    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to create room'
      return { ok: false, message: socketError.value }
    }

    return { ok: true, roomCode: response.roomCode ?? '' }
  }

  async function joinGame(code: string, playerName: string) {
    ensureListeners()
    const response = await emitWithAck('game:join', { roomCode: code.toUpperCase(), playerName })
    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to join room'
      return { ok: false, message: socketError.value }
    }

    return { ok: true }
  }

  async function startGame() {

    if (!roomCode.value) {
      return { ok: false, message: 'No room selected' }
    }

    const response = await emitWithAck('game:start', { roomCode: roomCode.value })
    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to start game'
      return { ok: false, message: socketError.value }
    }

    return { ok: true }
  }

  async function publishQuestions(questions: QuizQuestion[], questionSeconds: number) {
    if (!roomCode.value) {
      return { ok: false, message: 'No room selected' }
    }

    const response = await emitWithAck('game:questions', {
      roomCode: roomCode.value,
      questions,
      questionSeconds
    })

    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to publish shared questions'
      return { ok: false, message: socketError.value }
    }

    return { ok: true }
  }

  async function submitAnswer(questionId: string, choiceId: string) {
    if (!roomCode.value) {
      return { ok: false, message: 'No room selected' }
    }

    const response = await emitWithAck('game:answer', {
      roomCode: roomCode.value,
      questionId,
      choiceId
    })

    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to submit answer'
      return { ok: false, message: socketError.value }
    }

    return { ok: true }
  }

  async function leaveGame() {
    if (!roomCode.value) {
      leaveLocalRoomState()
      return { ok: true }
    }

    const response = await emitWithAck('game:leave', { roomCode: roomCode.value })
    if (!response.ok) {
      socketError.value = response.message ?? 'Unable to leave room'
      return { ok: false, message: socketError.value }
    }

    leaveLocalRoomState()
    return { ok: true }
  }

  function leaveLocalRoomState() {
    roomState.value = null
    sharedQuestions.value = null
    sharedQuestionSeconds.value = null
    advanceQuestionId.value = null
    socketError.value = null
  }

  return {
    roomState,
    sharedQuestions,
    sharedQuestionSeconds,
    advanceQuestionId,
    socketError,
    playerId,
    roomCode,
    players,
    phase,
    hostId,
    isHost,
    connected,
    createGame,
    joinGame,
    startGame,
    publishQuestions,
    submitAnswer,
    leaveGame,
    leaveLocalRoomState
  }
}
