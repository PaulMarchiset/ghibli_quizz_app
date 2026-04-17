<script setup lang="ts">
import { computed } from 'vue'
import type { GhibliMovie } from '~/services/types/ghibli'

const props = defineProps<{
  movie: GhibliMovie
}>()

const posterUrl = computed(() => {
  const movie = props.movie
  return movie.image ?? movie.image_url ?? movie.movie_banner ?? ''
})

const japaneseTitle = computed(() => {
  return props.movie.original_title || props.movie.original_title_romanised || ''
})
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-white shadow-sm">
    <div class="aspect-[3/4] w-full bg-gray-100">
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="movie.title"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-xs text-gray-400">
        No image
      </div>
    </div>

    <div class="space-y-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">{{ movie.title }}</h2>
          <p v-if="japaneseTitle" class="text-xs text-gray-500">
            Titre japonais : {{ japaneseTitle }}
          </p>
        </div>
        <span v-if="movie.release_date" class="text-xs text-gray-500">
          {{ movie.release_date }}
        </span>
      </div>

      <p v-if="movie.description" class="text-sm text-gray-600 line-clamp-3">
        {{ movie.description }}
      </p>

      <div class="text-xs text-gray-500">Realisateur : {{ movie.director || 'Inconnu' }}</div>
    </div>
  </article>
</template>
