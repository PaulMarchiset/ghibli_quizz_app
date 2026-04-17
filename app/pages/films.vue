<script setup lang="ts">
import FilmCard from '~/components/Films/FilmCard.vue'
import FilterBar from '~/components/Filters/FilterBar.vue'
import FormField from '~/components/Shared/FormField.vue'
import SortDirectionToggle from '~/components/Shared/SortDirectionToggle.vue'
import StateCard from '~/components/Shared/StateCard.vue'
import StateMessage from '~/components/Shared/StateMessage.vue'
import { useFilms } from '~/composables/useFilms'

const {
  searchQuery,
  directorFilter,
  releaseYearFilter,
  sortDirection,
  sortDirectionLabel,
  toggleSortDirection,
  pending,
  error,
  movieList,
  filteredMovies,
  sortedMovies,
  directors,
  hasReleaseYears,
  minReleaseYear,
  maxReleaseYear,
  releaseYearLabel,
  resultCount
} = useFilms()
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-gray-900">Films</h1>
      <p class="text-gray-700">Explore la filmographie Ghibli et filtre tes recherches.</p>
    </div>

    <FilterBar>
      <template #filters>
        <FormField label="Recherche" for-id="film-search">
          <input
            id="film-search"
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher un film"
            class="w-64 max-w-full rounded-full bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
          />
        </FormField>

        <FormField label="Filtrer par realisateur" for-id="film-director">
          <select
            id="film-director"
            v-model="directorFilter"
            class="rounded-full bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm"
          >
            <option value="all">Tous</option>
            <option v-for="director in directors" :key="director" :value="director">
              {{ director }}
            </option>
          </select>
        </FormField>

        <FormField label="Filtrer par date" for-id="film-year">
          <div class="flex flex-wrap items-center gap-3 rounded-full bg-gray-50 px-3 py-2 shadow-sm">
            <input
              id="film-year"
              v-model.number="releaseYearFilter"
              type="range"
              :min="minReleaseYear"
              :max="maxReleaseYear"
              :disabled="!hasReleaseYears"
              class="range-control w-40"
            />
            <span class="text-xs text-gray-700">{{ releaseYearLabel }}</span>
          </div>
        </FormField>

        <div class="text-xs text-gray-500">
          {{ resultCount }} film(s)
        </div>
      </template>

      <template #actions>
        <SortDirectionToggle
          :direction="sortDirection"
          :label="sortDirectionLabel"
          rotate
          @toggle="toggleSortDirection"
        />
      </template>
    </FilterBar>

    <StateCard v-if="pending" variant="loading">
      <StateMessage title="Chargement des films..." />
    </StateCard>

    <StateCard v-else-if="error" variant="error">
      <StateMessage title="Impossible de charger les films pour le moment." />
    </StateCard>

    <StateCard v-else-if="movieList.length === 0" variant="empty">
      <StateMessage title="Aucun film disponible." />
    </StateCard>

    <StateCard v-else-if="filteredMovies.length === 0" variant="empty">
      <StateMessage title="Aucun film trouve pour ce filtre." />
    </StateCard>

    <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <FilmCard
        v-for="movie in sortedMovies"
        :key="movie.id"
        :movie="movie"
      />
    </div>
  </div>
</template>
