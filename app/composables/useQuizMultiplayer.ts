import { computed, ref, watch } from 'vue'
import { useGameRoom } from '~/composables/useGameRoom'
import {
  checkAnswer,
  generateQuiz,
  getQuestionFactoriesForSelection,
  type QuestionTypeKey,
  type QuizQuestion
} from '~/services/game/quizGame'
import type { QuizGameController } from '~/composables/useQuizGame'

export type MultiplayerStartPayload = {
  count: number
  questionTypes: QuestionTypeKey[]
  questionSeconds: number
}

/**
 * Composable for managing multiplayer-specific logic and synchronization in a quiz game.
 * @param quiz The base quiz game controller to extend with multiplayer functionality.
 * @returns An object containing multiplayer reactive state, computations, and extended control methods.
 */

export function useQuizMultiplayer(quiz: QuizGameController) {
  const gameRoom = useGameRoom()
  const waitingForSharedQuestions = ref(false)
  const lastHandledAdvanceQuestionId = ref<string | null>(null)

  const inMultiplayerRoom = computed(
    () => !!gameRoom.roomCode.value && gameRoom.phase.value === 'playing'
  )
  const leaderboardItems = computed(() =>
    inMultiplayerRoom.value ? gameRoom.players.value : []
  )
  const sharedQuestionSeconds = computed(() => gameRoom.sharedQuestionSeconds.value)
  const roomCode = computed(() => gameRoom.roomCode.value)

  const mySharedScore = computed(() => {
    if (!inMultiplayerRoom.value) return quiz.score.value

    const me = gameRoom.players.value.find((player) => player.id === gameRoom.playerId.value)
    if (me) return me.score

    return quiz.score.value
  })

  function handleSharedQuestions(nextQuestions: QuizQuestion[]) {
    quiz.applyQuestions(nextQuestions)
    quiz.preloadQuizImages(nextQuestions)
    waitingForSharedQuestions.value = false
    quiz.loading.value = false
    quiz.error.value = null
  }

  function handleAdvanceQuestion(questionId: string) {
    if (!quiz.question.value || quiz.question.value.id !== questionId) return

    lastHandledAdvanceQuestionId.value = questionId
    quiz.scheduleAdvance(700)
  }

  async function startMultiplayerQuiz(payload: MultiplayerStartPayload) {
    quiz.loading.value = true
    quiz.error.value = null
    waitingForSharedQuestions.value = false
    quiz.clearFinalRevealTimeout()
    quiz.questions.value = []
    quiz.resetGameState()

    try {
      if (Array.isArray(gameRoom.sharedQuestions.value) && gameRoom.sharedQuestions.value.length > 0) {
        handleSharedQuestions(gameRoom.sharedQuestions.value)
        return
      }

      if (gameRoom.isHost.value) {
        const factories = getQuestionFactoriesForSelection(payload.questionTypes)
        const generated = await generateQuiz(payload.count, factories)
        const publishResult = await gameRoom.publishQuestions(generated, payload.questionSeconds)
        if (!publishResult.ok) {
          throw new Error(publishResult.message ?? 'Unable to publish shared questions')
        }

        handleSharedQuestions(generated)
        return
      }

      waitingForSharedQuestions.value = true
    } catch (e) {
      quiz.error.value = e instanceof Error ? e.message : String(e)
    } finally {
      quiz.loading.value = false
    }
  }

  function onValidate(payload: { selectedChoiceId: string | null }) {
    if (!quiz.question.value || quiz.answered.value) return
    if (!payload.selectedChoiceId) return

    const isCorrect = checkAnswer(quiz.question.value, payload.selectedChoiceId)

    void gameRoom.submitAnswer(quiz.question.value.id, payload.selectedChoiceId)
    quiz.answered.value = true
    quiz.lastCorrect.value = isCorrect
  }

  function onTimeout() {
    if (!quiz.question.value || quiz.finished.value) return

    if (!quiz.answered.value && quiz.selectedChoiceId.value) {
      onValidate({ selectedChoiceId: quiz.selectedChoiceId.value })
    } else if (!quiz.answered.value) {
      quiz.answered.value = true
      quiz.lastCorrect.value = false
      void gameRoom.submitAnswer(quiz.question.value.id, '__timeout__')
    }

    quiz.scheduleAdvance(700)
  }

  watch(
    () => gameRoom.sharedQuestions.value,
    (nextQuestions) => {
      if (!inMultiplayerRoom.value) return
      if (!Array.isArray(nextQuestions) || nextQuestions.length === 0) return

      handleSharedQuestions(nextQuestions)
    },
    { immediate: true }
  )

  watch(
    () => gameRoom.advanceQuestionId.value,
    (questionId) => {
      if (!inMultiplayerRoom.value) return
      if (!questionId || questionId === lastHandledAdvanceQuestionId.value) return
      if (!quiz.question.value || quiz.question.value.id !== questionId) return

      handleAdvanceQuestion(questionId)
    }
  )

  return {
    waitingForSharedQuestions,
    inMultiplayerRoom,
    leaderboardItems,
    sharedQuestionSeconds,
    roomCode,
    mySharedScore,
    startMultiplayerQuiz,
    handleSharedQuestions,
    handleAdvanceQuestion,
    onValidate,
    onTimeout
  }
}
