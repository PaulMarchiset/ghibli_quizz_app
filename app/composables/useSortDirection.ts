import { computed, ref } from 'vue'

export type SortDirection = 'asc' | 'desc'
export type SortDirectionLabels = {
  asc: string
  desc: string
}
export type SortDirectionOptions = {
  initial?: SortDirection
  labels?: SortDirectionLabels
}

/**
 * Composable for managing an ascending/descending sorting direction state.
 * @param options Optional configuration for initial direction and display labels.
 * @returns An object containing the reactive sort direction, its label, and a toggle method.
 */

export function useSortDirection(options: SortDirectionOptions = {}) {
  const sortDirection = ref<SortDirection>(options.initial ?? 'desc')
  const labels = options.labels ?? { asc: 'Croissant', desc: 'Decroissant' }

  const sortDirectionLabel = computed(() =>
    sortDirection.value === 'asc' ? labels.asc : labels.desc
  )

  function toggleSortDirection() {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }

  return {
    sortDirection,
    sortDirectionLabel,
    toggleSortDirection
  }
}
