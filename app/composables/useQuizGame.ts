import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import {
  checkAnswer,
  generateQuiz,
  getQuestionFactoriesForSelection,
  type QuestionTypeKey,
  type QuizQuestion
} from '~/services/game/quizGame'

export type QuizFinishPayload = {
  score: number
  totalQuestions: number
}

export type UseQuizGameOptions = {
  questionTypes: Ref<QuestionTypeKey[]>
  quizLength: Ref<number>
  onFinished?: (payload: QuizFinishPayload) => void
}

export type QuizGameController = {
  questions: Ref<QuizQuestion[]>
  currentIndex: Ref<number>
  score: Ref<number>
  answered: Ref<boolean>
  lastCorrect: Ref<boolean | null>
  finished: Ref<boolean>
  selectedChoiceId: Ref<string | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  question: ComputedRef<QuizQuestion | null>
  timerKey: Ref<number>
  startQuiz: (count?: number) => Promise<void>
  advanceToNextQuestion: () => void
  onValidate: (payload: { selectedChoiceId: string | null }) => void
  onTimeout: () => void
  onAnswerSelected: (choiceId: string) => void
  preloadQuizImages: (list: QuizQuestion[]) => void
  scheduleAdvance: (delayMs?: number) => void
  clearFinalRevealTimeout: () => void
  applyQuestions: (list: QuizQuestion[]) => void
  resetGameState: () => void
  setOnFinished: (handler: (payload: QuizFinishPayload) => void) => void
}

/**
 * Composable for managing the core logic and state of a quiz game.
 * @param options Configuration options including game length, question types, and callbacks.
 * @returns An object containing reactive game state and control methods.
 * @NOTE I could do so much better with a proper state machine here, but this will do for now 🙃 (my bad les amis)
 */

export function useQuizGame(options: UseQuizGameOptions): QuizGameController {
  const questions = ref<QuizQuestion[]>([])
  const currentIndex = ref(0)
  const score = ref(0)

  const answered = ref(false)
  const lastCorrect = ref<boolean | null>(null)
  const finished = ref(false)
  const timerKey = ref(0)
  const selectedChoiceId = ref<string | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const pendingAdvanceTimeout = ref<number | null>(null)
  const finalRevealTimeout = ref<number | null>(null)
  const scoreSaved = ref(false)

  let onFinishedHandler = options.onFinished ?? null

  const question = computed(() => questions.value[currentIndex.value] ?? null)

  function setOnFinished(handler: (payload: QuizFinishPayload) => void) {
    onFinishedHandler = handler
  }

  function scheduleAdvance(delayMs = 700) {
    if (pendingAdvanceTimeout.value) {
      clearTimeout(pendingAdvanceTimeout.value)
      pendingAdvanceTimeout.value = null
    }

    pendingAdvanceTimeout.value = window.setTimeout(() => {
      pendingAdvanceTimeout.value = null
      advanceToNextQuestion()
    }, delayMs)
  }

  function clearFinalRevealTimeout() {
    if (finalRevealTimeout.value) {
      clearTimeout(finalRevealTimeout.value)
      finalRevealTimeout.value = null
    }
  }

  function resetGameState() {
    currentIndex.value = 0
    score.value = 0
    answered.value = false
    lastCorrect.value = null
    finished.value = false
    selectedChoiceId.value = null
    scoreSaved.value = false
  }

  function applyQuestions(list: QuizQuestion[]) {
    questions.value = list
    resetGameState()
    timerKey.value++
  }

  async function startQuiz(count = options.quizLength.value) {
    loading.value = true
    error.value = null
    clearFinalRevealTimeout()
    questions.value = []
    resetGameState()

    try {
      const factories = getQuestionFactoriesForSelection(options.questionTypes.value)
      const generated = await generateQuiz(count, factories)
      applyQuestions(generated)
      preloadQuizImages(generated)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function onValidate(payload: { selectedChoiceId: string | null }) {
    if (!question.value || answered.value) return
    if (!payload.selectedChoiceId) return

    const isCorrect = checkAnswer(question.value, payload.selectedChoiceId)

    answered.value = true
    lastCorrect.value = isCorrect

    if (isCorrect) {
      score.value++
    }

    // Solo mode: move quickly after validating.
    scheduleAdvance(800)
  }

  function onAnswerSelected(choiceId: string) {
    if (answered.value || finished.value) return
    selectedChoiceId.value = choiceId
  }

  function preloadQuizImages(list: QuizQuestion[]) {
    if (typeof window === 'undefined') return

    for (const q of list) {
      if (!q.image) continue
      try {
        const img = new Image()
        img.src = q.image
      } catch {
        // ignore preloading failures
      }
    }
  }

  function advanceToNextQuestion() {
    const isLastQuestion = currentIndex.value >= questions.value.length - 1

    if (!isLastQuestion) {
      answered.value = false
      lastCorrect.value = null
      selectedChoiceId.value = null
      currentIndex.value++
      return
    }

    clearFinalRevealTimeout()
    if (answered.value) {
      finalRevealTimeout.value = window.setTimeout(() => {
        finished.value = true
        finalRevealTimeout.value = null
      }, 1200)
    } else {
      finished.value = true
    }
  }

  function onTimeout() {
    if (!question.value || finished.value) return
    if (answered.value) return

    if (selectedChoiceId.value) {
      onValidate({ selectedChoiceId: selectedChoiceId.value })
      return
    }

    answered.value = true
    lastCorrect.value = false

    scheduleAdvance(400)
  }

  watch(currentIndex, () => {
    // Force Timer to remount/restart per question
    timerKey.value++
  })

  watch(finished, (value) => {
    if (!value || scoreSaved.value) return

    scoreSaved.value = true
    onFinishedHandler?.({
      score: score.value,
      totalQuestions: questions.value.length
    })
  })

  return {
    questions,
    currentIndex,
    score,
    answered,
    lastCorrect,
    finished,
    selectedChoiceId,
    loading,
    error,
    question,
    timerKey,
    startQuiz,
    advanceToNextQuestion,
    onValidate,
    onTimeout,
    onAnswerSelected,
    preloadQuizImages,
    scheduleAdvance,
    clearFinalRevealTimeout,
    applyQuestions,
    resetGameState,
    setOnFinished
  }
}
