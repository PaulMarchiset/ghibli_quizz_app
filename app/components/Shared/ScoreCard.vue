<script setup lang="ts">
import type { ScoreHistoryEntry } from '~/composables/useScoreHistory'

defineProps<{ entry: ScoreHistoryEntry }>()

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR')
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-lg font-semibold text-gray-900">{{ entry.playerName }}</p>
        <p class="text-sm text-gray-600">{{ formatDate(entry.playedAt) }}</p>
      </div>
      <p class="text-xl font-bold text-gray-900">
        {{ entry.points }} / {{ entry.totalQuestions }}
      </p>
    </div>

    <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
      <p><span class="font-semibold">Type de questions :</span> {{ entry.questionType }}</p>
      <p><span class="font-semibold">Temps par question :</span> {{ entry.questionSeconds }}s</p>
    </div>
  </div>
</template>
