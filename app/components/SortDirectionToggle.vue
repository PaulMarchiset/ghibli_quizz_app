<script setup lang="ts">
import { computed } from 'vue'
import ArrowsIcon from '~/components/Icons/ArrowsIcon.vue'

const props = withDefaults(
  defineProps<{
    direction: 'asc' | 'desc'
    label: string
    rotate?: boolean
    buttonClass?: string
    iconClass?: string
  }>(),
  {
    rotate: false,
    buttonClass:
      'inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700',
    iconClass: 'h-4 w-4'
  }
)

const emit = defineEmits<{ (e: 'toggle'): void }>()

const iconClasses = computed(() => {
  if (!props.rotate) return props.iconClass
  const rotation = props.direction === 'desc' ? 'rotate-180' : 'rotate-0'
  return `${props.iconClass} transition-transform ease-in ${rotation}`
})
</script>

<template>
  <button type="button" :class="buttonClass" @click="emit('toggle')">
    <ArrowsIcon :class="iconClasses" />
    {{ label }}
  </button>
</template>
