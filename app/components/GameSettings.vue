<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import SettingsIcon from './Icons/SettingsIcon.vue'
import { useGameSettings, type GameSettings } from '../composables/useGameSettings'
import { QUESTION_TYPE_KEYS, type QuestionTypeKey } from '../services/game/quizGame'

const settings = useGameSettings()
const draftSettings = reactive<GameSettings>({ ...settings.value })
const saveFeedback = ref('')

const questionTypeOptions: { value: QuestionTypeKey; label: string }[] = [
    { value: 'character-species', label: 'Espece du personnage' },
    { value: 'character-movie', label: 'Film du personnage' },
    { value: 'movie-character', label: 'Personnage du film' },
    { value: 'japanese-name', label: 'Titre japonais' }
]

const allQuestionTypes = QUESTION_TYPE_KEYS

function normalizeQuestionTypes(values: QuestionTypeKey[]) {
    return values.length > 0 ? values : [...allQuestionTypes]
}

function areSameSelections(a: QuestionTypeKey[], b: QuestionTypeKey[]) {
    if (a.length !== b.length) return false
    return a.every((value) => b.includes(value))
}

const hasChanges = computed(() => {
    const normalizedDraft = normalizeQuestionTypes(draftSettings.questionTypes)
    const normalizedSaved = normalizeQuestionTypes(settings.value.questionTypes)

    return (
        draftSettings.pseudo !== settings.value.pseudo ||
        draftSettings.questionSeconds !== settings.value.questionSeconds ||
        draftSettings.quizLength !== settings.value.quizLength ||
        !areSameSelections(normalizedDraft, normalizedSaved)
    )
})

function saveSettings() {
    settings.value = {
        ...settings.value,
        ...draftSettings,
        questionTypes: normalizeQuestionTypes(draftSettings.questionTypes)
    }
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

            <div class="sm:col-span-2 text-sm text-gray-700">
                <p class="font-semibold">Type de questions</p>
                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                    <label
                        v-for="option in questionTypeOptions"
                        :key="option.value"
                        class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"
                    >
                        <input
                            v-model="draftSettings.questionTypes"
                            type="checkbox"
                            :value="option.value"
                            class="h-4 w-4"
                        />
                        <span>{{ option.label }}</span>
                    </label>
                </div>
                <p class="mt-2 text-xs text-gray-500">
                    Si rien n'est sélectionné, toutes les questions seront utilisées.
                </p>
            </div>
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
