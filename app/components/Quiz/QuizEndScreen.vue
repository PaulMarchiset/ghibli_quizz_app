<script setup lang="ts">
const props = defineProps<{
  score: number
  totalQuestions: number
}>()

const emit = defineEmits<{ (e: 'replay'): void }>()
</script>

<template>
  <div class="mx-auto w-full max-w-xl text-center space-y-4">
    <h2 class="text-3xl font-bold">Quiz terminé 🎉</h2>
    <p>Score : {{ props.score }} / {{ props.totalQuestions }}</p>
    <div class="flex flex-wrap justify-center gap-3">
      <button class="px-6 py-3 rounded-full btn-primary" @click="emit('replay')">
        Rejouer
      </button>
      <NuxtLink to="/history" class="px-6 py-3 rounded-full bg-white text-gray-900 shadow-sm">
        Voir l'historique
      </NuxtLink>
    </div>
  </div>
</template>
