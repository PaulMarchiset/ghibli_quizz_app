<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useGameRoom } from '../composables/useGameRoom'
import { useLeaderboardSort } from '../composables/useLeaderboardSort'

const { roomState, phase, isHost, players } = useGameRoom()

const showGameBoard = computed(() => {
  return !!roomState.value && phase.value === 'playing'
})

const showEndedSummary = computed(() => {
  return !!roomState.value && phase.value === 'ended'
})

const leaderboardSort = useLeaderboardSort(players)
const sortedLeaderboard = leaderboardSort.sortedItems
const topScore = computed(() => sortedLeaderboard.value[0]?.score ?? 0)

const rankedLeaderboard = computed(() => {
  let lastScore: number | null = null
  let lastRank = 0

  return sortedLeaderboard.value.map((player, index) => {
    if (lastScore === player.score) {
      return { player, rank: lastRank }
    }

    lastScore = player.score
    lastRank = index + 1
    return { player, rank: lastRank }
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

        <div v-if="rankedLeaderboard.length" class="grid gap-3 sm:grid-cols-2">
          <ScorePanel
            v-for="entry in rankedLeaderboard"
            :key="entry.player.id"
            :rank="entry.rank"
            :name="entry.player.name"
            :score="entry.player.score"
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
