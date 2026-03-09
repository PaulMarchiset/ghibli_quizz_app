<script setup lang="ts">
import { ref } from 'vue'

type Choice = {
  id: string
  label: string
}

defineProps<{
  image?: string
  question: string
  choices: Choice[]
}>()

const emit = defineEmits<{
  (e: 'answer-selected', choiceId: string): void
  (e: 'validate', payload: { selectedChoiceId: string | null }): void
}>()

const selectedChoiceId = ref<string | null>(null)

function selectAnswer(choiceId: string) {
  selectedChoiceId.value = choiceId
  emit('answer-selected', choiceId)
}

function handleValidate() {
  emit('validate', {
    selectedChoiceId: selectedChoiceId.value
  })
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
      <h3 class="text-2xl font-bold text-gray-900">
        {{ question }}
      </h3>

      <!-- Multiple Choice Answers -->
      <div v-if="choices && choices.length > 0" class="flex gap-4 flex-col">
        <button v-for="choice in choices" :key="choice.id" @click="selectAnswer(choice.id)" :class="[
          'w-full px-6 py-3 rounded-full text-left font-medium transition-all duration-200',
          'flex items-center gap-3 hover:cursor-pointer',
          selectedChoiceId === choice.id
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <span>{{ choice.label }}</span>
        </button>
      </div>

      <!-- Validate Button -->
      <button @click="handleValidate"
        class="hover:cursor-pointer w-full bg-gray-900 text-white font-semibold py-4 rounded-full hover:bg-gray-800 transition-colors duration-200">
        Valider ma réponse
      </button>
    </div>
  </div>
</template>
