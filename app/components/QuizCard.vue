<script setup lang="ts">
import { ref, watch } from 'vue'
import ReportIcon from './Icons/ReportIcon.vue'

type Choice = {
  id: string
  label: string
}

const props = defineProps<{
  image?: string
  question: string
  choices: Choice[]
  answered: boolean
  correctChoiceId: string
  reporting?: boolean
  reportStatus?: string | null
}>()

const emit = defineEmits<{
  (e: 'answer-selected', choiceId: string): void
  (e: 'validate', payload: { selectedChoiceId: string | null }): void
  (e: 'report-question', payload: { reason: 'wrong-image'; details: string }): void
}>()

const selectedChoiceId = ref<string | null>(null)
const choiceDotColors = ['bg-red-500', 'bg-green-500', 'bg-teal-500', 'bg-purple-500']

watch(
  () => [props.question, props.choices],
  () => {
    selectedChoiceId.value = null
  }
)

function selectAnswer(choiceId: string) {
  if (props.answered) return
  selectedChoiceId.value = choiceId
  emit('answer-selected', choiceId)
}

function getChoiceStyle(choiceId: string) {
  if (!props.answered) {
    return selectedChoiceId.value === choiceId
      ? 'choice-selected'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }

  if (choiceId === props.correctChoiceId) {
    return 'bg-[#57F77A] text-gray-900'
  }

  if (selectedChoiceId.value === choiceId) {
    return 'bg-[#F75757] text-white'
  }

  return 'bg-gray-100 text-gray-700'
}

function handleValidate() {
  emit('validate', {
    selectedChoiceId: selectedChoiceId.value
  })
}

function submitReport() {
  emit('report-question', {
    reason: 'wrong-image',
    details: ''
  })
}

function getChoiceDotClass(index: number) {
  return choiceDotColors[index] ?? 'bg-gray-400'
}
</script>

<template>
  <div class="bg-white rounded-3xl shadow-lg overflow-hidden w-full">
    <div class="flex flex-col lg:flex-row">
      <!-- Image Section -->
      <div class="p-4 lg:flex lg:w-5/12 lg:flex-col">
        <div class="relative w-full overflow-hidden rounded-2xl aspect-square lg:aspect-auto lg:flex-1 lg:min-h-full">
          <img v-if="image" :src="image" :alt="question" class="h-full w-full object-cover" />
          <div v-else class="w-full h-full bg-gray-100"></div>
        </div>
      </div>

      <!-- Question Section -->
      <div class="flex flex-col gap-6 p-6 pt-0 lg:w-7/12 lg:pt-6">
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-2xl font-bold text-gray-900">
          {{ question }}
        </h3>

        <button
          type="button"
          class="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0 hover:bg-gray-100 hover:cursor-pointer"
          @click="submitReport"
          :disabled="reporting"
          aria-label="Reporter une image incorrecte"
          title="Reporter une image incorrecte"
        >
          <ReportIcon />
        </button>
      </div>

      <p v-if="reportStatus" class="text-sm text-gray-700">{{ reportStatus }}</p>

      <!-- Multiple Choice Answers -->
      <div v-if="choices && choices.length > 0" class="flex gap-4 flex-col">
        <button v-for="(choice, index) in choices" :key="choice.id" @click="selectAnswer(choice.id)" :class="[
          'w-full px-6 py-3 rounded-2xl sm:rounded-full text-left font-medium transition-all duration-200',
          'flex items-center gap-3',
          !answered ? 'hover:cursor-pointer' : 'cursor-default',
          getChoiceStyle(choice.id)
        ]">
          <span :class="['w-3 h-3 rounded-full flex-shrink-0', getChoiceDotClass(index)]"></span>
          <span class="flex-1">{{ choice.label }}</span>
          <span
            v-if="answered && choice.id === correctChoiceId"
            class="text-xs font-semibold px-2 py-1 rounded-full bg-white/80 text-gray-900"
          >
            Bonne réponse
          </span>
        </button>
      </div>

      <!-- Validate Button -->
      <button
        @click="handleValidate"
        :disabled="answered"
        :class="[
          'w-full text-white font-semibold py-4 rounded-2xl sm:rounded-full transition-colors duration-200',
          answered
            ? 'bg-gray-400 cursor-not-allowed'
            : 'btn-primary'
        ]"
      >
        {{ answered ? 'Réponse validée' : 'Valider ma réponse' }}
      </button>
      </div>
    </div>
  </div>
</template>
