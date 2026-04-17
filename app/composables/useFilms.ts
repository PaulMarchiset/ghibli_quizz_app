import { computed, ref, watch } from 'vue'
import { useSortDirection } from '~/composables/useSortDirection'
import { allMovies } from '~/services/api/Movies'
import type { GhibliMovie } from '~/services/types/ghibli'

/**
 * Composable for managing Ghibli movies, including fetching, filtering, sorting, and search state.
 * @returns An object containing reactive state and computed properties for the movie list UI.
 */

export function useFilms() {
  const searchQuery = ref('')
  const directorFilter = ref<'all' | string>('all')
  const releaseYearFilter = ref(0)
  const { sortDirection, sortDirectionLabel, toggleSortDirection } = useSortDirection({
    labels: {
      asc: 'Croissant',
      desc: 'Décroissant'
    }
  })

  const { data: movies, pending, error } = useAsyncData<GhibliMovie[]>(
    'ghibli-movies',
    () => allMovies(),
    {
      default: () => []
    }
  )

  const movieList = computed(() => movies.value ?? [])

  const directors = computed(() => {
    const directorSet = new Set<string>()

    movieList.value.forEach((movie) => {
      if (movie.director) directorSet.add(movie.director)
    })

    return Array.from(directorSet).sort((a, b) => a.localeCompare(b))
  })

  const releaseYearNumbers = computed(() =>
    movieList.value
      .map((movie) => Number(movie.release_date))
      .filter((year) => Number.isFinite(year))
  )

  const hasReleaseYears = computed(() => releaseYearNumbers.value.length > 0)

  const minReleaseYear = computed(() =>
    hasReleaseYears.value ? Math.min(...releaseYearNumbers.value) : 0
  )

  const maxReleaseYear = computed(() =>
    hasReleaseYears.value ? Math.max(...releaseYearNumbers.value) : 0
  )

  const releaseYearLabel = computed(() => {
    if (!hasReleaseYears.value) return '-'
    return `Depuis ${releaseYearFilter.value}`
  })

  watch(
    [minReleaseYear, hasReleaseYears],
    ([minYear, hasYears]) => {
      if (!hasYears) {
        releaseYearFilter.value = 0
        return
      }

      if (releaseYearFilter.value === 0) {
        releaseYearFilter.value = minYear
      }
    },
    { immediate: true }
  )

  const filteredMovies = computed(() => {
    let results = movieList.value

    if (directorFilter.value !== 'all') {
      results = results.filter((movie) => movie.director === directorFilter.value)
    }

    if (hasReleaseYears.value && releaseYearFilter.value > 0) {
      results = results.filter((movie) => {
        const year = Number(movie.release_date)
        return Number.isFinite(year) && year >= releaseYearFilter.value
      })
    }

    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return results

    return results.filter((movie) => {
      const haystack = [
        movie.title,
        movie.original_title,
        movie.original_title_romanised,
        movie.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  })

  const sortedMovies = computed(() => {
    const results = [...filteredMovies.value]
    const direction = sortDirection.value === 'asc' ? 1 : -1

    return results.sort((a, b) => {
      const yearA = Number(a.release_date)
      const yearB = Number(b.release_date)

      if (Number.isFinite(yearA) && Number.isFinite(yearB) && yearA !== yearB) {
        return (yearA - yearB) * direction
      }

      return a.title.localeCompare(b.title) * direction
    })
  })

  const resultCount = computed(() => filteredMovies.value.length)

  return {
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
  }
}
