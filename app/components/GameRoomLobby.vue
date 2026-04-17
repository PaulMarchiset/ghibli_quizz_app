<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CopyIcon from './Icons/CopyIcon.vue'
import { useGameRoom } from '../composables/useGameRoom'
import { useGameSettings } from '../composables/useGameSettings'

const props = withDefaults(defineProps<{ showSettings?: boolean }>(), {
  showSettings: true
})

const settings = useGameSettings()
const {
  roomCode,
  players,
  phase,
  hostId,
  isHost,
  connected,
  socketError,
  createGame,
  joinGame,
  startGame,
  resetGameToLobby,
  leaveGame
} = useGameRoom()

const joinCode = ref('')
const localError = ref<string | null>(null)
const busy = ref(false)
const copyFeedback = ref<string | null>(null)

const canStart = computed(() => phase.value === 'lobby' && isHost.value && players.value.length > 0)
const canCreateNewGame = computed(() => phase.value === 'ended' && isHost.value && players.value.length > 0)

async function onCreateRoom() {
  if (busy.value) return
  localError.value = null
  busy.value = true

  const response = await createGame(settings.value.pseudo.trim())

  if (!response.ok) {
    localError.value = response.message ?? 'Unable to create room'
  } else {
    await navigateTo('/game')
  }

  busy.value = false
}

async function onJoinRoom() {
  if (busy.value) return

  const normalizedCode = joinCode.value.trim().toUpperCase()
  if (!normalizedCode) {
    localError.value = 'Enter a room code'
    return
  }

  localError.value = null
  busy.value = true

  const response = await joinGame(normalizedCode, settings.value.pseudo.trim())
  if (!response.ok) {
    localError.value = response.message ?? 'Unable to join room'
  } else {
    await navigateTo('/game')
  }

  busy.value = false
}

async function onStartGame() {
  if (busy.value || !canStart.value) return
  localError.value = null
  busy.value = true

  const response = await startGame()
  if (!response.ok) {
    localError.value = response.message ?? 'Unable to start game'
  }

  busy.value = false
}

async function onLeaveGame() {
  if (busy.value) return
  localError.value = null
  busy.value = true

  const response = await leaveGame()
  if (!response.ok) {
    localError.value = response.message ?? 'Unable to leave room'
  }

  busy.value = false
}

async function onCreateNewGame() {
  if (busy.value || !canCreateNewGame.value) return
  localError.value = null
  busy.value = true

  const response = await resetGameToLobby()
  if (!response.ok) {
    localError.value = response.message ?? 'Unable to create a new game'
  }

  busy.value = false
}

async function onCopyRoomCode() {
  if (!roomCode.value) return

  try {
    await navigator.clipboard.writeText(roomCode.value)
    copyFeedback.value = 'Code copied'
  } catch {
    copyFeedback.value = 'Copy failed'
  }
}

watch(roomCode, () => {
  copyFeedback.value = null
})
</script>

<template>
  <section class="w-full bg-white rounded-3xl shadow-sm p-5 sm:p-6 space-y-4">
    <GameSettings v-if="props.showSettings" />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-gray-900">Salle de jeu en ligne</h2>
      <span
        class="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
        :class="connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
      >
        {{ connected ? 'Connecté' : 'Déconnecté' }}
      </span>
    </div>

    <div v-if="!roomCode" class="grid gap-3 sm:grid-cols-2">
      <label class="sm:col-span-1 text-sm text-gray-700">
        Code de la salle
        <input
          v-model="joinCode"
          type="text"
          maxlength="6"
          class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 uppercase text-gray-900"
          placeholder="ABC123"
        />
      </label>

      <div class="sm:col-span-1 flex items-end gap-2">
        <button
          class="inline-flex px-4 py-2 rounded-full btn-primary font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onCreateRoom"
        >
          Créer
        </button>
        <button
          class="inline-flex px-4 py-2 rounded-full btn-primary font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onJoinRoom"
        >
          Rejoindre
        </button>
      </div>
    </div>

    <div v-if="roomCode" class="rounded-2xl border border-gray-200 p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <p class="text-sm text-gray-700">Code :</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] btn-primary text-xs font-semibold disabled:opacity-50"
            :disabled="busy"
            @click="onCopyRoomCode"
          >
            <CopyIcon class="h-4 w-4" />
            <span class="tracking-wider">{{ roomCode }}</span>
          </button>
          <span v-if="copyFeedback" class="text-xs text-gray-600">{{ copyFeedback }}</span>
        </div>
        <p class="text-sm text-gray-700 capitalize">Phase: <span class="font-semibold text-gray-900">{{ phase }}</span></p>
      </div>

      <div>
        <p class="text-sm font-semibold text-gray-900 mb-1">Players ({{ players.length }})</p>
        <ul class="text-sm text-gray-700 space-y-1">
          <li v-for="player in players" :key="player.id">
            {{ player.name }} <span v-if="player.id === hostId" class="text-xs text-gray-500">(host)</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="inline-flex px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold disabled:opacity-50"
          :disabled="busy || !canStart"
          @click="onStartGame"
        >
          Start game
        </button>
        <button
          v-if="canCreateNewGame"
          class="inline-flex px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onCreateNewGame"
        >
          Create new game
        </button>
        <button
          class="inline-flex px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-900 font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onLeaveGame"
        >
          Leave room
        </button>
      </div>
    </div>

    <p v-if="localError || socketError" class="text-sm text-red-600">
      {{ localError || socketError }}
    </p>
  </section>
</template>