<script setup lang="ts">
import { ref } from 'vue'

const hasStarted = ref(false)

function startGame() {
    hasStarted.value = true
}
</script>

<template>
    <div class="min-h-screen bg-gray-100 p-4">
        <!-- <h1 class="text-xl underline text-red-500">Game Page</h1> -->
        <!-- <WebSocket /> -->
        <div v-if="!hasStarted" class="flex flex-col items-start gap-4 max-w-xl mx-auto pt-8">
            <GameSettings />
            <button
                class="px-6 py-3 rounded-full bg-black text-white"
                @click="startGame"
            >
                Commencer la partie
            </button>
        </div>

        <GameBoard v-else />

    </div>
</template>