<script setup lang="ts">
import { computed } from 'vue'

type StateCardVariant = 'loading' | 'error' | 'empty' | 'waiting'

const props = defineProps<{
  variant: StateCardVariant
}>()

const variantContent: Record<StateCardVariant, { title: string; description?: string }> = {
  loading: {
    title: 'Generation du quiz...',
    description: 'Preparation des questions en cours. Cela peut prendre quelques secondes selon les APIs.'
  },
  error: {
    title: 'Une erreur est survenue',
    description: 'Merci de reessayer.'
  },
  empty: {
    title: 'Aucun resultat',
    description: 'Aucun contenu a afficher.'
  },
  waiting: {
    title: "En attente de l'hote",
    description: "L'hote est en train de generer et partager les questions."
  }
}

const showSpinner = computed(() => props.variant === 'loading' || props.variant === 'waiting')
const titleClass = computed(() => (props.variant === 'error' ? 'text-red-700' : 'text-gray-900'))
const title = computed(() => variantContent[props.variant].title)
const description = computed(() => variantContent[props.variant].description)
</script>

<template>
  <div class="rounded-2xl bg-white p-6 text-gray-700 shadow-sm">
    <slot>
      <div class="space-y-4 text-center">
        <div
          v-if="showSpinner"
          class="mx-auto h-12 w-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin"
        ></div>
        <h2 class="text-2xl font-bold" :class="titleClass">
          {{ title }}
        </h2>
        <p v-if="description" class="text-gray-600">
          {{ description }}
        </p>
      </div>
    </slot>
  </div>
</template>
