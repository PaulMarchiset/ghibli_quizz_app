<script setup lang="ts">
import { computed, ref } from 'vue'
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
  leaveGame
} = useGameRoom()

const playerName = ref(settings.value.pseudo.trim() || '')
const joinCode = ref('')
const localError = ref<string | null>(null)
const busy = ref(false)

const canStart = computed(() => phase.value === 'lobby' && isHost.value && players.value.length > 0)

async function onCreateRoom() {
  if (busy.value) return
  localError.value = null
  busy.value = true

  const response = await createGame(playerName.value.trim())

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

  const response = await joinGame(normalizedCode, playerName.value.trim())
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
</script>

<template>
  <section class="w-full bg-white rounded-3xl shadow-sm p-5 sm:p-6 space-y-4">
    <GameSettings v-if="props.showSettings" />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-gray-900">Socket Game Room</h2>
      <span
        class="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
        :class="connected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
      >
        {{ connected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <label class="sm:col-span-1 text-sm text-gray-700">
        Player name
        <input
          v-model="playerName"
          type="text"
          class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
          placeholder="Your name"
        />
      </label>

      <label class="sm:col-span-1 text-sm text-gray-700">
        Room code
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
          class="inline-flex px-4 py-2 rounded-full bg-black text-white font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onCreateRoom"
        >
          Create
        </button>
        <button
          class="inline-flex px-4 py-2 rounded-full bg-gray-900 text-white font-semibold disabled:opacity-50"
          :disabled="busy"
          @click="onJoinRoom"
        >
          Join
        </button>
      </div>
    </div>

    <div v-if="roomCode" class="rounded-2xl border border-gray-200 p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-gray-700">
          Room: <span class="font-bold tracking-wider text-gray-900">{{ roomCode }}</span>
        </p>
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