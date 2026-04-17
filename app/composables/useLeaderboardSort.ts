import { computed, ref, unref, type ComputedRef, type Ref } from 'vue'

export type LeaderboardItem = {
  name: string
  score: number
}

export type LeaderboardSortKey = 'score' | 'name'
export type LeaderboardSortDirection = 'asc' | 'desc'

export type LeaderboardSortOptions = {
  initialKey?: LeaderboardSortKey
  initialDirection?: LeaderboardSortDirection
}

/**
 * Composable for sorting leaderboard items by score or name.
 * @param items Reactive array of leaderboard items to sort.
 * @param options Optional initial sorting configuration (key and direction).
 * @returns An object containing the sort state, a toggle method, and the computed sorted items.
 */

export function useLeaderboardSort<T extends LeaderboardItem>(
  items: Ref<T[]> | ComputedRef<T[]>,
  options: LeaderboardSortOptions = {}
) {
  const sortKey = ref<LeaderboardSortKey>(options.initialKey ?? 'score')
  const sortDirection = ref<LeaderboardSortDirection>(options.initialDirection ?? 'desc')

  function toggleSort() {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  }

  const sortedItems = computed(() => {
    const list = [...unref(items)]
    const direction = sortDirection.value === 'asc' ? 1 : -1

    if (sortKey.value === 'name') {
      return list.sort((a, b) => {
        const nameOrder = a.name.localeCompare(b.name) * direction
        if (nameOrder !== 0) return nameOrder
        return (a.score - b.score) * direction
      })
    }

    return list.sort((a, b) => {
      if (a.score !== b.score) return (a.score - b.score) * direction
      return a.name.localeCompare(b.name)
    })
  })

  return {
    sortKey,
    sortDirection,
    toggleSort,
    sortedItems
  }
}
