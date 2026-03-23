<script setup lang="ts">
import { computed } from 'vue'
import { useGameRoom } from '../composables/useGameRoom'

const { roomState, phase } = useGameRoom()

const showGameBoard = computed(() => {
  return !!roomState.value && phase.value === 'playing'
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
          Retour a l'accueil
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
        <GameRoomLobby :show-settings="false" />

        <div class="rounded-3xl bg-white p-6 shadow-sm text-gray-700">
          Wait for the host to start the game.
        </div>
      </div>
    </div>
  </div>
</template>
