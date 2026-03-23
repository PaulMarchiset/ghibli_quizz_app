<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useGameSettings } from '../composables/useGameSettings'
import { useScoreHistory } from '../composables/useScoreHistory'
import { useGameRoom } from '../composables/useGameRoom'

import QuizCard from './QuizCard.vue'
import { checkAnswer, generateQuiz, getQuestionFactoriesForSelection, type QuizQuestion } from '../services/game/quizGame'

const settings = useGameSettings()
const scoreHistory = useScoreHistory()
const gameRoom = useGameRoom()

const playerName = computed(() => settings.value.pseudo.trim() || 'Joueur')
const questionSeconds = computed(() => settings.value.questionSeconds || 15)
const effectiveQuestionSeconds = computed(() => {
  if (inMultiplayerRoom.value && gameRoom.sharedQuestionSeconds.value) {
    return gameRoom.sharedQuestionSeconds.value
  }

  return questionSeconds.value
})
const quizLength = computed(() => settings.value.quizLength || 10)
const selectedQuestionType = computed(() => settings.value.questionType)
const selectedQuestionTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    all: 'All',
    'character-species': 'Character species',
    'character-movie': 'Character movie',
    'movie-character': 'Movie character',
    'japanese-name': 'Japanese title'
  }

  return labels[selectedQuestionType.value] ?? selectedQuestionType.value
})

const loading = ref(true)
const error = ref<string | null>(null)
const waitingForSharedQuestions = ref(false)

const questions = ref<QuizQuestion[]>([])
const currentIndex = ref(0)
const score = ref(0)

const answered = ref(false)
const lastCorrect = ref<boolean | null>(null)
const finished = ref(false)
const timerKey = ref(0)
const selectedChoiceId = ref<string | null>(null)
const scoreSaved = ref(false)
const lastHandledAdvanceQuestionId = ref<string | null>(null)
const pendingAdvanceTimeout = ref<number | null>(null)

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

const question = computed(() => questions.value[currentIndex.value] ?? null)
const inMultiplayerRoom = computed(() => !!gameRoom.roomCode.value && gameRoom.phase.value === 'playing')

const sortedLeaderboard = computed(() => {
  if (!inMultiplayerRoom.value) return []

  return [...gameRoom.players.value].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.name.localeCompare(b.name)
  })
})

const mySharedScore = computed(() => {
  if (!inMultiplayerRoom.value) return score.value

  const me = gameRoom.players.value.find((player) => player.id === gameRoom.playerId.value)
  if (me) return me.score

  return score.value
})

async function startQuiz(count = quizLength.value) {
    loading.value = true
    error.value = null
  waitingForSharedQuestions.value = false

    questions.value = []
    currentIndex.value = 0
    score.value = 0
    answered.value = false
    lastCorrect.value = null
    finished.value = false
    selectedChoiceId.value = null
    scoreSaved.value = false

    try {
      if (inMultiplayerRoom.value) {
        if (Array.isArray(gameRoom.sharedQuestions.value) && gameRoom.sharedQuestions.value.length > 0) {
          questions.value = gameRoom.sharedQuestions.value
          preloadQuizImages(questions.value)
          timerKey.value++
          return
        }

        if (gameRoom.isHost.value) {
          const factories = getQuestionFactoriesForSelection(selectedQuestionType.value)
          const generated = await generateQuiz(count, factories)
          const publishResult = await gameRoom.publishQuestions(generated, questionSeconds.value)
          if (!publishResult.ok) {
            throw new Error(publishResult.message ?? 'Unable to publish shared questions')
          }

          questions.value = generated
          preloadQuizImages(questions.value)
          timerKey.value++
          return
        }

        waitingForSharedQuestions.value = true
        return
      }

      const factories = getQuestionFactoriesForSelection(selectedQuestionType.value)
      questions.value = await generateQuiz(count, factories)
        preloadQuizImages(questions.value)
        timerKey.value++
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

  if (inMultiplayerRoom.value) {
    void gameRoom.submitAnswer(question.value.id, payload.selectedChoiceId)
    answered.value = true
    lastCorrect.value = isCorrect
    return
  }

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
  answered.value = false
  lastCorrect.value = null
  selectedChoiceId.value = null

  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  } else {
    finished.value = true
  }
}

