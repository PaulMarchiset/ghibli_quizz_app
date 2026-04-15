<script setup lang="ts">
import { computed } from 'vue'
import { useGameRoom } from '../composables/useGameRoom'

const { roomState, phase, isHost, players } = useGameRoom()

const showGameBoard = computed(() => {
  return !!roomState.value && phase.value === 'playing'
})

const showEndedSummary = computed(() => {
  return !!roomState.value && phase.value === 'ended'
})

const sortedLeaderboard = computed(() => {
  if (!roomState.value) return []

  return [...players.value].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.name.localeCompare(b.name)
  })
})

const showSettings = computed(() => {
  if (!roomState.value) return true
  return isHost.value
})

const lobbyMessage = computed(() => {
  if (!roomState.value) return 'Create or join a room to start.'

  if (showEndedSummary.value) {
    return isHost.value
      ? 'You can edit settings, create a new game, then start when everyone is ready.'
      : 'Waiting for the host to configure and start a new game.'
  }

  return isHost.value
    ? 'Configure settings and start the game when everyone is ready.'
    : 'Wait for the host to start the game.'
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-4 sm:p-6">
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="mb-4 flex flex-wrap gap-2">
        <NuxtLink
          to="/"
          class="inline-flex px-4 py-2 rounded-full bg-white text-gray-900 shadow-sm"
        >
          Retour à l'accueil
        </NuxtLink>
        <NuxtLink
          to="/history"
          class="inline-flex px-4 py-2 rounded-full bg-white text-gray-900 shadow-sm"
        >
          Historique des scores
        </NuxtLink>
      </div>

      <GameBoard v-if="showGameBoard" />

      <div v-else class="space-y-4">
        <div v-if="showEndedSummary" class="rounded-3xl bg-white p-6 shadow-sm text-gray-800 space-y-4">
          <h2 class="text-2xl font-bold text-gray-900">Final scoreboard</h2>

          <div v-if="sortedLeaderboard.length" class="space-y-3">
            <ScorePanel
              v-for="(player, index) in sortedLeaderboard"
              :key="player.id"
              :rank="index + 1"
              :name="player.name"
              :score="player.score"
            />
          </div>
          <p v-else class="text-sm text-gray-600">No players in the room.</p>
        </div>

        <GameRoomLobby :show-settings="showSettings" />

        <div class="rounded-3xl bg-white p-6 shadow-sm text-gray-700">
          {{ lobbyMessage }}
        </div>
      </div>
    </div>
  </div>
</template>
