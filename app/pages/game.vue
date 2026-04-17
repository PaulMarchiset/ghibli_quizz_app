<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { useGameRoom } from '../composables/useGameRoom'
import { useLeaderboardSort } from '../composables/useLeaderboardSort'
import ScorePanel from '../components/Shared/ScorePanel.vue'

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
  if (!roomState.value) return 'Crée une salle de jeu pour jouer.'

  if (showEndedSummary.value) {
    return isHost.value
      ? 'Tu peux configurer les paramètres et démarrer une nouvelle partie.'
      : 'En attente du chef pour configurer et démarrer une nouvelle partie.'
  }

  return isHost.value
    ? 'Configure les paramètres et démarre la partie.'
    : 'En attente du chef pour démarrer la partie.'
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