function onTimeout() {
  if (!question.value || finished.value) return

  if (inMultiplayerRoom.value) {
    if (!answered.value && selectedChoiceId.value) {
      onValidate({ selectedChoiceId: selectedChoiceId.value })
    } else if (!answered.value) {
      answered.value = true
      lastCorrect.value = false
    }

    scheduleAdvance(700)
    return
  }

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

  scoreHistory.addEntry({
    playerName: playerName.value,
    points: mySharedScore.value,
    totalQuestions: questions.value.length,
    questionType: selectedQuestionTypeLabel.value,
    questionSeconds: effectiveQuestionSeconds.value
  })

  scoreSaved.value = true
})

onMounted(() => {
  scoreHistory.ensureLoaded()
  startQuiz(quizLength.value)
})

watch(
  () => gameRoom.sharedQuestions.value,
  (nextQuestions) => {
    if (!inMultiplayerRoom.value) return
    if (!Array.isArray(nextQuestions) || nextQuestions.length === 0) return

    questions.value = nextQuestions
    currentIndex.value = 0
    score.value = 0
    answered.value = false
    lastCorrect.value = null
    finished.value = false
    selectedChoiceId.value = null
    waitingForSharedQuestions.value = false
    loading.value = false
    error.value = null
    preloadQuizImages(nextQuestions)
    timerKey.value++
  },
  { immediate: true }
)

watch(
  () => gameRoom.advanceQuestionId.value,
  (questionId) => {
    if (!inMultiplayerRoom.value) return
    if (!questionId || questionId === lastHandledAdvanceQuestionId.value) return
    if (!question.value || question.value.id !== questionId) return

    lastHandledAdvanceQuestionId.value = questionId
    scheduleAdvance(700)
  }
)
</script>

<template>
  <div class="min-h-screen flex items-start gap-20 justify-center bg-gray-100 py-12 px-4">
    <!-- Loading -->
    <div v-if="loading" class="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8 text-center space-y-4">
      <div class="mx-auto w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
      <h2 class="text-2xl font-bold text-gray-900">Generation du quiz...</h2>
      <p class="text-gray-600">
        Preparation des questions en cours. Cela peut prendre quelques secondes selon les APIs.
      </p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8 text-center space-y-4">
      <h2 class="text-2xl font-bold text-red-700">Impossible de generer le quiz</h2>
      <p class="text-gray-700">{{ error }}</p>
      <button
        class="px-6 py-3 rounded-full bg-black text-white"
        @click="startQuiz()"
      >
        Reessayer
      </button>
    </div>

    <div v-else-if="waitingForSharedQuestions" class="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8 text-center space-y-4">
      <div class="mx-auto w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"></div>
      <h2 class="text-2xl font-bold text-gray-900">En attente de l'hote</h2>
      <p class="text-gray-600">
        L'hote est en train de generer et partager les questions.
      </p>
    </div>


    <!-- Quiz finished -->
    <div v-else-if="finished" class="text-center space-y-4">
      <h2 class="text-3xl font-bold">Quiz terminé 🎉</h2>
      <p>Score : {{ mySharedScore }} / {{ questions.length }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          class="px-6 py-3 rounded-full bg-black text-white"
          @click="startQuiz()"
        >
          Rejouer
        </button>
        <NuxtLink
          to="/history"
          class="px-6 py-3 rounded-full bg-white text-gray-900 shadow-sm"
        >
          Voir l'historique
        </NuxtLink>
      </div>
    </div>
    <!-- Question -->
    <QuizCard
      v-else-if="question"
      :image="question.image"
      :question="question.prompt"
      :choices="question.choices"
      :answered="answered"
      :correctChoiceId="question.correctChoiceId"
      @answer-selected="onAnswerSelected"
      @validate="onValidate"
    />
    <div v-if="!loading && !error && !finished && question" class="flex flex-col items-start gap-40">
      <GameTimer
        :key="timerKey"
        :totalSeconds="effectiveQuestionSeconds"
        @timeout="onTimeout"
      />

      <div v-if="inMultiplayerRoom" class="flex flex-col gap-3">
        <ScorePanel
          v-for="(player, index) in sortedLeaderboard"
          :key="player.id"
          :rank="index + 1"
          :name="player.name"
          :score="player.score"
        />
      </div>

      <ScorePanel v-else :rank="1" :name="playerName" :score="score" />
    </div>
  </div>
</template>
