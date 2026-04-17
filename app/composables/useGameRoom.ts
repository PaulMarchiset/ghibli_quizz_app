import { computed, onUnmounted, ref, watch } from 'vue'
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

/**
 * Composable for managing multiplayer game room state and WebSocket interactions.
 * @returns An object containing reactive room state, player details, and methods for game actions.
 */

export function useGameRoom() {
  const nuxtApp = useNuxtApp()
  const socketRef = ref(nuxtApp.$socket)

  const roomState = useState<GameRoomState | null>('gameRoomState', () => null)
  const sharedQuestions = useState<QuizQuestion[] | null>('gameRoomSharedQuestions', () => null)
  const sharedQuestionSeconds = useState<number | null>('gameRoomSharedQuestionSeconds', () => null)
  const advanceQuestionId = useState<string | null>('gameRoomAdvanceQuestionId', () => null)
  const socketError = useState<string | null>('gameRoomSocketError', () => null)

  const playerId = computed(() => socketRef.value?.id ?? '')
  const roomCode = computed(() => roomState.value?.code ?? '')
  const players = computed(() => roomState.value?.players ?? [])
  const phase = computed<RoomPhase>(() => roomState.value?.phase ?? 'lobby')
  const hostId = computed(() => roomState.value?.hostId ?? '')
  const isHost = computed(() => !!playerId.value && playerId.value === hostId.value)
  const connected = computed(() => socketRef.value?.connected ?? false)

  const handleState = (nextState: GameRoomState) => {
    roomState.value = nextState
    socketError.value = null

    if (nextState.phase === 'lobby') {
      sharedQuestions.value = null
      sharedQuestionSeconds.value = null
      advanceQuestionId.value = null
    }
  }

  const handleQuestions = (payload: { questions?: QuizQuestion[]; questionSeconds?: number }) => {
    sharedQuestions.value = Array.isArray(payload?.questions) ? payload.questions : null
    sharedQuestionSeconds.value = typeof payload?.questionSeconds === 'number' ? payload.questionSeconds : null
    socketError.value = null
  }

  const handleError = (payload: { message?: string }) => {
    socketError.value = payload?.message ?? 'Erreur WebSocket'
  }

  const handleAdvance = (payload: { questionId?: string }) => {
    advanceQuestionId.value = typeof payload?.questionId === 'string' ? payload.questionId : null
  }

  const handleDisconnect = () => {
    socketError.value = 'Déconnecté de la salle de jeu'
  }

  let boundSocket: typeof socketRef.value | null = null

  function unbindSocket() {
    if (!boundSocket) return

    boundSocket.off('game:state', handleState)
    boundSocket.off('game:questions', handleQuestions)
    boundSocket.off('game:error', handleError)
    boundSocket.off('game:advance', handleAdvance)
    boundSocket.off('disconnect', handleDisconnect)
    boundSocket = null
  }

  function bindSocket(nextSocket: typeof socketRef.value | null | undefined) {
    if (!nextSocket || boundSocket === nextSocket) return

    unbindSocket()
    boundSocket = nextSocket

    boundSocket.on('game:state', handleState)
    boundSocket.on('game:questions', handleQuestions)
    boundSocket.on('game:error', handleError)
    boundSocket.on('game:advance', handleAdvance)
    boundSocket.on('disconnect', handleDisconnect)
  }

  function ensureListeners() {
    bindSocket(socketRef.value)
  }

  watch(
    () => nuxtApp.$socket,
    (nextSocket) => {
      socketRef.value = nextSocket
      bindSocket(nextSocket)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    unbindSocket()
  })

  function emitWithAck(event: string, payload: Record<string, unknown>) {
    return new Promise<AckResponse>((resolve) => {
      const activeSocket = socketRef.value
      if (!activeSocket) {
        resolve({ ok: false, message: 'L\'interface WebSocket n\'est pas disponible' })
        return
      }

      activeSocket.emit(event, payload, (response: AckResponse | undefined) => {
        resolve(response ?? { ok: false, message: 'Pas de réponse du serveur de salle' })
      })
    })
  }

  async function createGame(playerName: string) {
    ensureListeners()
    const response = await emitWithAck('game:create', { playerName })
    if (!response.ok) {
      socketError.value = response.message ?? 'Impossible de créer la salle'
      return { ok: false, message: socketError.value }
    }

    return { ok: true, roomCode: response.roomCode ?? '' }
  }

  async function joinGame(code: string, playerName: string) {
    ensureListeners()
    const response = await emitWithAck('game:join', { roomCode: code.toUpperCase(), playerName })
    if (!response.ok) {
      socketError.value = response.message ?? 'Impossible de rejoindre la salle'
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
      socketError.value = response.message ?? 'Impossible de démarrer la partie'
      return { ok: false, message: socketError.value }
    }

    return { ok: true }
  }

  async function resetGameToLobby() {
    if (!roomCode.value) {
      return { ok: false, message: 'No room selected' }
    }

    const response = await emitWithAck('game:reset', { roomCode: roomCode.value })
    if (!response.ok) {
      socketError.value = response.message ?? 'Impossible de réinitialiser la salle'
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
      socketError.value = response.message ?? 'Impossible de publier les questions partagées'
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
      socketError.value = response.message ?? 'Impossible de soumettre la réponse'
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
      socketError.value = response.message ?? 'Impossible de quitter la salle'
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
    resetGameToLobby,
    publishQuestions,
    submitAnswer,
    leaveGame,
    leaveLocalRoomState
  }
}
