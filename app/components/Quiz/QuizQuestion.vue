<script setup lang="ts">
import GameTimer from '../Game/GameTimer.vue'
import QuizCard from './QuizCard.vue'
import type { QuizQuestion as QuizQuestionType } from '~/services/game/quizGame'

const props = defineProps<{
  question: QuizQuestionType
  answered: boolean
  selectedChoiceId: string | null
  correctChoiceId: string
  reporting: boolean
  reportStatus?: string | null
  timerKey: number
  totalSeconds: number
}>()

const emit = defineEmits<{
  (e: 'answer-selected', choiceId: string): void
  (e: 'validate', payload: { selectedChoiceId: string | null }): void
  (e: 'timeout'): void
  (e: 'report-question', payload: { reason: 'wrong-image'; details: string }): void
}>()
</script>

<template>
  <div class="space-y-4" :data-selected="props.selectedChoiceId ? 'true' : 'false'">
    <div class="fixed right-4 top-[calc(var(--app-header-height)+0.75rem)] z-30 rounded-full border border-gray-200 bg-white/95 p-2 lg:hidden">
      <GameTimer :key="props.timerKey" :totalSeconds="props.totalSeconds" @timeout="emit('timeout')" />
    </div>

    <QuizCard
      :image="props.question.image"
      :question="props.question.prompt"
      :choices="props.question.choices"
      :answered="props.answered"
      :correctChoiceId="props.correctChoiceId"
      :reporting="props.reporting"
      :reportStatus="props.reportStatus"
      @answer-selected="emit('answer-selected', $event)"
      @validate="emit('validate', $event)"
      @report-question="emit('report-question', $event)"
    />
  </div>
</template>
