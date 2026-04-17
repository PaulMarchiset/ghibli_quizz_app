<script setup lang="ts">
import StateCard from './StateCard.vue'

const props = defineProps<{
  loading: boolean
  error: string | null
  waiting: boolean
}>()

const emit = defineEmits<{ (e: 'retry'): void }>()

const cardClass = 'mx-auto w-full max-w-xl rounded-3xl p-8 text-center shadow-lg space-y-4'
</script>

<template>
  <StateCard v-if="props.loading" variant="loading" :class="cardClass" />

  <StateCard v-else-if="props.error" variant="error" :class="cardClass">
    <div class="space-y-4 text-center">
      <h2 class="text-2xl font-bold text-red-700">Impossible de generer le quiz</h2>
      <p class="text-gray-700">{{ props.error }}</p>
      <button class="px-6 py-3 rounded-full btn-primary" @click="emit('retry')">
        Reessayer
      </button>
    </div>
  </StateCard>

  <StateCard v-else-if="props.waiting" variant="waiting" :class="cardClass" />

  <div v-else>
    <slot />
  </div>
</template>
