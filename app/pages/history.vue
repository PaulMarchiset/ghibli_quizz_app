<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import FormField from '../components/FormField.vue'
import ScoreCard from '../components/ScoreCard.vue'
import SortDirectionToggle from '../components/SortDirectionToggle.vue'
import StateCard from '../components/StateCard.vue'
import StateMessage from '../components/StateMessage.vue'
import { useScoreHistory } from '../composables/useScoreHistory'
import { useSortDirection } from '../composables/useSortDirection'

const scoreHistory = useScoreHistory()

const sortKey = ref<'date' | 'score' | 'player'>('date')
const { sortDirection, sortDirectionLabel, toggleSortDirection } = useSortDirection({
  labels: {
    asc: 'Croissant',
    desc: 'Décroissant'
  }
})
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

onMounted(() => {
  scoreHistory.ensureLoaded()
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-3xl font-bold text-gray-900">Historique des scores</h1>
    </div>

    <FilterBar>
      <template #filters>
        <FormField label="Trier par" for-id="sort-key">
          <select
            id="sort-key"
            v-model="sortKey"
            class="rounded-full bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="date">Date</option>
            <option value="score">Score</option>
            <option value="player">Pseudo</option>
          </select>
        </FormField>

        <FormField label="Filtrer par type" for-id="question-filter">
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
        </FormField>

        <div class="text-xs text-gray-500">
          {{ sortedEntries.length }} partie(s)
        </div>
      </template>

      <template #actions>
        <SortDirectionToggle
          :direction="sortDirection"
          :label="sortDirectionLabel"
          rotate
          @toggle="toggleSortDirection"
        />
      </template>
    </FilterBar>

    <StateCard v-if="!hasAnyEntries" variant="empty">
      <StateMessage title="Aucun score enregistré pour le moment." />
    </StateCard>

    <StateCard v-else-if="sortedEntries.length === 0" variant="empty">
      <StateMessage title="Aucun score pour ce filtre." />
    </StateCard>

    <div v-else class="space-y-3">
      <ScoreCard v-for="entry in sortedEntries" :key="entry.id" :entry="entry" />
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
