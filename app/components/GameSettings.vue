<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import SettingsIcon from './Icons/SettingsIcon.vue'
import { useGameSettings, type GameSettings } from '../composables/useGameSettings'

const settings = useGameSettings()
const draftSettings = reactive<GameSettings>({ ...settings.value })
const saveFeedback = ref('')

const hasChanges = computed(() =>
    draftSettings.pseudo !== settings.value.pseudo ||
    draftSettings.questionSeconds !== settings.value.questionSeconds ||
    draftSettings.quizLength !== settings.value.quizLength ||
    draftSettings.questionType !== settings.value.questionType
)

function saveSettings() {
    settings.value = { ...settings.value, ...draftSettings }
    saveFeedback.value = 'Paramètres sauvegardés'

    setTimeout(() => {
        saveFeedback.value = ''
    }, 1500)
}

</script>
<template>
    <div class="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5 space-y-4">
        <div class="flex items-center gap-2 text-gray-900">
            <SettingsIcon />
            <span class="text-lg font-bold">Paramètres de la partie</span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
            <label class="sm:col-span-2 text-sm text-gray-700">
                Pseudo
                <input
                    v-model="draftSettings.pseudo"
                    class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
                    type="text"
                    placeholder="Pseudo"
                />
            </label>

            <label class="text-sm text-gray-700">
                Nombre de questions
        <input
                    v-model.number="draftSettings.quizLength"
                    class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="10"
        />
            </label>

            <label class="text-sm text-gray-700">
                Temps par question
                <select
                    v-model.number="draftSettings.questionSeconds"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900"
                >
                    <option :value="10">10s</option>
                    <option :value="15">15s</option>
                    <option :value="20">20s</option>
                    <option :value="30">30s</option>
                </select>
            </label>

            <label class="sm:col-span-2 text-sm text-gray-700">
                Type de questions
                <select
                    v-model="draftSettings.questionType"
                    class="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900"
                >
                    <option value="all">Toutes</option>
                    <option value="character-species">Espece du personnage</option>
                    <option value="character-movie">Film du personnage</option>
                    <option value="movie-character">Personnage du film</option>
                    <option value="japanese-name">Titre japonais</option>
                </select>
            </label>
        </div>

        <div class="flex items-center gap-3">
            <button
                class="inline-flex px-4 py-2 rounded-full btn-primary font-semibold disabled:opacity-50"
                :disabled="!hasChanges"
                @click="saveSettings"
            >
                Sauvegarder
            </button>
            <span v-if="saveFeedback" class="text-sm font-semibold text-emerald-700">{{ saveFeedback }}</span>
    </div>
    </div>
</template>
