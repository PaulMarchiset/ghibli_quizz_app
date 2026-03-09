<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useGameSettings } from '../composables/useGameSettings'

import QuizCard from './QuizCard.vue'
import { checkAnswer, generateQuiz, getQuestionFactoriesForSelection, type QuizQuestion } from '../services/game/quizGame'

const settings = useGameSettings()

const playerName = computed(() => settings.value.pseudo.trim() || 'Joueur')
const questionSeconds = computed(() => settings.value.questionSeconds || 15)
const quizLength = computed(() => settings.value.quizLength || 10)
const selectedQuestionType = computed(() => settings.value.questionType)

const loading = ref(true)
const error = ref<string | null>(null)

const questions = ref<QuizQuestion[]>([])
const currentIndex = ref(0)
const score = ref(0)

const answered = ref(false)
const lastCorrect = ref<boolean | null>(null)
const finished = ref(false)
const timerKey = ref(0)
const selectedChoiceId = ref<string | null>(null)

const question = computed(() => questions.value[currentIndex.value] ?? null)

async function startQuiz(count = quizLength.value) {
    loading.value = true
    error.value = null

    questions.value = []
    currentIndex.value = 0
    score.value = 0
    answered.value = false
    lastCorrect.value = null
    finished.value = false
    selectedChoiceId.value = null

    try {
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

    answered.value = true
    lastCorrect.value = isCorrect

    if (isCorrect) {
        score.value++
    }

    // Move to next question after a short delay
    setTimeout(() => {
        advanceToNextQuestion()
    }, 800)
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
  if (!question.value || answered.value || finished.value) return

  if (selectedChoiceId.value) {
    onValidate({ selectedChoiceId: selectedChoiceId.value })
    return
  }

  answered.value = true
  lastCorrect.value = false

  setTimeout(() => {
    advanceToNextQuestion()
  }, 400)
}

watch(currentIndex, () => {
  // Force Timer to remount/restart per question
  timerKey.value++
})

onMounted(() => {
  startQuiz(quizLength.value)
})
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


    <!-- Quiz finished -->
    <div v-else-if="finished" class="text-center space-y-4">
      <h2 class="text-3xl font-bold">Quiz terminé 🎉</h2>
      <p>Score : {{ score }} / {{ questions.length }}</p>
      <button
        class="px-6 py-3 rounded-full bg-black text-white"
        @click="startQuiz()"
      >
        Rejouer
      </button>
    </div>
    <!-- Question -->
    <QuizCard
      v-else-if="question"
      :image="question.image"
      :question="question.prompt"
      :choices="question.choices"
      @answer-selected="onAnswerSelected"
      @validate="onValidate"
    />
    <div v-if="!loading && !error && !finished && question" class="flex flex-col items-start gap-40">
      <GameTimer
        :key="timerKey"
        :totalSeconds="questionSeconds"
        @timeout="onTimeout"
      />
      <ScorePanel :rank="1" :name="playerName" :score="score" />
    </div>
  </div>
</template>
