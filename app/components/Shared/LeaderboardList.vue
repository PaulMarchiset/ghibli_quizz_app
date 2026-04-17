<script setup lang="ts">
import { computed } from 'vue'
import ScorePanel from './ScorePanel.vue'
import type { RoomPlayer } from '~/composables/useGameRoom'

const props = withDefaults(
  defineProps<{
    items: RoomPlayer[]
    variant?: 'mobile' | 'desktop'
  }>(),
  {
    variant: 'desktop'
  }
)

const listClass = computed(() =>
  props.variant === 'mobile' ? 'space-y-3' : 'flex flex-col gap-3'
)

const rankedItems = computed(() => {
  let lastScore: number | null = null
  let lastRank = 0

  return props.items.map((player, index) => {
    if (lastScore === player.score) {
      return { player, rank: lastRank }
    }

    lastScore = player.score
    lastRank = index + 1
    return { player, rank: lastRank }
  })
})
</script>

<template>
  <div :class="listClass">
    <ScorePanel
      v-for="entry in rankedItems"
      :key="entry.player.id"
      :rank="entry.rank"
      :name="entry.player.name"
      :score="entry.player.score"
    />
  </div>
</template>
