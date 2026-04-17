import { ref, watch, type ComputedRef, type Ref } from 'vue'
import { reportQuestionIssue } from '~/services/api/Reports'
import type { QuizQuestion } from '~/services/game/quizGame'

export type QuestionReportingOptions = {
  question: ComputedRef<QuizQuestion | null>
  questions: Ref<QuizQuestion[]>
  currentIndex: Ref<number>
  selectedChoiceId: Ref<string | null>
  answered: Ref<boolean>
  playerName: ComputedRef<string>
  inMultiplayerRoom: ComputedRef<boolean>
  roomCode: ComputedRef<string>
}

/**
 * Composable for handling user reports of issues with quiz questions.
 * @param options Reactive state and context required for generating the report payload.
 * @returns An object containing report state variables and the submission method.
 */

export function useQuestionReporting(options: QuestionReportingOptions) {
  const reportingIssue = ref(false)
  const reportFeedback = ref<string | null>(null)
  const reportError = ref<string | null>(null)

  async function onReportQuestion(payload: { reason: 'wrong-image'; details: string }) {
    if (!options.question.value || reportingIssue.value) return

    reportingIssue.value = true
    reportFeedback.value = null
    reportError.value = null

    try {
      const currentQuestion = options.question.value
      const correctChoiceLabel = currentQuestion.choices.find(
        (choice) => choice.id === currentQuestion.correctChoiceId
      )?.label

      const response = await reportQuestionIssue({
        reason: payload.reason,
        details: payload.details,
        question: {
          id: currentQuestion.id,
          type: currentQuestion.type,
          prompt: currentQuestion.prompt,
          image: currentQuestion.image,
          choices: currentQuestion.choices,
          correctChoiceId: currentQuestion.correctChoiceId,
          correctChoiceLabel,
          reportContext: currentQuestion.reportContext
        },
        gameplay: {
          questionIndex: options.currentIndex.value + 1,
          totalQuestions: options.questions.value.length,
          selectedChoiceId: options.selectedChoiceId.value,
          answered: options.answered.value,
          mode: options.inMultiplayerRoom.value ? 'multiplayer' : 'solo',
          roomCode: options.inMultiplayerRoom.value ? options.roomCode.value : undefined
        },
        reporter: {
          playerName: options.playerName.value,
          appRoute: typeof window !== 'undefined' ? window.location.pathname : '/game',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        },
        clientReportedAt: new Date().toISOString()
      })

      if (response.ok) {
        reportFeedback.value = 'Signalement enregistré ! Merci.'
        reportError.value = null
      } else {
        reportError.value = response.message ?? 'Le signalement a echoué :('
        reportFeedback.value = reportError.value
      }
    } catch (error) {
      reportError.value = error instanceof Error ? error.message : String(error)
      reportFeedback.value = reportError.value
    } finally {
      reportingIssue.value = false
    }
  }

  watch(
    () => options.currentIndex.value,
    () => {
      reportFeedback.value = null
      reportingIssue.value = false
      reportError.value = null
    }
  )

  return {
    reportingIssue,
    reportFeedback,
    reportError,
    onReportQuestion
  }
}
