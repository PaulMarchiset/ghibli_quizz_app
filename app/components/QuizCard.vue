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
const reportFormOpen = ref(false)
const reportDetails = ref('')

watch(
  () => [props.question, props.choices],
  () => {
    selectedChoiceId.value = null
    reportFormOpen.value = false
    reportDetails.value = ''
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
      ? 'bg-gray-900 text-white'
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

function openReportForm() {
  reportFormOpen.value = true
}

function closeReportForm() {
  reportFormOpen.value = false
}

function submitReport() {
  emit('report-question', {
    reason: 'wrong-image',
    details: reportDetails.value.trim()
  })

  reportFormOpen.value = false
  reportDetails.value = ''
}
</script>

<template>
  <div class="bg-white rounded-3xl shadow-lg overflow-hidden max-w-100 w-full">
    <!-- Image Section -->
    <div class="p-4">

      <div class="relative aspect-square w-full overflow-hidden max-h-70 rounded-2xl">
        <img v-if="image" :src="image" :alt="question" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full bg-gray-100"></div>
      </div>
    </div>

    <!-- Question Section -->
    <div class="p-6 pb-4 pt-0 flex flex-col gap-6 h-full">
      <div class="flex items-start justify-between gap-4">
        <h3 class="text-2xl font-bold text-gray-900">
          {{ question }}
        </h3>

        <button
          type="button"
          class="w-10 h-10 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0 hover:bg-gray-100 hover:cursor-pointer"
          @click="openReportForm"
          :disabled="reporting"
          aria-label="Reporter une image incorrecte"
          title="Reporter une image incorrecte"
        >
          <ReportIcon />
        </button>
      </div>

      <div v-if="reportFormOpen" class="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col gap-3">
        <p class="text-sm font-semibold text-amber-900">Signaler une image incorrecte</p>
        <textarea
          v-model="reportDetails"
          rows="3"
          class="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800"
          placeholder="Ajoutez un detail utile (optionnel). Exemple: image de Kiki incorrecte, id attendu a verifier."
        />
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 hover:cursor-pointer"
            @click="closeReportForm"
            :disabled="reporting"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-full bg-gray-900 text-white text-sm hover:bg-gray-800 hover:cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            @click="submitReport"
            :disabled="reporting"
          >
            {{ reporting ? 'Envoi...' : 'Envoyer le signalement' }}
          </button>
        </div>
      </div>

      <p v-if="reportStatus" class="text-sm text-gray-700">{{ reportStatus }}</p>

      <!-- Multiple Choice Answers -->
      <div v-if="choices && choices.length > 0" class="flex gap-4 flex-col">
        <button v-for="choice in choices" :key="choice.id" @click="selectAnswer(choice.id)" :class="[
          'w-full px-6 py-3 rounded-full text-left font-medium transition-all duration-200',
          'flex items-center gap-3',
          !answered ? 'hover:cursor-pointer' : 'cursor-default',
          getChoiceStyle(choice.id)
        ]">
          <span :class="[
            'w-3 h-3 rounded-full flex-shrink-0',
            choices[0] === choice
              ? 'bg-red-500'
              :
              choices[1] === choice
                ? 'bg-green-500'
                :
                choices[2] === choice
                  ? 'bg-teal-500' :

                  choices[3] === choice
                    ? 'bg-purple-500' : 'bg-gray-400'
          ]"></span>
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
          'w-full text-white font-semibold py-4 rounded-full transition-colors duration-200',
          answered
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gray-900 hover:bg-gray-800 hover:cursor-pointer'
        ]"
      >
        {{ answered ? 'Réponse validée' : 'Valider ma réponse' }}
      </button>
    </div>
  </div>
</template>
