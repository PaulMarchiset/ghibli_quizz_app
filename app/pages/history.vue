<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ArrowsIcon from '../components/Icons/ArrowsIcon.vue'
import { useScoreHistory } from '../composables/useScoreHistory'

const scoreHistory = useScoreHistory()

const sortKey = ref<'date' | 'score' | 'player'>('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const questionTypeFilter = ref<string>('all')

const questionTypes = computed(() => {
  const types = new Set<string>()

  scoreHistory.entries.value.forEach((entry) => {
    types.add(entry.questionType)
  })

  return Array.from(types).sort((a, b) => a.localeCompare(b))
})

const filteredEntries = computed(() => {
  if (questionTypeFilter.value === 'all') return scoreHistory.entries.value
  return scoreHistory.entries.value.filter(
    (entry) => entry.questionType === questionTypeFilter.value
  )
})

const hasAnyEntries = computed(() => scoreHistory.entries.value.length > 0)
const sortDirectionLabel = computed(() => (sortDirection.value === 'asc' ? 'Croissant' : 'Decroissant'))

const sortedEntries = computed(() => {
  const entries = [...filteredEntries.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  if (sortKey.value === 'score') {
    return entries.sort((a, b) => {
      if (a.points !== b.points) return (a.points - b.points) * direction
      return (new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()) * direction
    })
  }

  if (sortKey.value === 'player') {
    return entries.sort((a, b) => {
      const nameOrder = a.playerName.localeCompare(b.playerName)
      if (nameOrder !== 0) return nameOrder * direction
      return (new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()) * direction
    })
  }

  return entries.sort(
    (a, b) => (new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()) * direction
  )
})

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR')
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}

onMounted(() => {
  scoreHistory.ensureLoaded()
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-bold text-gray-900">Historique des scores</h1>
    </div>

    <div class="rounded-2xl bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-1">
            <label for="sort-key" class="text-xs font-semibold text-gray-600">Trier par</label>
            <select
              id="sort-key"
              v-model="sortKey"
              class="rounded-full bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="player">Pseudo</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label for="question-filter" class="text-xs font-semibold text-gray-600">
              Filtrer par type
            </label>
            <select
              id="question-filter"
              v-model="questionTypeFilter"
              class="rounded-full bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
            >
              <option value="all">Tous</option>
              <option v-for="type in questionTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="text-xs text-gray-500">
            {{ sortedEntries.length }} partie(s)
          </div>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700"
          @click="toggleSortDirection"
        >
          <ArrowsIcon class="h-4 w-4" />
          {{ sortDirectionLabel }}
        </button>
      </div>
    </div>

    <div v-if="!hasAnyEntries" class="bg-white rounded-2xl shadow-sm p-6 text-gray-700">
      Aucun score enregistré pour le moment.
    </div>

    <div v-else-if="sortedEntries.length === 0" class="bg-white rounded-2xl shadow-sm p-6 text-gray-700">
      Aucun score pour ce filtre.
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

    <div v-if="hasAnyEntries">
      <button
        class="px-4 py-2 rounded-full bg-white text-gray-900 shadow-sm"
        @click="scoreHistory.clearHistory"
      >
        Vider l'historique
      </button>
    </div>
  </div>
</template>
