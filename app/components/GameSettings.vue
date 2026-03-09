<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import SettingsIcon from './Icons/SettingsIcon.vue';
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
    <div class="settings-item">
        <div class="icon-section">
            <span class="settings-label">
                <SettingsIcon /> Paramètres
            </span>
        </div>

        <label class="field">
            <span class="field-label">Pseudo</span>
        <input
            v-model="draftSettings.pseudo"
            class="name"
            type="text"
            placeholder="Pseudo"
        />
        </label>

        <label class="field">
            <span class="field-label">Nombre de questions</span>
        <input
            v-model="draftSettings.quizLength"
            class="name"
            type="number"
            placeholder="Nombre de questions"
        />
        </label>

        <label class="field">
            <span class="field-label">Temps par question</span>
            <select v-model.number="draftSettings.questionSeconds" class="select">
                <option :value="10">10s</option>
                <option :value="15">15s</option>
                <option :value="20">20s</option>
                <option :value="30">30s</option>
            </select>
        </label>

        <label class="field">
            <span class="field-label">Type de questions</span>
            <select v-model="draftSettings.questionType" class="select">
                <option value="all">Toutes</option>
                <option value="character-species">Espèce du personnage</option>
                <option value="character-movie">Film du personnage</option>
                <option value="movie-character">Personnage du film</option>
                <option value="japanese-name">Titre japonais</option>
            </select>
        </label>

        <div class="actions">
            <button class="save-button" :disabled="!hasChanges" @click="saveSettings">
                Sauvegarder
            </button>
            <span v-if="saveFeedback" class="save-feedback">{{ saveFeedback }}</span>
        </div>
    </div>
</template>

<style scoped>
.settings-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: white;
    border-radius: 24px;
    padding: 0.5rem 1.5rem 0.5rem 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 400px;
}

.icon-section {
    display: flex;
    width: 100%;
}

.settings-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: #000;
}

.name {
    font-size: 1rem;
    font-weight: 400;
    color: #000;
    max-width: fit-content;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.75rem;
}

.field-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #000;
}

.select {
    font-size: 1rem;
    font-weight: 400;
    color: #000;
    max-width: fit-content;
}

.actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
}

.save-button {
    font-size: 0.95rem;
    font-weight: 600;
    color: white;
    background: black;
    border: none;
    border-radius: 9999px;
    padding: 0.45rem 1rem;
    cursor: pointer;
}

.save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.save-feedback {
    font-size: 0.85rem;
    font-weight: 600;
    color: #166534;
}
</style>