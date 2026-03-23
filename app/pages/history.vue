<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useScoreHistory } from '../composables/useScoreHistory'

const scoreHistory = useScoreHistory()

const sortedEntries = computed(() =>
  [...scoreHistory.entries.value].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  )
)

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR')
}

onMounted(() => {
  scoreHistory.ensureLoaded()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-bold text-gray-900">Historique des scores</h1>
        <div class="flex gap-2">
          <NuxtLink
            to="/"
            class="inline-flex px-4 py-2 rounded-full bg-white text-gray-900 shadow-sm"
          >
            Accueil
          </NuxtLink>
          <NuxtLink
            to="/game"
            class="inline-flex px-4 py-2 rounded-full bg-black text-white"
          >
            Jouer
          </NuxtLink>
        </div>
      </div>

      <div v-if="sortedEntries.length === 0" class="bg-white rounded-2xl shadow-sm p-6 text-gray-700">
        Aucun score enregistré pour le moment.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="entry in sortedEntries"
          :key="entry.id"
          class="bg-white rounded-2xl shadow-sm p-4 sm:p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-lg font-semibold text-gray-900">{{ entry.playerName }}</p>
              <p class="text-sm text-gray-600">{{ formatDate(entry.playedAt) }}</p>
            </div>
            <p class="text-xl font-bold text-gray-900">{{ entry.points }} / {{ entry.totalQuestions }}</p>
          </div>

          <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <p><span class="font-semibold">Type de questions :</span> {{ entry.questionType }}</p>
            <p><span class="font-semibold">Temps par question :</span> {{ entry.questionSeconds }}s</p>
          </div>
        </div>
      </div>

      <div v-if="sortedEntries.length > 0">
        <button
          class="px-4 py-2 rounded-full bg-white text-gray-900 shadow-sm"
          @click="scoreHistory.clearHistory"
        >
          Vider l'historique
        </button>
      </div>
    </div>
  </div>
</template>
