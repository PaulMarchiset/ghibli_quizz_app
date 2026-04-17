<script setup lang="ts">
import { computed } from 'vue'
import GameTimer from '../Game/GameTimer.vue'
import LeaderboardList from '../Shared/LeaderboardList.vue'
import ScorePanel from '../Shared/ScorePanel.vue'
import type { RoomPlayer } from '~/composables/useGameRoom'

const props = withDefaults(
  defineProps<{
    items: RoomPlayer[]
    inMultiplayerRoom: boolean
    playerName: string
    score: number
    variant?: 'mobile' | 'desktop'
    showTimer?: boolean
    timerKey?: number
    totalSeconds?: number
  }>(),
  {
    variant: 'desktop',
    showTimer: undefined
  }
)

const emit = defineEmits<{ (e: 'timeout'): void }>()

const wrapperClass = computed(() =>
  props.variant === 'mobile' ? 'space-y-3 lg:hidden' : 'flex flex-col gap-6'
)
const listVariant = computed(() => (props.variant === 'mobile' ? 'mobile' : 'desktop'))
const resolvedShowTimer = computed(() => props.showTimer ?? props.variant === 'desktop')
</script>

<template>
  <div :class="wrapperClass">
    <div v-if="resolvedShowTimer" class="flex justify-end">
      <GameTimer
        v-if="props.timerKey !== undefined && props.totalSeconds !== undefined"
        :key="props.timerKey"
        :totalSeconds="props.totalSeconds"
        @timeout="emit('timeout')"
      />
    </div>

    <p v-if="props.variant === 'mobile'" class="text-xs font-semibold uppercase tracking-wide text-gray-500">
      {{ props.inMultiplayerRoom ? 'Classement' : 'Votre score' }}
    </p>

    <LeaderboardList
      v-if="props.inMultiplayerRoom"
      :items="props.items"
      :variant="listVariant"
    />
    <ScorePanel v-else :rank="1" :name="props.playerName" :score="props.score" />
  </div>
</template>
