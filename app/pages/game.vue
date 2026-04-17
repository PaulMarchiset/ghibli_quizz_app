<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
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

const topScore = computed(() => sortedLeaderboard.value[0]?.score ?? 0)

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

watch(
  () => phase.value,
  async (nextPhase) => {
    if (!import.meta.client || nextPhase !== 'ended') return
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
)
</script>

<template>
  <div class="space-y-4">
    <GameBoard v-if="showGameBoard" />

    <div v-else class="space-y-4">
      <div v-if="showEndedSummary" class="rounded-3xl bg-white p-6 shadow-sm text-gray-800 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-2xl font-bold text-gray-900">Final scoreboard</h2>
          <div class="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{{ sortedLeaderboard.length }} joueur(s)</span>
            <span>Meilleur score : {{ topScore }}</span>
          </div>
        </div>

        <div v-if="sortedLeaderboard.length" class="grid gap-3 sm:grid-cols-2">
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
</template>
