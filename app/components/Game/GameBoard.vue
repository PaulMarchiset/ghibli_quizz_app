<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameSettings } from '../../composables/useGameSettings'
import { useScoreHistory } from '../../composables/useScoreHistory'
import { useLeaderboardSort } from '../../composables/useLeaderboardSort'
import { useQuestionReporting } from '../../composables/useQuestionReporting'
import { useQuizGame } from '../../composables/useQuizGame'
import { useQuizMultiplayer } from '../../composables/useQuizMultiplayer'
import { QUESTION_TYPE_KEYS, QUESTION_TYPE_LABELS } from '../../services/game/quizGame'

import QuizEndScreen from '../Quiz/QuizEndScreen.vue'
import QuizLayout from '../Quiz/QuizLayout.vue'
import QuizQuestion from '../Quiz/QuizQuestion.vue'
import QuizSidebar from '../Quiz/QuizSidebar.vue'
import QuizStateWrapper from '../Quiz/QuizStateWrapper.vue'

const settings = useGameSettings()
const scoreHistory = useScoreHistory()

const playerName = computed(() => settings.value.pseudo.trim() || 'Joueur')
const questionSeconds = computed(() => settings.value.questionSeconds || 15)
const quizLength = computed(() => settings.value.quizLength || 10)
const selectedQuestionTypes = computed(() => settings.value.questionTypes)
const selectedQuestionTypeLabel = computed(() => {
  const types = selectedQuestionTypes.value
  if (types.length === 0 || types.length === QUESTION_TYPE_KEYS.length) {
    return 'All'
  }

  return types.map((type) => QUESTION_TYPE_LABELS[type] ?? type).join(', ')
})

const quiz = useQuizGame({
  questionTypes: selectedQuestionTypes,
  quizLength
})
const multiplayer = useQuizMultiplayer(quiz)
const leaderboardSort = useLeaderboardSort(multiplayer.leaderboardItems)

const {
  questions,
  score,
  answered,
  finished,
  selectedChoiceId,
  loading,
  error,
  question,
  timerKey
} = quiz

const {
  waitingForSharedQuestions,
  inMultiplayerRoom,
  mySharedScore,
  sharedQuestionSeconds
} = multiplayer

const { sortedItems } = leaderboardSort

const effectiveQuestionSeconds = computed(() => {
  if (inMultiplayerRoom.value && sharedQuestionSeconds.value) {
    return sharedQuestionSeconds.value
  }

  return questionSeconds.value
})

quiz.setOnFinished(({ totalQuestions }) => {
  scoreHistory.addEntry({
    playerName: playerName.value,
    points: mySharedScore.value,
    totalQuestions,
    questionType: selectedQuestionTypeLabel.value,
    questionSeconds: effectiveQuestionSeconds.value
  })
})

const reporting = useQuestionReporting({
  question: quiz.question,
  questions: quiz.questions,
  currentIndex: quiz.currentIndex,
  selectedChoiceId: quiz.selectedChoiceId,
  answered: quiz.answered,
  playerName,
  inMultiplayerRoom: multiplayer.inMultiplayerRoom,
  roomCode: multiplayer.roomCode
})

const { reportingIssue, reportFeedback } = reporting

async function startGame() {
  if (inMultiplayerRoom.value) {
    await multiplayer.startMultiplayerQuiz({
      count: quizLength.value,
      questionTypes: selectedQuestionTypes.value,
      questionSeconds: questionSeconds.value
    })
    return
  }

  await quiz.startQuiz(quizLength.value)
}

function handleValidate(payload: { selectedChoiceId: string | null }) {
  if (inMultiplayerRoom.value) {
    multiplayer.onValidate(payload)
    return
  }

  quiz.onValidate(payload)
}

function handleTimeout() {
  if (multiplayer.inMultiplayerRoom.value) {
    multiplayer.onTimeout()
    return
  }

  quiz.onTimeout()
}

onMounted(() => {
  scoreHistory.ensureLoaded()
  startGame()
})
</script>

<template>
  <div class="min-h-screen w-full bg-gray-100 md:px-4 md:py-6 py-0 px-0">
    <QuizStateWrapper
      :loading="loading"
      :error="error"
      :waiting="waitingForSharedQuestions"
      @retry="startGame"
    >
      <QuizEndScreen
        v-if="finished"
        :score="mySharedScore"
        :totalQuestions="questions.length"
        @replay="startGame"
      />

      <QuizLayout v-else-if="question">
        <template #main>
          <QuizQuestion
            :question="question"
            :answered="answered"
            :selectedChoiceId="selectedChoiceId"
            :correctChoiceId="question.correctChoiceId"
            :reporting="reportingIssue"
            :reportStatus="reportFeedback"
            :timerKey="timerKey"
            :totalSeconds="effectiveQuestionSeconds"
            @answer-selected="quiz.onAnswerSelected"
            @validate="handleValidate"
            @timeout="handleTimeout"
            @report-question="reporting.onReportQuestion"
          />

          <QuizSidebar
            variant="mobile"
            :items="sortedItems"
            :inMultiplayerRoom="inMultiplayerRoom"
            :playerName="playerName"
            :score="score"
          />
        </template>

        <template #sidebar>
          <QuizSidebar
            variant="desktop"
            :items="sortedItems"
            :inMultiplayerRoom="inMultiplayerRoom"
            :playerName="playerName"
            :score="score"
            :timerKey="timerKey"
            :totalSeconds="effectiveQuestionSeconds"
            @timeout="handleTimeout"
          />
        </template>
      </QuizLayout>
    </QuizStateWrapper>
  </div>
</template>
